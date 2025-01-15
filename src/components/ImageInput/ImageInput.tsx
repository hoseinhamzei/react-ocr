import React, { useRef } from 'react';
import { Lang, OEM, PSM, createWorker } from 'tesseract.js';
import { preProcessImage } from '../../utils/utils';

interface ImageInputProps {
  onDetect: (detectedText: string) => void;
  onFile?: (file: File) => void;
  lang?: string | string[] | Lang[];
  className?: string;
  style?: React.CSSProperties;
  pageSegMode?: PSM.AUTO
  hint?: string
}

const ImageInput: React.FC<ImageInputProps> = ({
  onDetect,
  onFile,
  lang = 'eng',
  className,
  style,
  pageSegMode = PSM.AUTO,
  hint = "Drag & Drop an image here or click to select a file"
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const tesseractWorker = createWorker(lang, OEM.LSTM_ONLY);

  const performOCR = (file: File | undefined) => {
    if (file) {
      if (onFile) onFile(file);
      const reader = new FileReader();
      reader.onload = async () => {
        if (reader.result) {

          const blob = await preProcessImage(reader.result as string);

          if (blob) {
            try {
              const ocr = await tesseractWorker;
              ocr.setParameters({
                tessedit_pageseg_mode: pageSegMode,
              });

              const detected = await ocr.recognize(blob);
              if (detected) {
                onDetect((detected).data.text.trim());
              }
            } catch (err) {
              console.error("Tesseract OCR Error:", err);
            }
          }
        }
      };
    }
  }

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
      style={style}
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
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default ImageInput;