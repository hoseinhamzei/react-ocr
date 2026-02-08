import { useRef, useEffect, useState } from "react";
import { createWorker, OEM, PSM, Worker } from "tesseract.js";
import {
  OCRService,
  TesseractLangCode,
  TesseractLanguageCodes,
} from "../types/types";
import { performTesseractOcr } from "../utils/ocr/tesseract";
import { performGroqOcr } from "../utils/ocr/groq";

interface UseOCRProps {
  ocrService: OCRService;
  lang?: TesseractLangCode | TesseractLangCode[];
  pageSegMode?: PSM;
  OCRMode?: OEM;
  groqApiKey?: string;
}

const DEFAULT_TESSERACT_LANG = TesseractLanguageCodes.English;

/**
 * Custom hook for performing OCR (Optical Character Recognition) on image files.
 * Supports both Tesseract.js and Groq Vision API for text extraction.
 *
 * @param props - Configuration options for the OCR hook
 * @param props.ocrService - The OCR service to use ('tesseract' or 'groq')
 * @param props.lang - Language code(s) for Tesseract OCR (defaults to English)
 * @param props.pageSegMode - Page segmentation mode for Tesseract (defaults to SINGLE_LINE)
 * @param props.OCRMode - OCR engine mode for Tesseract (defaults to TESSERACT_LSTM_COMBINED)
 * @param props.groqApiKey - API key for Groq Vision API (required when using 'groq' service)
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
  groqApiKey,
}: UseOCRProps) => {
  const workerRef = useRef<Promise<Worker> | null>(null);
  const [isOCRPending, setIsOCRPending] = useState(false);
  const [detectedText, setDetectedText] = useState<string>("");

  // Manage Tesseract worker lifecycle
  useEffect(() => {
    if (ocrService === "tesseract") {
      if (!workerRef.current) {
        workerRef.current = createWorker(lang, OCRMode);
      }
    } else {
      // Terminate worker if switching away from tesseract
      if (workerRef.current) {
        workerRef.current
          .then((workerInstance) => workerInstance.terminate())
          .catch(() => undefined);
        workerRef.current = null;
      }
    }
    return () => {
      if (workerRef.current) {
        workerRef.current
          .then((workerInstance) => workerInstance.terminate())
          .catch(() => undefined);
        workerRef.current = null;
      }
    };
  }, [ocrService, lang, OCRMode]);

  /**
   * Performs OCR on the provided image file.
   *
   * @param file - The image file to process for text extraction
   * @returns Promise<void>
   */
  const performOCR = async (file: File) => {
    if (!file) {
      console.error("No File Provided to the performOCR function.");
      return;
    }
    // Capture at invoke time so the async reader callback uses the correct provider
    // (avoids stale closure when onload runs after re-renders or provider switch)
    const service = ocrService;
    const apiKey = groqApiKey;

    setIsOCRPending(true);
    setDetectedText(""); // Clear previous text

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const res = reader.result;

          if (!res) {
            return;
          }

          if (typeof res !== "string") {
            throw new Error("File reading failed in useOCR.");
          }

          if (service === "groq") {
            if (!apiKey) {
              console.error(
                "Groq API key is missing in useOCR. OCR not attempted.",
              );
              setIsOCRPending(false);
              return;
            }
            const base64ImageData = res.split(",")[1];
            const text = await performGroqOcr(apiKey, base64ImageData);
            setDetectedText(text || "");
            setIsOCRPending(false);
          } else {
            // Tesseract
            const workerPromise = workerRef.current;
            if (!workerPromise) {
              console.error("Tesseract worker not initialized.");
              setIsOCRPending(false);
              return;
            }
            const text = await performTesseractOcr(
              workerPromise,
              { result: res } as FileReader,
              pageSegMode,
            );
            setDetectedText(text || "");
            setIsOCRPending(false);
          }
        } catch (err) {
          console.error("OCR Error in useOCR:", err);
          setIsOCRPending(false);
        }
      };
      reader.onerror = () => {
        console.error(reader.error);
        setIsOCRPending(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("OCR Error in useOCR:", err);
      setIsOCRPending(false);
    }
  };

  return {
    performOCR,
    isOCRPending,
    detectedText,
  };
};
