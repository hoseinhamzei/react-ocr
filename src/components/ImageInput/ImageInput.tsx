import React, { useRef } from 'react';
import Tesseract from 'tesseract.js';

interface ImageInputProps {
  onDetect: (detectedText: string) => void;
  onFile?: (file: File) => void;
  lang?: string;
  className?: string;
  style?: React.CSSProperties;
}

const ImageInput: React.FC<ImageInputProps> = ({
  onDetect,
  onFile,
  lang = 'eng',
  className,
  style,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (onFile) onFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          Tesseract.recognize(reader.result as string, lang)
            .then(({ data: { text } }) => {
              onDetect(text);
            })
            .catch((error) => console.error('Tesseract error:', error));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      if (onFile) onFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          Tesseract.recognize(reader.result as string, lang)
            .then(({ data: { text } }) => {
              onDetect(text);
            })
            .catch((error) => console.error('Tesseract error:', error));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div
      className={className}
      style={{
        ...style,
        border: '2px dashed #ccc',
        padding: '20px',
        textAlign: 'center',
        cursor: 'pointer',
      }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      Drag & Drop an image here or click to select a file
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