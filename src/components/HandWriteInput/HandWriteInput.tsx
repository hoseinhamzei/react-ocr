import React, { useRef, useEffect, useState } from 'react';
import { createWorker, Lang, OEM, PSM } from 'tesseract.js';
import { preProcessCanvas } from '../../utils/utils';

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

  const [isDrawing, setIsDrawing] = useState(false);
  const [image, setImage] = useState<string | null>(null);

  const tesseractWorker = createWorker(lang, OEM.LSTM_ONLY);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = maxWidth;
      canvas.height = height;
    }
  }, [maxWidth, height]);

  useEffect(() => {
    if (image) {
      const imageElement = document.createElement('img');
      imageElement.src = image;
      imageElement.onload = () => {
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(imageElement, 0, 0);
          }
        }
      };
    }
  }, [image]);

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
    setImage(null);
  };

  const detectText = async () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const blob = preProcessCanvas(canvas);
      if (blob) {
        try {
          const ocr = await tesseractWorker;
          ocr.setParameters({
            tessedit_pageseg_mode: pageSegMode,
          });

          const detected = ocr.recognize(blob);
          if (detected) {
            onDetect((await detected).data.text.trim());
          }
        } catch (err) {
          console.error("Tesseract OCR Error:", err);
        }
      }

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
        style={{ display: 'block', width: '100%', height: '100%', cursor: 'crosshair' }}
      ></canvas>
      <button onClick={handleClear} style={{ marginTop: '10px' }}>
        Clear
      </button>
      {image && <img src={image} alt="handwriting" style={{ marginTop: '10px' }} />}
    </div>
  );
};

export default HandWriteInput;
