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
    <div>
      <div>
        <label>
          <input
            type="radio"
            name="ocr-provider"
            value="tesseract"
            checked={selectedProvider === "tesseract"}
            onChange={() => onProviderChange("tesseract")}
          />
          Tesseract
        </label>
        {" "}
        <label>
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
    </div>
  );
};
