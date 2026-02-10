# CanvasInput

`CanvasInput` provides a drawing canvas for handwriting. After the user stops drawing it converts the canvas to an image and runs OCR.

Key props: `onDetect` (required), `maxWidth`, `height`, `timeout`, `ocrService`, `groqApiKey`, `customOCRHandler`, `lineWidth`, `strokeStyle`, `loadingContent`.

Example (basic):

```tsx
import { CanvasInput } from "@hoseinh/react-ocr";

<CanvasInput onDetect={(text) => console.log(text)} />
```

Example with Groq:

```tsx
<CanvasInput
  onDetect={(t) => console.log(t)}
  ocrService="groq"
  groqApiKey={process.env.GROQ_KEY}
/>
```

Tips
- Tesseract is not recommended for handwritten text
- Use `timeout` to control how long to wait after drawing stops before OCR triggers.
