import "./components/index.css";

export { default as ImageInput } from "./components/ImageInput/ImageInput";
export type { ImageInputProps } from "./components/ImageInput/ImageInput";

export { default as CanvasInput } from "./components/CanvasInput/CanvasInput";
export type { CanvasInputProps } from "./components/CanvasInput/CanvasInput";

export { useOCR } from "./hooks/useOCR";
export type { UseOCRProps } from "./hooks/useOCR";

export { TesseractLanguageCodes, type TesseractLangCode, type OCRService } from "./types/types";

export { performGroqOcr } from "./utils/ocr/groq";
export { performTesseractOcr } from "./utils/ocr/tesseract";
