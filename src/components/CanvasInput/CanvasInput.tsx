import React, {
  useRef,
  useEffect,
  useState,
  ReactElement,
  useTransition,
} from "react";
import { createWorker, OEM, PSM, Worker } from "tesseract.js"; // Added Worker type
import { LangCode, LanguageCodes, OCRService } from "../../types/types";
// import { handWriteBlackList } from "../../utils/constants"; // Commented out as tessedit_char_blacklist is not used
import { preProcessImage } from "../../utils/utils";
import { performGoogleVisionOCR } from "../../utils/googleVisionApi";

interface CanvasInputProps {
  maxWidth?: number;
  height?: number;
  timeout?: number;
  lang?: LangCode | LangCode[];
  onDetect: (detectedText: string) => void;
  className?: string;
  style?: React.CSSProperties;
  pageSegMode?: PSM;
  OCRMode?: OEM;
  loadingContent?: ReactElement;
  ocrService?: OCRService;
  googleVisionApiKey?: string;
}

const CanvasInput: React.FC<CanvasInputProps> = ({
  maxWidth = 400,
  height = 300,
  timeout = 3,
  lang = LanguageCodes.English,
  onDetect,
  className,
  pageSegMode = PSM.SINGLE_LINE,
  OCRMode = OEM.TESSERACT_LSTM_COMBINED,
  style,
  loadingContent,
  ocrService = "tesseract",
  googleVisionApiKey,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const workerRef = useRef<Promise<Worker> | null>(null); // Changed Tesseract.Worker to Worker
  const [isPending, startOCRTransition] = useTransition();

  const [isDrawing, setIsDrawing] = useState(false);
  const [loading, setLoading] = useState(false);

  // prevent recreation of the worker in every rerender

    // Initialize Tesseract worker only if it's the selected service or no service is specified (defaults to tesseract)
    if (ocrService === "tesseract" && !workerRef.current) {
      workerRef.current = createWorker(lang, OCRMode);
    }
  }, [lang, OCRMode, ocrService]); // Add ocrService to dependency array

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = maxWidth;
      canvas.height = height;
    }
  }, [maxWidth, height]);

  //

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (ctx) {
        ctx.beginPath();
        ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = "black";
        ctx.lineCap = "round";
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (ctx) {
        ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
        ctx.stroke();
      }
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    const id = setTimeout(() => detectText(), timeout * 1000);
    timeoutRef.current = id;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    setIsDrawing(true);
    const touch = e.touches[0];
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const offsetX = touch.clientX - rect.left;
      const offsetY = touch.clientY - rect.top;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (ctx) {
        ctx.beginPath();
        ctx.moveTo(offsetX, offsetY);
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = "black";
        ctx.lineCap = "round";
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const touch = e.touches[0];
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const offsetX = touch.clientX - rect.left;
      const offsetY = touch.clientY - rect.top;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (ctx) {
        ctx.lineTo(offsetX, offsetY);
        ctx.stroke();
      }
    }
  };

  const handleTouchEnd = () => {
    setIsDrawing(false);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    const id = setTimeout(() => detectText(), timeout * 1000);
    timeoutRef.current = id;
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    setLoading(false);
  };

  const detectText = async () => {
    setLoading(true);

    const canvas = canvasRef.current;

    if (canvas) {
      startOCRTransition(async () => {
        setLoading(true);
        try {
          if (ocrService === "googleVision") {
            if (!googleVisionApiKey) {
              console.error(
                "Google Vision API key is missing in CanvasInput. OCR not attempted."
              );
              setLoading(false);
              return;
            }
            // No need to call preProcessImage for Google Vision, it handles raw images
            const base64ImageData = canvas
              .toDataURL("image/png")
              .split(",")[1]; // Get base64 part
            const detectedText = await performGoogleVisionOCR(
              base64ImageData,
              googleVisionApiKey
            );
            onDetect(detectedText.trim());
          } else {
            // Default to Tesseract
            if (!workerRef.current) {
                console.error("Tesseract worker not initialized for CanvasInput.");
                setLoading(false);
                return;
            }
            const processedBlob = await preProcessImage(canvas);
            const ocr = await workerRef.current; // Use workerRef.current directly
            const ocrConfig: Partial<Tesseract.WorkerParams> = { // Tesseract type from tesseract.js
              tessedit_pageseg_mode: pageSegMode,
              // tessedit_char_blacklist: handWriteBlackList.join(), // Removed as per previous changes
            };
            ocr.setParameters(ocrConfig);
            const { data: { text } } = await ocr.recognize(processedBlob);
            if (text) {
              onDetect(text.trim());
            } else {
              console.log("No text detected by Tesseract in CanvasInput.");
            }
          }
        } catch (err) {
          if (ocrService === "googleVision") {
            console.error("Google Vision API Error in CanvasInput:", err);
          } else {
            console.error("Tesseract OCR Error in CanvasInput:", err);
          }
        } finally {
          handleClear(); // Clear canvas regardless of success or failure, after processing
          setLoading(false);
        }
      });
    }
  };

  //

  return (
    <div
      className={`canvas-input ${className}`}
      style={{ maxWidth: maxWidth, height, ...style }}
    >
      <canvas
        className="canvas-input-canvas"
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      ></canvas>
      {(loading || isPending) && (
        <div className="canvas-input-loading">
          {loadingContent || "Please Wait..."}
        </div>
      )}
    </div>
  );
};

export default CanvasInput;
