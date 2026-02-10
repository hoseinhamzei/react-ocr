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
        <span className="header-meta">
          Developed by:{' '}
          <a
            href="https://hoseinh.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub profile of Hosein Hamzenejad"
          >
            Hosein Hamzenejad
          </a>
        </span>
      </header>

      <section aria-label="Library Description" className="intro">
        <p>
          This demo showcases the <code>react-ocr</code> library, which provides a{' '}
          <code>useOCR</code> hook plus ready-made <code>CanvasInput</code> and{' '}
          <code>ImageInput</code> components for handwriting and image-based OCR in React applications.
        </p>
        <p>
          You can switch between OCR providers, capture text from a drawing canvas or uploaded images, and handle detection results and errors through a simple callback-based API.
          See the full documentation on{' '}
          <a
            href="https://github.com/hoseinhamzei/react-ocr"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
          .
        </p>
      </section>

      <main role="main" aria-label="OCR Input Main Content">
        <div>
          <div aria-label="OCR Provider Selection" role="radiogroup" className="provider-row">
            <h4>OCR Provider</h4>
            <OCRProviderSelector
              selectedProvider={ocrProvider}
              onProviderChange={setOcrProvider}
            />
          </div>
          <h4>Canvas Input</h4>
          <CanvasInput
            key={`canvas-${ocrProvider}`}
            aria-label="Handwriting Canvas Input"
            onDetect={handleCanvasDetect}
            onError={handleError}
            lang={TesseractLanguageCodes.English}
            ocrService={ocrProvider}
            groqApiKey={import.meta.env.VITE_GROQ_API_KEY || undefined}
          />
          <div className="spacer" />
          <h4>Drag and Drop Image File Input</h4>
          <ImageInput
            aria-label="Image File Input for OCR"
            key={`image-${ocrProvider}`}
            onDetect={handleImageDetect}
            onError={handleError}
            lang={TesseractLanguageCodes.English}
            ocrService={ocrProvider}
            groqApiKey={import.meta.env.VITE_GROQ_API_KEY || undefined}
          />
        </div>

        <div>
          <h4>Detected (Canvas)</h4>
          <div aria-live="polite" className="detected-text">
            {canvasDetected || <span className="placeholder">No text detected yet.</span>}
          </div>

          <h4>Detected (Image)</h4>
          <div aria-live="polite" className="detected-text">
            {imageDetected || <span className="placeholder">No text detected yet.</span>}
          </div>
        </div>
      </main>
    </>
  );
}

export default App;
