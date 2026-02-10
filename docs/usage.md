# Usage

Import components and hook from the package root:

```tsx
import { CanvasInput, ImageInput, useOCR, TesseractLanguageCodes } from "@hoseinh/react-ocr";
```

Simple examples:

- Canvas handwriting input

```tsx
<CanvasInput onDetect={(text) => console.log(text)} />
```

- Image file input

```tsx
<ImageInput onDetect={(text) => console.log(text)} />
```

- Use `useOCR` directly for programmatic OCR on a `File` using the selected backend:

```tsx
const { performOCR } = useOCR({ ocrService: "tesseract" });
// call performOCR(file)
```
