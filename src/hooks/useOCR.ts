import { useRef, useEffect, useState } from "react";
import { createWorker, OEM, PSM, Worker } from "tesseract.js";
import {
  OCRService,
  TesseractLangCode,
  TesseractLanguageCodes,
} from "../types/types";
import { performTesseractOcr } from "../utils/ocr/tesseract";
import { performGroqOcr } from "../utils/ocr/groq";

export type CustomOCRHandler = (params: {
  file: File;
  base64: string;
}) => Promise<string>;

export interface UseOCRProps {
  /**
   * OCR provider to use for text extraction.
   * Defaults to `"tesseract"` when not specified.
   */
  ocrService?: OCRService;
  /**
   * Language code(s) for Tesseract OCR.
   * Falls back to English when omitted.
   */
  lang?: TesseractLangCode | TesseractLangCode[];
  /**
   * Tesseract Page Segmentation Mode.
   */
  pageSegMode?: PSM;
  /**
   * Tesseract OCR Engine Mode.
   */
  OCRMode?: OEM;
  /**
   * When `true`, enables additional pre-processing optimised for
   * handwriting drawn on the canvas component.
   */
  isCanvasHandwrite?: boolean;
  /**
   * API key for the Groq Vision provider. Required when
   * `ocrService` is set to `"groq"`.
   */
  groqApiKey?: string;

  /**
   * Custom OCR handler. Required when `ocrService` is set to `"custom"`.
   */
  customOCRHandler?: CustomOCRHandler;

}

const DEFAULT_TESSERACT_LANG = TesseractLanguageCodes.English;

/**
 * Custom hook for performing OCR (Optical Character Recognition) on image files.
 * Supports both Tesseract.js and Groq Vision API for text extraction.
 *
 * @param props - Configuration options for the OCR hook
 * @param props.ocrService - The OCR service to use ('tesseract' | 'groq' | 'custom')
 * @param props.lang - Language code(s) for Tesseract OCR (defaults to English)
 * @param props.pageSegMode - Page segmentation mode for Tesseract (defaults to SINGLE_LINE)
 * @param props.OCRMode - OCR engine mode for Tesseract (defaults to TESSERACT_LSTM_COMBINED)
 * @param props.isCanvasHandwrite - Performs specific pre-processing if enabled (defaults to false)
 * @param props.groqApiKey - API key for Groq Vision API (required when using 'groq' service)
 * @param props.customOCRHandler - Custom OCR adapter (required when using 'custom')
 *
 * @returns Object containing:
 * - performOCR: Function to perform OCR on a file and returns detected text
 * - isOCRPending: Boolean indicating if OCR processing is currently in progress
 * - detectedText: Detected text after performing ocr
 *
 * @example
 * ```tsx
 * const { performOCR, isOCRPending, detectedText } = useOCR({
 *   ocrService: 'tesseract',
 *   lang: 'eng',
 *   pageSegMode: PSM.SINGLE_LINE
 * });
 * ```
 */
export const useOCR = ({
  ocrService = "tesseract",
  lang = DEFAULT_TESSERACT_LANG,
  pageSegMode = PSM.SINGLE_LINE,
  OCRMode = OEM.TESSERACT_LSTM_COMBINED,
  isCanvasHandwrite = false,
  groqApiKey,
  customOCRHandler,
}: UseOCRProps) => {
  const workerRef = useRef<Promise<Worker> | null>(null);
  const [isOCRPending, setIsOCRPending] = useState(false);
  const [detectedText, setDetectedText] = useState<string>("");
  const [error, setError] = useState<Error | null>(null);

  // Manage Tesseract worker lifecycle
  useEffect(() => {
    const shouldUseTesseract = ocrService === "tesseract";

    const terminateWorker = () => {
      if (!workerRef.current) return;

      workerRef.current
        .then((workerInstance) => workerInstance.terminate())
        .catch(() => undefined);

      workerRef.current = null;
    };

    if (shouldUseTesseract) {
      // Lazily create the worker the first time Tesseract is requested.
      if (!workerRef.current) {
        workerRef.current = createWorker(lang, OCRMode);
      }
    } else {
      terminateWorker();
    }

    return terminateWorker;
  }, [ocrService, lang, OCRMode]);

  /**
   * Performs OCR on the provided image file.
   *
   * @param file - The image file to process for text extraction
   * @returns Promise<void>
   */
  const performOCR = async (file: File) => {
    if (!file) {
      const noFileErr = new Error("No File Provided to the performOCR function.");
      console.error(noFileErr);
      setError(noFileErr);
      return;
    }

    const service = ocrService;
    const apiKey = groqApiKey;

    setIsOCRPending(true);
    setDetectedText("");
    setError(null);

    try {
      // Providers (custom, Groq, Tesseract) work from a base64 image.
      const base64ImageData = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
          const result = reader.result;

          if (typeof result !== "string") {
            reject(new Error("File reading failed in useOCR."));
            return;
          }

          const base64 = result.split(",")[1];
          if (!base64) {
            reject(new Error("Invalid base64 data in useOCR."));
            return;
          }

          resolve(base64);
        };

        reader.onerror = () => {
          reject(reader.error ?? new Error("FileReader error in useOCR."));
        };

        reader.readAsDataURL(file);
      });

      if (service === "custom") {
        if (!customOCRHandler) {
          const customHandlerErr = new Error(
            "customOCRHandler is missing in useOCR. OCR not attempted.",
          );
          console.error(customHandlerErr);
          setError(customHandlerErr);
          return;
        }

        const text = await customOCRHandler({
          file,
          base64: base64ImageData,
        });

        setDetectedText(text || "");
        return;
      }

      if (service === "groq") {
        if (!apiKey) {
          const groqKeyErr = new Error(
            "Groq API key is missing in useOCR. OCR not attempted.",
          );
          console.error(groqKeyErr);
          setError(groqKeyErr);
          return;
        }

        const text = await performGroqOcr(apiKey, base64ImageData);
        setDetectedText(text || "");
        return;
      }

      // Tesseract by default
      const workerPromise = workerRef.current;

      if (!workerPromise) {
        const workerErr = new Error("Tesseract worker not initialized.");
        console.error(workerErr);
        setError(workerErr);
        return;
      }

      const reader = { result: `data:image/png;base64,${base64ImageData}` } as FileReader;

      const text = await performTesseractOcr(
        workerPromise,
        reader,
        pageSegMode,
        isCanvasHandwrite,
      );

      setDetectedText(text || "");
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      setError(e);
      console.error("OCR Error in useOCR:", e);
      throw err;
    } finally {
      setIsOCRPending(false);
    }
  };

  return {
    performOCR,
    isOCRPending,
    detectedText,
    error,
  };
};