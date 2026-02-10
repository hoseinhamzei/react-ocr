import React, { ReactElement, useRef, useEffect, useCallback } from "react";
import { OEM, PSM } from "tesseract.js";
import { useOCR, type CustomOCRHandler } from "../../hooks/useOCR";
import {
  OCRService,
  TesseractLangCode,
  TesseractLanguageCodes,
} from "../../types/types";

/**
 * Props for the ImageInput component
 * @typedef {Object} ImageInputProps
 * @property {(detectedText: string) => void} onDetect - Callback function called when text is detected from the image
 * @property {() => void} [onStartDetecting] - Optional callback function called when OCR detection starts
 * @property {(file: File) => void} [onFile] - Optional callback function called when a file is selected
 * @property {string} [className=""] - Additional CSS class names for the container
 * @property {React.CSSProperties} [style] - Inline styles for the container
 * @property {OCRService} [ocrService="tesseract"] - OCR service to use ("tesseract" or "groq")
 * @property {TesseractLangCode | TesseractLangCode[]} [lang=TesseractLanguageCodes.English] - Language or languages for OCR
 * @property {PSM} [pageSegMode=PSM.AUTO] - Tesseract page segmentation mode
 * @property {OEM} [OCRMode=OEM.TESSERACT_LSTM_COMBINED] - Tesseract OCR engine mode
 * @property {string} [hint="Drag & Drop an image here or click to select a file"] - Hint text displayed in the drop zone
 * @property {string} [maxWidth="400px"] - Maximum width of the component (CSS value)
 * @property {ReactElement} [loadingContent] - Custom loading indicator content
 * @property {string} [groqApiKey] - API key for Groq service if using groq as ocrService
 * @property {CustomOCRHandler} [customOCRHandler] - Custom OCR handler when `ocrService` is "custom"
 */
export interface ImageInputProps {
  onDetect: (detectedText: string) => void;
  onFile?: (file: File) => void;
  onError?: (error: Error) => void;
  onStartDetecting?: () => void;
  className?: string;
  style?: React.CSSProperties;
  ocrService?: OCRService;
  lang?: TesseractLangCode | TesseractLangCode[];
  pageSegMode?: PSM;
  OCRMode?: OEM;
  hint?: string;
  maxWidth?: string;
  loadingContent?: ReactElement;
  groqApiKey?: string;
  customOCRHandler?: CustomOCRHandler;
}

const DEFAULT_TESSERACT_LANG = TesseractLanguageCodes.English;

/**
 * ImageInput Component
 *
 * A React component that provides an image-based OCR input interface.
 * Users can upload images via drag-and-drop or file selection, and the
 * text in the images is extracted using OCR (Optical Character Recognition).
 *
 * @component
 * @param {ImageInputProps} props - The component props
 * @returns {ReactElement} The rendered image input component
 *
 * @example
 * // Basic usage
 * <ImageInput
 *   onDetect={(text) => console.log('Detected:', text)}
 * />
 *
 * @example
 * // With Groq service and custom callbacks
 * <ImageInput
 *   onDetect={(text) => setDetectedText(text)}
 *   onFile={(file) => console.log('File selected:', file.name)}
 *   onStartDetecting={() => setIsLoading(true)}
 *   ocrService="groq"
 *   groqApiKey="your-api-key"
 *   lang="fra"
 *   hint="Drop your document here"
 *   loadingContent={<Spinner />}
 * />
 */
const ImageInput: React.FC<ImageInputProps> = ({
  onDetect,
  onFile,
  onError,
  onStartDetecting,
  className = "",
  style,
  pageSegMode = PSM.AUTO,
  OCRMode = OEM.TESSERACT_LSTM_COMBINED,
  hint = "Drag & Drop an image here or click to select a file",
  maxWidth = "400px",
  loadingContent,
  lang = DEFAULT_TESSERACT_LANG,
  ocrService = "tesseract",
  groqApiKey,
  customOCRHandler,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { performOCR, isOCRPending, detectedText } = useOCR({
    ocrService,
    lang,
    pageSegMode,
    OCRMode,
    groqApiKey,
    customOCRHandler,
  });

  useEffect(() => {
    if (detectedText && !isOCRPending) {
      onDetect(detectedText);
    }
  }, [detectedText, isOCRPending, onDetect]);

  const handleFileSelect = useCallback(
    async (file: File | null | undefined) => {
      if (!file) return;

      if (onFile) {
        onFile(file);
      }

      if (onStartDetecting) {
        onStartDetecting();
      }

      try {
        await performOCR(file);
      } catch (error) {
        if (onError) {
          onError(error as Error);
        }
      }
    },
    [onFile, onStartDetecting, onError, performOCR],
  );

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] ?? null;
      await handleFileSelect(file);
    },
    [handleFileSelect],
  );

  const handleDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0] ?? null;
      await handleFileSelect(file);
    },
    [handleFileSelect],
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div
      className={`image-input ${className}`.trim()}
      style={{ maxWidth, ...style }}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleClick}
      data-testid="image-input-container"
      role="region"
      aria-label="Image File Input for OCR"
      tabIndex={0}
    >
      <span id="image-input-hint">{hint}</span>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="image-input-input"
        data-testid="image-input-element"
        aria-label="Upload image for OCR"
        aria-describedby="image-input-hint"
      />
      {isOCRPending && (
        <div className="image-input-loading" role="status" aria-live="polite">
          {loadingContent || "Please Wait..."}
        </div>
      )}
    </div>
  );
};

export default ImageInput;
