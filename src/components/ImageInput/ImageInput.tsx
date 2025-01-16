import React, { ReactElement, useRef, useState } from "react";
import { Lang, PSM } from "tesseract.js";
import { initTesseractWorker, preProcessImage } from "../../utils/utils";

interface ImageInputProps {
  onDetect: (detectedText: string) => void;
  onFile?: (file: File) => void;
  lang?: string | string[] | Lang[];
  className?: string;
  style?: React.CSSProperties;
  pageSegMode?: PSM;
  hint?: string;
  maxWidth?: string;
  loadingContent?: ReactElement
}

const ImageInput: React.FC<ImageInputProps> = ({
  onDetect,
  onFile,
  lang = "eng",
  className,
  style,
  pageSegMode = PSM.AUTO,
  hint = "Drag & Drop an image here or click to select a file",
  maxWidth = "400px",
  loadingContent
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const workerRef = useRef<Promise<Tesseract.Worker> | null>(null);
  const [loading, setLoading] = useState(false);

  if (!workerRef.current) {
    workerRef.current = initTesseractWorker(lang);
  }

  const tesseractWorker = workerRef.current;

  //

  const performOCR = (file: File | undefined) => {
    if (file) {
      if (onFile) onFile(file);
      const reader = new FileReader();
      reader.readAsDataURL(file);

      reader.onload = async () => {
        if (reader.result) {
          setLoading(true);
          const blob = await preProcessImage(reader.result as string);

          if (blob) {
            try {
              const ocr = await tesseractWorker;
              ocr.setParameters({
                tessedit_pageseg_mode: pageSegMode,
              });

              const detected = await ocr.recognize(blob);
              setLoading(false);
              if (detected) {
                onDetect(detected.data.text.trim());
              }
            } catch (err) {
              console.error("Tesseract OCR Error:", err);
              setLoading(false);
            }
          } else {
            setLoading(false);
          }
        }
      };

      reader.onerror = () => {
        console.error("Error reading file");
      };
    }
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
      />
      {loading && (
        <div className="image-input-loading">
          {loadingContent || "Please Wait..."}
        </div>
      )}
    </div>
  );
};

export default ImageInput;
