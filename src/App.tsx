// filepath: d:\codes\react-handwrite-input\src\App.tsx
import { useState, useEffect } from "react";
import { CanvasInput, ImageInput } from "./components";
import "./assets/style.css";
import { OCRService, TesseractLanguageCodes } from "./types/types";
import { OCRProviderSelector } from "./components/OCRProviderSelector";

function App() {
  const [canvasDetected, setCanvasDetected] = useState<string | null>(null);
  const [imageDetected, setImageDetected] = useState<string | null>(null);
  const [ocrProvider, setOcrProvider] = useState<OCRService>("tesseract");

  // Reset detected text when switching providers
  useEffect(() => {
    setCanvasDetected(null);
    setImageDetected(null);
  }, [ocrProvider]);

  function handleCanvasDetect(detectedText: string) {
    setCanvasDetected(detectedText);
  }

  function handleImageDetect(detectedText: string) {
    setImageDetected(detectedText);
  }

  function handleError(error: Error) {
    console.error("Error during OCR detection:", error);
    setCanvasDetected("Error during OCR detection. Please try again.");
    setImageDetected("Error during OCR detection. Please try again.");
  }

  return (
    <>
      <header role="banner" aria-label="App Header">
        <h3>React OCR Input Demo</h3>
      </header>

      <main role="main" aria-label="OCR Input Main Content">
        <div>
          <div aria-label="OCR Provider Selection" role="radiogroup">
            <h4>OCR Provider:</h4>
            <OCRProviderSelector
              selectedProvider={ocrProvider}
              onProviderChange={setOcrProvider}
            />
          </div>
          <br />
          <h4>Canvas Input:</h4>
          <CanvasInput
            key={`canvas-${ocrProvider}`}
            onDetect={handleCanvasDetect}
            onError={handleError}
            lang={TesseractLanguageCodes.English}
            ocrService={ocrProvider}
            aria-label="Handwriting Canvas Input"
            groqApiKey={import.meta.env.VITE_GROQ_API_KEY || undefined}
          />
          <br />
          <br />
          <h4>Drag and Drop Image File Input:</h4>
          <ImageInput
            key={`image-${ocrProvider}`}
            onDetect={handleImageDetect}
            onError={handleError}
            lang={TesseractLanguageCodes.English}
            ocrService={ocrProvider}
            aria-label="Image File Input for OCR"
            groqApiKey={import.meta.env.VITE_GROQ_API_KEY || undefined}
          />
        </div>

        <div>
          <h4>Detected (Canvas):</h4>
          <div aria-live="polite" className="detected-text">
            {canvasDetected || "No text detected yet."}
          </div>

          <h4>Detected (Image):</h4>
          <div aria-live="polite" className="detected-text">
            {imageDetected || "No text detected yet."}
          </div>
        </div>
      </main>

      <footer role="contentinfo" aria-label="App Footer">
        Developed by:{" "}
        <a
          href="https://github.com/hoseinhamzei"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="GitHub profile of Hosein Hamzenejad"
        >
          Hosein Hamzenejad
        </a>
      </footer>
    </>
  );
}

export default App;
