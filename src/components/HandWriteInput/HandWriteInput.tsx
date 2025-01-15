import React, { useRef, useEffect, useState } from 'react';
import { Lang, OEM, PSM } from 'tesseract.js';
import { initTesseractWorker, preProcessCanvas } from '../../utils/utils';

interface HandWriteInputProps {
  maxWidth?: number;
  height?: number;
  timeout?: number;
  lang?: string | string[] | Lang[];
  onDetect: (detectedText: string) => void;
  className?: string;
  style?: React.CSSProperties;
  pageSegMode?: PSM;
}

const HandWriteInput: React.FC<HandWriteInputProps> = ({
  maxWidth = 500,
  height = 300,
  timeout = 3,
  lang = 'eng',
  onDetect,
  className,
  pageSegMode = PSM.SINGLE_LINE,
  style,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const workerRef = useRef<Promise<Tesseract.Worker> | null>(null);

  const [isDrawing, setIsDrawing] = useState(false);

  // prevent recreation of the worker in every rerender
  if (!workerRef.current) {
    workerRef.current = initTesseractWorker(lang);
  }
  const tesseractWorker = workerRef.current;
  console.log("rerender test");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = maxWidth;
      canvas.height = height;
    }
  }, [maxWidth, height]);


  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.beginPath();
        ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
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
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  };

  const detectText = async () => {
    const canvas = canvasRef.current;
    if (canvas) {

      canvas.toBlob(async (blob) => {
        if (blob) {
          try {
            const ocr = await tesseractWorker;
            ocr.setParameters({
              tessedit_pageseg_mode: pageSegMode,
            });

            const detected = await ocr.recognize(blob);
            handleClear();
            if (detected) {
              onDetect((detected).data.text.trim());
            } else {
              console.log("No text detected");
            }
          } catch (err) {
            console.error("Tesseract OCR Error:", err);
            handleClear();
          }
        }
      });


    }
  };

  return (
    <div
      className={`handwrite-input ${className}`}
      style={{ width: maxWidth, height, ...style }}
    >
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      ></canvas>
    </div>
  );
};

export default HandWriteInput;
