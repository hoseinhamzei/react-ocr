import { useState } from "react";
import { CanvasInput, ImageInput } from "./components";
import "./assets/style.css";

function App() {
  const [detected, setDetected] = useState<string | null>(null);

  function handleDetect(detectedText: string) {
    setDetected(detectedText);
  }

  return (
    <>
      <header>
        <h3>React OCR Input Demo</h3>
      </header>

      <main>
        <h4>Canvas Input:</h4>
        <CanvasInput onDetect={handleDetect} />
        <br />
        <hr />
        <br />
        <h4>Drag and Drop Image File Input:</h4>
        <ImageInput onDetect={handleDetect} />
        <hr />

        <h4>Detected:</h4>
        <p>{detected || "-"}</p>
      </main>

      <footer>
        Developed by:{" "}
        <a href="https://github.com/hoseinhamzei" target="_blank">
          Hosein Hamzenejad
        </a>
      </footer>
    </>
  );
}

export default App;
