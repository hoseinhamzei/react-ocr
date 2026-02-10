# ImageInput

`ImageInput` is a file-drop / file-picker component that accepts an image and runs OCR using the selected backend.

Props (short): `onDetect`, `onFile?`, `onError?`, `onStartDetecting?`, `ocrService?`, `lang?`, `pageSegMode?`, `OCRMode?`, `groqApiKey?`, `customOCRHandler?`, `loadingContent?`.

Basic (Tesseract.js):

```tsx
import { ImageInput } from "@hoseinh/react-ocr";

<ImageInput onDetect={(text) => console.log(text)} />
```

Using Groq (cloud):

```tsx
<ImageInput
  onDetect={(t) => console.log(t)}
  ocrService="groq"
  groqApiKey={process.env.GROQ_KEY}
/>
```

Custom handler:

```tsx
<ImageInput
  ocrService="custom"
  customOCRHandler={async ({ file, base64 }) => {
    // call your API with base64
    return fetch("/api/ocr", { method: "POST", body: base64 }).then(r => r.text())
  }}
  onDetect={(t) => console.log(t)}
/>
```

Notes
- `onDetect` fires after OCR completes and returns detected text (string).
- `loadingContent` can customize the in-component loader UI.
- Accepts images via drag/drop or click-select. Accessible via keyboard.
