# API Reference

This document describes the main exports and types.

Exports

- `useOCR(props: UseOCRProps)` — hook
  - Returns `{ performOCR(file: File): Promise<void>, isOCRPending: boolean, detectedText: string, error?: Error }`
  - `UseOCRProps`:
    - `ocrService?: 'tesseract' | 'groq' | 'custom'` (default `'tesseract'`)
    - `lang?: TesseractLangCode | TesseractLangCode[]` (default `TesseractLanguageCodes.English`)
    - `pageSegMode?: PSM`
    - `OCRMode?: OEM`
    - `isCanvasHandwrite?: boolean`
    - `groqApiKey?: string`
    - `customOCRHandler?: (params: { file: File; base64: string }) => Promise<string>`

- `ImageInput` — component
  - Props: `ImageInputProps` (see source for full list). Key prop: `onDetect(detectedText: string)`.

- `CanvasInput` — component
  - Props: `CanvasInputProps` with canvas-specific options; key prop: `onDetect(detectedText: string)`.

- `TesseractLanguageCodes` and `TesseractLangCode` — language constants and type.

- `performGroqOcr(groqApiKey: string, base64Image: string): Promise<string | undefined>`
- `performTesseractOcr(workerPromise: Promise<Worker>, reader: FileReader, pageSegMode: PSM, isCanvasHandWrite?: boolean): Promise<string | undefined>`

Notes
- Components automatically call the hook internally — use the hook directly if you need custom implementation or other OCR use cases.
- `performTesseractOcr` expects an initialized Tesseract worker; the hook manages worker lifecycle for you.
# API Reference

- `useOCR(props)` - hook that returns `{ performOCR, isOCRPending, detectedText, error }`.
  - `UseOCRProps` includes: `ocrService`, `lang`, `pageSegMode`, `OCRMode`, `isCanvasHandwrite`, `groqApiKey`, `customOCRHandler`.

- `CanvasInput` - props: `CanvasInputProps` (see source for full list).
- `ImageInput` - props: `ImageInputProps` (see source for full list).

- `TesseractLanguageCodes` - constant map of language names to Tesseract codes.
- `performGroqOcr(groqApiKey, base64Image)` - helper to call Groq Vision.
- `performTesseractOcr(workerPromise, fileReader, pageSegMode, isCanvasHandwrite)` - internal helper; exported for advanced usage.
