# @hoseinh/react-ocr

React components and a hook to perform OCR on images and handwriting using Tesseract.js, Groq Vision, or a custom OCR handler.

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

## OCR Backends

- Tesseract.js — on-device browser OCR (default)
- Groq Vision — cloud-based LLM vision
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

