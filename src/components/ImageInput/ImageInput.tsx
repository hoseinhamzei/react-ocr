import React, { ReactElement, useRef, useTransition } from "react"; // Removed useState as isPending handles loading state
import { createWorker, OEM, PSM, Worker } from "tesseract.js"; // Added Worker type
import { preProcessImage } from "../../utils/utils";
import { LangCode, LanguageCodes, OCRService } from "../../types/types";
import { performGoogleVisionOCR } from "../../utils/googleVisionApi";

interface ImageInputProps {
  onDetect: (detectedText: string) => void;
  onFile?: (file: File) => void;
  lang?: LangCode | LangCode[];
  className?: string;
  style?: React.CSSProperties;
  pageSegMode?: PSM;
  OCRMode?: OEM;
  hint?: string;
  maxWidth?: string;
  loadingContent?: ReactElement;
  ocrService?: OCRService;
  googleVisionApiKey?: string;
}

const ImageInput: React.FC<ImageInputProps> = ({
  onDetect,
  onFile,
  lang = LanguageCodes.English,
  className,
  style,
  pageSegMode = PSM.SINGLE_LINE,
  OCRMode = OEM.TESSERACT_LSTM_COMBINED,
  hint = "Drag & Drop an image here or click to select a file",
  maxWidth = "400px",
  loadingContent,
  ocrService = "tesseract",
  googleVisionApiKey,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const workerRef = useRef<Promise<Worker> | null>(null); // Changed Tesseract.Worker to Worker
  const [isPending, startOCRTransition] = useTransition();

  // Initialize Tesseract worker only if it's the selected service or default
  if (ocrService === "tesseract" && !workerRef.current) {
    // This check should ideally be in a useEffect or a more controlled setup,
    // but for minimal changes, we ensure it's only called if needed.
    // Consider moving worker initialization to a useEffect hook based on ocrService.
     workerRef.current = createWorker(lang, OCRMode);
  }


  const performOCR = (file: File | undefined) => {
    if (!file) {
      return;
    }

    startOCRTransition(async () => {
      if (onFile) {
        onFile(file);
      }
      const reader = new FileReader();
      reader.readAsDataURL(file);

      reader.onload = async () => {
        if (!reader.result) {
          console.error("File reading failed in ImageInput.");
          return;
        }
        try {
          if (ocrService === "googleVision") {
            if (!googleVisionApiKey) {
              console.error(
                "Google Vision API key is missing in ImageInput. OCR not attempted."
              );
              return;
            }
            const base64ImageData = (reader.result as string).split(",")[1];
            const detectedText = await performGoogleVisionOCR(
              base64ImageData,
              googleVisionApiKey
            );
            onDetect(detectedText.trim());
          } else {
            // Default to Tesseract
            if (!workerRef.current) {
                console.error("Tesseract worker not initialized for ImageInput.");
                return;
            }
            const blob = await preProcessImage(reader.result as string);
            if (!blob) {
                console.error("Image preprocessing failed in ImageInput.");
                return;
            }
            const ocr = await workerRef.current;
            ocr.setParameters({
              tessedit_pageseg_mode: pageSegMode,
            });
            const { data: { text } } = await ocr.recognize(blob);
            if (text) {
              onDetect(text.trim());
            } else {
              console.log("No text detected by Tesseract in ImageInput.");
            }
          }
        } catch (err) {
          if (ocrService === "googleVision") {
            console.error("Google Vision API Error in ImageInput:", err);
          } else {
            console.error("Tesseract OCR Error in ImageInput:", err);
          }
        }
      };
      reader.onerror = () => {
        console.error("Error reading file in ImageInput:", reader.error);
      };
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    performOCR(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    performOCR(file);
  };

  const handleClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div
      className={`image-input ${className}`}
      style={{ maxWidth: maxWidth, ...style }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      {hint}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="image-input-input"
        data-testid="image-input-element"
      />
      {isPending && (
        <div className="image-input-loading">
          {loadingContent || "Please Wait..."}
        </div>
      )}
    </div>
  );
};

export default ImageInput;
