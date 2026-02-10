import React from "react";
import { OCRService } from "../types/types";

type Props = {
  selectedProvider: OCRService;
  onProviderChange: (provider: OCRService) => void;
};

export const OCRProviderSelector: React.FC<Props> = ({
  selectedProvider,
  onProviderChange,
}) => {
  return (
    <div className="ocr-provider-selector">
      <div className="ocr-provider-options">
        <label className={selectedProvider === 'tesseract' ? 'ocr-radio selected' : 'ocr-radio'}>
          <input
            type="radio"
            name="ocr-provider"
            value="tesseract"
            checked={selectedProvider === "tesseract"}
            onChange={() => onProviderChange("tesseract")}
          />
          Tesseract
        </label>
        <label className={selectedProvider === 'groq' ? 'ocr-radio selected' : 'ocr-radio'}>
          <input
            type="radio"
            name="ocr-provider"
            value="groq"
            checked={selectedProvider === "groq"}
            onChange={() => onProviderChange("groq")}
          />
          Groq
        </label>
      </div>
      <ul>
        <li>
          <strong>Tesseract:</strong> Client-side OCR best for standard, printed text. Low accuracy for handwritten text.
        </li>
        <li>
          <strong>Groq:</strong> Cloud OCR that works well for both images and handwriting.
        </li>
      </ul>
    </div>
  );
};
