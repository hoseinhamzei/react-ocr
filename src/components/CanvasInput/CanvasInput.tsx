import React, {
  useRef,
  useEffect,
  useState,
  ReactElement,
  useCallback,
} from "react";
import { OEM, PSM } from "tesseract.js";
import {
  TesseractLangCode,
  TesseractLanguageCodes,
  OCRService,
} from "../../types/types";
import { useOCR } from "../../hooks/useOCR";

/**
 * Props for the CanvasInput component
 * @typedef {Object} CanvasInputProps
 * @property {number} [maxWidth=400] - Maximum width of the canvas in pixels
 * @property {number} [height=300] - Height of the canvas in pixels
 * @property {number} [timeout=3] - Timeout in seconds before triggering OCR after drawing stops
 * @property {TesseractLangCode | TesseractLangCode[]} [lang=TesseractLanguageCodes.English] - Language or languages for OCR
 * @property {(detectedText: string) => void} onDetect - Callback function called when text is detected
 * @property {() => void} [onStartDetecting] - Optional callback function called when OCR detection starts
 * @property {string} [className=""] - Additional CSS class names for the container
 * @property {React.CSSProperties} [style] - Inline styles for the container
 * @property {PSM} [pageSegMode=PSM.AUTO] - Tesseract page segmentation mode
 * @property {OEM} [OCRMode=OEM.TESSERACT_LSTM_COMBINED] - Tesseract OCR engine mode
 * @property {ReactElement} [loadingContent] - Custom loading indicator content
 * @property {OCRService} [ocrService="tesseract"] - OCR service to use ("tesseract" or "groq")
 * @property {string} [groqApiKey] - API key for Groq service if using groq as ocrService
 * @property {number} [lineWidth=2.5] - Width of the drawing line in pixels
 * @property {string} [strokeStyle="black"] - Color of the drawing stroke
 */
export interface CanvasInputProps {
  maxWidth?: number;
  height?: number;
  timeout?: number;
  lang?: TesseractLangCode | TesseractLangCode[];
  onDetect: (detectedText: string) => void;
  onError?: (error: Error) => void;
  onStartDetecting?: () => void;
  className?: string;
  style?: React.CSSProperties;
  pageSegMode?: PSM;
  OCRMode?: OEM;
  loadingContent?: ReactElement;
  ocrService?: OCRService;
  groqApiKey?: string;
  lineWidth?: number;
  strokeStyle?: string;
}

/**
 * CanvasInput Component
 *
 * A React component that provides a canvas-based handwriting input interface.
 * Users can draw on the canvas using mouse or touch, and the drawn content is
 * automatically converted to text using OCR (Optical Character Recognition).
 *
 * @component
 * @param {CanvasInputProps} props - The component props
 * @returns {ReactElement} The rendered canvas input component
 *
 * @example
 * // Basic usage
 * <CanvasInput
 *   onDetect={(text) => console.log('Detected:', text)}
 *   maxWidth={400}
 *   height={300}
 * />
 *
 * @example
 * // With Groq service and custom styling
 * <CanvasInput
 *   onDetect={(text) => setDetectedText(text)}
 *   ocrService="groq"
 *   groqApiKey="your-api-key"
 *   lineWidth={3}
 *   strokeStyle="blue"
 *   loadingContent={<Spinner />}
 * />
 */
const CanvasInput: React.FC<CanvasInputProps> = ({
  maxWidth = 400,
  height = 300,
  timeout = 3,
  lang = TesseractLanguageCodes.English,
  onDetect,
  onError,
  onStartDetecting,
  className = "",
  pageSegMode = PSM.AUTO,
  OCRMode = OEM.TESSERACT_LSTM_COMBINED,
  style,
  loadingContent,
  ocrService = "tesseract",
  groqApiKey,
  lineWidth = 2.5,
  strokeStyle = "black",
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const hasDrawnRef = useRef(false);
  const { performOCR, isOCRPending, detectedText } = useOCR({
    ocrService,
    lang,
    pageSegMode,
    OCRMode,
    groqApiKey,
  });

  const [isDrawing, setIsDrawing] = useState(false);
  const previousDetectedTextRef = useRef<string>("");

  useEffect(() => {
    if (detectedText && !isOCRPending && detectedText !== previousDetectedTextRef.current) {
      previousDetectedTextRef.current = detectedText;
      onDetect(detectedText);
    }
  }, [detectedText, isOCRPending, onDetect]);

  useEffect(() => {
    // Reset tracking when service changes
    previousDetectedTextRef.current = "";
  }, [ocrService]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = maxWidth;
      canvas.height = height;
    }
  }, [maxWidth, height]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const getCoordinates = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };

      const rect = canvas.getBoundingClientRect();

      if ("touches" in e) {
        const touch = e.touches[0];
        return {
          x: touch.clientX - rect.left,
          y: touch.clientY - rect.top,
        };
      } else {
        return {
          x: e.nativeEvent.offsetX,
          y: e.nativeEvent.offsetY,
        };
      }
    },
    [],
  );

  const startDrawing = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      setIsDrawing(true);
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (ctx) {
          const { x, y } = getCoordinates(e);
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineWidth = lineWidth;
          ctx.strokeStyle = strokeStyle;
          ctx.lineCap = "round";
        }
      }
    },
    [lineWidth, strokeStyle, getCoordinates],
  );

  const draw = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      if (!isDrawing) return;
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (ctx) {
          const { x, y } = getCoordinates(e);
          ctx.lineTo(x, y);
          ctx.stroke();
          hasDrawnRef.current = true;
        }
      }
    },
    [isDrawing, getCoordinates],
  );

  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    // Only schedule detection if the user actually drew; avoids sending empty canvas
    // when mouseLeave/touchEnd fires after we've already detected and cleared
    if (hasDrawnRef.current) {
      // Move detectText above this useCallback to avoid lint error.
      timeoutRef.current = setTimeout(() => detectText(), timeout * 1000);
    }
  }, [timeout]);

  const handleClear = useCallback(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, []);

  const detectText = useCallback(async () => {
    const canvas = canvasRef.current;
    if (canvas) {
      try {
        canvas.toBlob(async (blob) => {
          if (blob) {
            const file = new File([blob], "canvas-image.png", {
              type: "image/png",
            });
            if (onStartDetecting) {
              onStartDetecting();
            }
            await performOCR(file);
            // Only clear after OCR is actually performed
            handleClear();
            // Prevent a later mouseLeave/touchEnd from scheduling another detectText(empty canvas)
            hasDrawnRef.current = false;
          }
        }, "image/png");
      } catch (err) {
        console.error("OCR Error in CanvasInput:", err);
        if (onError) {
          onError(err as Error);
        }
      }
      // Remove handleClear() from finally
    }
  }, [performOCR, handleClear, onStartDetecting, onError]);

  return (
    <div
      className={`canvas-input ${className}`.trim()}
      style={{ maxWidth: maxWidth, height, ...style }}
      data-testid="canvas-input-container"
      role="region"
      aria-label="Handwriting Canvas Input"
    >
      <canvas
        className="canvas-input-canvas"
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        role="img"
        aria-label="Drawing canvas for handwriting input"
        aria-live="polite"
        tabIndex={0}
        data-testid="canvas-element"
      />
      {isOCRPending && (
        <div className="canvas-input-loading" role="status" aria-live="polite">
          {loadingContent || "Please Wait..."}
        </div>
      )}
    </div>
  );
};

export default CanvasInput;
