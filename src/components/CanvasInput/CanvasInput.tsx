import React, { useRef, useEffect, useState, ReactElement } from "react";
import { createWorker, OEM, PSM } from "tesseract.js";
import { LangCode, LanguageCodes } from "../../types/types";
import { handWriteBlackList } from "../../utils/constants";

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
}

const CanvasInput: React.FC<CanvasInputProps> = ({
  maxWidth = 400,
  height = 300,
  timeout = 3,
  lang = LanguageCodes.English,
  onDetect,
  className,
  pageSegMode = PSM.AUTO,
  OCRMode = OEM.TESSERACT_LSTM_COMBINED,
  style,
  loadingContent,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const workerRef = useRef<Promise<Tesseract.Worker> | null>(null);
  //
  const [isDrawing, setIsDrawing] = useState(false);
  const [loading, setLoading] = useState(false);

  // prevent recreation of the worker in every rerender
  if (!workerRef.current) {
    workerRef.current = createWorker(lang, OCRMode);
  }
  const tesseractWorker = workerRef.current;

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
      const ctx = canvas.getContext("2d", {willReadFrequently: true});
      if (ctx) {
        ctx.beginPath();
        ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = 'black';
        ctx.lineCap = 'round';
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d", {willReadFrequently: true});
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

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d", {willReadFrequently: true});
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

      canvas.toBlob(async (blob)=>{
        if (blob) {
          try {
            const ocr = await tesseractWorker;
  
            const ocrConfig: Partial<Tesseract.WorkerParams> = {
              tessedit_pageseg_mode: pageSegMode,
              tessedit_char_blacklist: handWriteBlackList.join(),
            };
  
            ocr.setParameters(ocrConfig);
  
            const detected = await ocr.recognize(blob);
            handleClear();
            if (detected) {
              onDetect(detected.data.text.trim());
            } else {
              console.log("No text detected");
            }
          } catch (err) {
            console.error("Tesseract OCR Error:", err);
            handleClear();
          }
        }
      })
      
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
      ></canvas>
      {loading && (
        <div className="canvas-input-loading">
          {loadingContent || "Please Wait..."}
        </div>
      )}
    </div>
  );
};

export default CanvasInput;
