import React, { useRef, useEffect, useState, ReactElement } from "react";
import { Lang, PSM } from "tesseract.js";
import {
  handWriteBlackList,
  initTesseractWorker,
  preProcessCanvas,
} from "../../utils/utils";

interface CanvasInputProps {
  maxWidth?: number;
  height?: number;
  timeout?: number;
  lang?: string | string[] | Lang[];
  onDetect: (detectedText: string) => void;
  className?: string;
  style?: React.CSSProperties;
  pageSegMode?: PSM;
  loadingContent?: ReactElement;
}

const CanvasInput: React.FC<CanvasInputProps> = ({
  maxWidth = 400,
  height = 300,
  timeout = 3,
  lang = "eng",
  onDetect,
  className,
  pageSegMode = PSM.AUTO,
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
    workerRef.current = initTesseractWorker(lang);
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
      const blob = await preProcessCanvas(canvas);

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
