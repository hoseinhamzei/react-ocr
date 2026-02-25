
# API Reference

This document lists the public hooks, components and helper functions exported by the library with full prop/type details.

**Hook: `useOCR(props: UseOCRProps)`**

Description: A React hook that performs OCR using either Tesseract.js, Groq Vision, or a custom handler.

Return value:

| Property | Type | Description |
|---|---|---|
| `performOCR` | `(file: File) => Promise<void>` | Trigger OCR on the provided `File`. The hook will set `detectedText` or `error` accordingly. |
| `isOCRPending` | `boolean` | True while OCR is running. |
| `detectedText` | `string` | Text result from the last successful OCR run. |
| `error` | `Error ` | Error that occurred during OCR (if any). |

`UseOCRProps`:

| Prop | Type | Default | Description |
|---|---|---|---|
| `ocrService?` | `'tesseract' \| 'groq' \| 'custom'` | `'tesseract'` | Which provider to use. `'tesseract'` uses Tesseract.js, `'groq'` uses Groq Vision API, `'custom'` calls a user-provided handler. |
| `lang?` | `TesseractLangCode \| TesseractLangCode[]` | `TesseractLanguageCodes.English` | Language code(s) for Tesseract recognition. |
| `pageSegMode?` | `PSM` | `PSM.AUTO` (hook default) | Tesseract Page Segmentation Mode. |
| `OCRMode?` | `OEM` | `OEM.TESSERACT_LSTM_COMBINED` | Tesseract OCR Engine Mode. |
| `isCanvasHandwrite?` | `boolean` | `false` | Enables handwriting-specific preprocessing (higher DPI, binarization). Useful when OCRing the `CanvasInput`. |
| `groqApiKey?` | `string ` | `undefined` | API key required when `ocrService` is `'groq'`. |
| `customOCRHandler?` | `(params: { file: File; base64: string }) => Promise<string>`  | `undefined` | Handler invoked when `ocrService` is `'custom'`. Should return the detected text. |

Notes:
- The hook lazily initializes and manages a Tesseract worker when `ocrService` is `'tesseract'`.
- Input images are converted to base64 internally; providers receive base64 image payloads.

**Component: `ImageInput`**

Description: Drag-and-drop / file select component that accepts an image and runs OCR.

`ImageInputProps`:

| Prop | Type | Default | Description |
|---|---|---|---|
| `onDetect` | `(detectedText: string) => void` | required | Callback invoked when OCR returns detected text. |
| `onFile?` | `(file: File) => void`  | `undefined` | Optional callback when a file is selected. |
| `onError?` | `(error: Error) => void`  | `undefined` | Optional error callback. |
| `onStartDetecting?` | `() => void`  | `undefined` | Optional callback invoked when OCR starts. |
| `className?` | `string` | `""` | Additional CSS class for the container. |
| `style?` | `React.CSSProperties` | `undefined` | Inline styles for the container. |
| `ocrService?` | `OCRService` | `'tesseract'` | Provider to use for OCR. |
| `lang?` | `TesseractLangCode \| TesseractLangCode[]` | `TesseractLanguageCodes.English` | Language(s) for OCR. |
| `pageSegMode?` | `PSM` | `PSM.AUTO` | Tesseract page segmentation mode. |
| `OCRMode?` | `OEM` | `OEM.TESSERACT_LSTM_COMBINED` | Tesseract OCR engine mode. |
| `hint?` | `string` | `"Drag & Drop an image here or click to select a file"` | Hint text shown in the drop zone. |
| `maxWidth?` | `string` | `"400px"` | Maximum width of the component (CSS value). |
| `loadingContent?` | `ReactElement`  | `undefined` | Custom content shown while OCR is pending. |
| `groqApiKey?` | `string ` | `undefined` | Groq API key when using `ocrService='groq'`. |
| `customOCRHandler?` | `CustomOCRHandler`  | `undefined` | Custom handler when `ocrService='custom'`. |

Behavior notes:
- `ImageInput` internally uses `useOCR` and forwards `detectedText` via `onDetect` when available.
- File selection triggers `onFile` (if provided) then runs `performOCR` from the hook.

**Component: `CanvasInput`**

Description: Handwriting canvas for drawing text; automatically converts drawing to an image and runs OCR after a configurable timeout.

`CanvasInputProps`:

| Prop | Type | Default | Description |
|---|---|---|---|
| `onDetect` | `(detectedText: string) => void` | required | Callback invoked when OCR returns detected text. |
| `onError?` | `(error: Error) => void`  | `undefined` | Optional error callback. |
| `onStartDetecting?` | `() => void`  | `undefined` | Optional callback invoked when OCR starts. |
| `maxWidth?` | `number` | `400` | Canvas width in pixels. |
| `height?` | `number` | `300` | Canvas height in pixels. |
| `timeout?` | `number` | `3` | Seconds to wait after drawing stops before running OCR. |
| `lang?` | `TesseractLangCode \| TesseractLangCode[]` | `TesseractLanguageCodes.English` | Language(s) for OCR. |
| `pageSegMode?` | `PSM` | `PSM.AUTO` | Tesseract page segmentation mode. |
| `OCRMode?` | `OEM` | `OEM.TESSERACT_LSTM_COMBINED` | Tesseract OCR engine mode. |
| `className?` | `string` | `""` | Additional CSS class for the container. |
| `style?` | `React.CSSProperties` | `undefined` | Inline styles for the container. |
| `loadingContent?` | `ReactElement`  | `undefined` | Custom content shown while OCR is pending. |
| `ocrService?` | `OCRService` | `'tesseract'` | Provider to use for OCR. |
| `groqApiKey?` | `string ` | `undefined` | Groq API key when using `ocrService='groq'`. |
| `lineWidth?` | `number` | `2.5` | Stroke width for drawing. |
| `strokeStyle?` | `string` | `'black'` | Stroke color for drawing. |
| `customOCRHandler?` | `CustomOCRHandler`  | `undefined` | Custom handler when `ocrService='custom'`. |

Behavior notes:
- `CanvasInput` sets `isCanvasHandwrite` when calling `useOCR` so the hook applies handwriting preprocessing.
- When the user draws, the canvas is converted to a PNG blob and sent to the hook as a `File`.

**Other exports**

| Export | Type / Signature | Description |
|---|---|---|
| `TesseractLanguageCodes` | `const` object | Map of human-readable language keys to Tesseract language codes. See [src/types/types.ts](src/types/types.ts#L1). |
| `TesseractLangCode` | `type` | Type alias for the allowed language code strings. |
| `performGroqOcr` | `(groqApiKey: string, base64Image: string) => Promise<string \| undefined>` | Calls the Groq Vision endpoint and returns detected text. Throws on network / API errors. |
| `performTesseractOcr` | `(workerPromise: Promise<Worker>, reader: FileReader, pageSegMode: PSM, isCanvasHandWrite?: boolean) => Promise<string \| undefined>` | Runs OCR using a provided Tesseract worker. Returns detected text or `undefined` when nothing was found. |

Notes and recommendations:
- Use `useOCR` directly when you need a custom flow or a custom implementation.
- Use `CanvasInput` for handwriting.
- When using `ocrService='groq'`, supply a valid `groqApiKey` to `useOCR` or the component props. visit [https://console.groq.com/keys](https://console.groq.com/keys) to get sign up and get an API key.
- You can use the `custom` ocrService for custom implementation like using another cloud provider.

