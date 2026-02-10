# useOCR

`useOCR` is a hook that exposes `performOCR`, `isOCRPending`, `detectedText`, and `error`.

Signature

```ts
const { performOCR, isOCRPending, detectedText, error } = useOCR(props: UseOCRProps)
```

Use cases
- Programmatically run OCR on a `File` without a UI component
- Drive OCR from your own uploader or server-proxy
- Integrate a custom backend or cloud OCR service via `customOCRHandler`

Full signature

```ts
const { performOCR, isOCRPending, detectedText, error } = useOCR(props?: UseOCRProps)
// performOCR(file: File): Promise<void>
```

Basic example — Tesseract (client-side)

```tsx
import React from "react";
import { useOCR } from "@hoseinh/react-ocr";

function Example() {
  const { performOCR, isOCRPending, detectedText, error } = useOCR({ ocrService: "tesseract", lang: "eng" });

  async function onFile(file: File) {
    await performOCR(file);
    // detectedText will be updated after performOCR resolves
    console.log("detected:", detectedText, "error:", error);
  }

  return <input type="file" accept="image/*" onChange={(e) => onFile(e.target.files?.[0] as File)} />;
}
```

Groq (cloud) example

```tsx
import { useOCR } from "@hoseinh/react-ocr";

const { performOCR } = useOCR({ ocrService: "groq", groqApiKey: process.env.NEXT_PUBLIC_GROQ_KEY });

// then call performOCR(file)
```

Custom backend — full example

This demonstrates a realistic custom backend flow where your server receives a base64 image and returns detected text.

Server (example Express endpoint):

```js
// POST /api/ocr
// Body: { imageBase64: string }
app.post('/api/ocr', express.json({ limit: '10mb' }), async (req, res) => {
  const { imageBase64 } = req.body;
  // call your preferred OCR provider here and return the text
  const detectedText = await callYourCloudOCR(imageBase64);
  res.json({ text: detectedText });
});
```

Client: pass a `customOCRHandler` to `useOCR` or to `ImageInput`/`CanvasInput` props.

```tsx
import { useOCR } from "@hoseinh/react-ocr";

const customOCRHandler = async ({ file, base64 }: { file: File; base64: string }) => {
  // Example: POST base64 to your server which calls a cloud OCR
  const resp = await fetch('/api/ocr', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64: base64 }),
  });
  if (!resp.ok) throw new Error('OCR request failed');
  const json = await resp.json();
  return json.text as string;
};

function ExampleCustom() {
  const { performOCR, detectedText } = useOCR({ ocrService: 'custom', customOCRHandler });

  async function onFile(file: File) {
    await performOCR(file); // uses customOCRHandler internally
    console.log('text', detectedText);
  }

  return <input type="file" onChange={(e) => onFile(e.target.files?.[0] as File)} />;
}
```

Using `ImageInput` with `customOCRHandler`

```tsx
<ImageInput
  ocrService="custom"
  customOCRHandler={customOCRHandler}
  onDetect={(text) => console.log('detected', text)}
/>
```

Low-level / advanced: running `performTesseractOcr` directly

If you need direct control over Tesseract worker lifecycle, create a worker with `createWorker` and pass it to `performTesseractOcr`:

```ts
import { createWorker } from 'tesseract.js';
import { performTesseractOcr } from '@hoseinh/react-ocr';

const workerPromise = createWorker({ /* options */ });
await workerPromise.load();
await workerPromise.loadLanguage('eng');
await workerPromise.initialize('eng');

const reader = { result: 'data:image/png;base64,...' } as FileReader;
const text = await performTesseractOcr(workerPromise, reader, /* pageSegMode */ 3, /* isCanvasHandwrite */ false);
```

Error handling and UX

- Check `isOCRPending` to show loading UI.
- Inspect `error` returned from the hook to show messages.
- `performOCR` throws if low-level errors occur — wrap calls in try/catch.

SSR note

Do not run OCR during server render. Use client-only guards or dynamic import (see `docs/ssr.md`).
