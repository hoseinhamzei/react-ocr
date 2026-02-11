# @hoseinh/react-ocr

[![npm version](https://img.shields.io/npm/v/%40hoseinh%2Freact-ocr.svg)](https://www.npmjs.com/package/%40hoseinh%2Freact-ocr)
[![npm downloads](https://img.shields.io/npm/dm/%40hoseinh%2Freact-ocr.svg)](https://www.npmjs.com/package/%40hoseinh%2Freact-ocr)

React components and a hook to perform OCR on images and handwriting using Tesseract.js, Groq Vision, or a custom OCR handler.

Demo: [react-ocr-demo.hoseinh.com](https://react-ocr-demo.hoseinh.com)

## Installation

Install from npm:

```bash
npm install @hoseinh/react-ocr
# or
yarn add @hoseinh/react-ocr
```

Note: React and ReactDOM are peer dependencies — ensure your project already depends on React.

## Quick Start

```tsx
import React from "react";
import { CanvasInput, ImageInput } from "@hoseinh/react-ocr";

export default function App() {
  return (
    <div>
      <CanvasInput onDetect={(t) => console.log("canvas:", t)} />
      <ImageInput onDetect={(t) => console.log("image:", t)} />
    </div>
  );
}
```

The package barrel imports the component CSS automatically, so no extra CSS import is required for defaults.

### Using the `useOCR` Hook for Custom Implementations

for custom UI implementation use `useOCR` hook directly:

```tsx
import React, { useState } from "react";
import { useOCR } from "@hoseinh/react-ocr";

export default function CustomOCRComponent() {
  const [result, setResult] = useState("");
  const { performOCR, isOCRPending, error } = useOCR({
    ocrService: "tesseract",
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await performOCR(file);
    }
  };

  return (
    <div>
      <input type="file" accept="image/*" onChange={handleFileUpload} />
      {isOCRPending && <p>Processing...</p>}
      {error && <p style={{ color: "red" }}>Error: {error.message}</p>}
      <textarea value={result} onChange={(e) => setResult(e.target.value)} />
    </div>
  );
}
```

## OCR Backends

- Tesseract.js — on-device browser OCR (default)
- [Groq](https://groq.com/) Vision — cloud-based LLM vision
- Custom — provide a `customOCRHandler` to integrate any backend

See detailed examples in `docs/` (imageInput.md, canvasInput.md, useOCR.md).

## Documentation

- [API Reference](docs/api.md)
- [ImageInput Usage](docs/imageInput.md)
- [CanvasInput Usage](docs/canvasInput.md)
- [useOCR Hook](docs/useOCR.md)
- [SSR considerations](docs/ssr.md)

---

For information about publishing and build artifacts see `package.json` and `vite.config.ts`.

