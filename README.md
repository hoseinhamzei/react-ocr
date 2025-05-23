# React OCR Input Components

[![NPM Version](https://img.shields.io/npm/v/react-ocr-input.svg?style=flat)](https://www.npmjs.com/package/react-ocr-input)
[![Build Status](https://img.shields.io/travis/com/yourusername/react-ocr-input.svg?style=flat)](https://travis-ci.com/yourusername/react-ocr-input)
_(Note: Badges are placeholders)_

## Description

`react-ocr-input` is a React library that provides versatile components for Optical Character Recognition (OCR). It includes `CanvasInput` for capturing handwritten text and `ImageInput` for processing text from image files. Both components offer flexibility by supporting Tesseract.js (for client-side processing) and Google Cloud Vision API (for server-side, high-accuracy OCR).

### Key Features

*   **Handwriting Input:** `CanvasInput` allows users to draw or write text directly on a canvas.
*   **Image File Input:** `ImageInput` accepts image files (via drag & drop or file selection) for OCR.
*   **Dual OCR Engines:**
    *   **Tesseract.js:** Default engine, performs OCR directly in the browser.
    *   **Google Cloud Vision API:** Optional, for more robust and accurate OCR.
*   **Mobile Touch Support:** `CanvasInput` supports touch events for drawing on mobile devices.
*   **Customizable OCR Parameters:** Tailor OCR behavior using Tesseract.js `pageSegMode` and `OCRMode`.
*   **Image Preprocessing:** Includes automatic grayscaling and binarization to improve OCR accuracy.

## Installation

Install the package using npm or yarn:

```bash
npm install react-ocr-input
# or
yarn add react-ocr-input
```

## Usage

### `CanvasInput` Component

This component provides a canvas for users to write or draw on.

**Basic Example (Tesseract.js):**

```jsx
import React from 'react';
import { CanvasInput } from 'react-ocr-input';
import { LanguageCodes } from 'react-ocr-input/types'; // Path to types might vary based on final build structure

function App() {
  const handleDetect = (text) => {
    console.log('Detected text (Canvas - Tesseract):', text);
  };

  return (
    <CanvasInput
      onDetect={handleDetect}
      lang={LanguageCodes.English} // Specify the language for Tesseract
    />
  );
}

export default App;
```

**Example with Google Cloud Vision API:**

```jsx
import React from 'react';
import { CanvasInput } from 'react-ocr-input';

function App() {
  const handleDetect = (text) => {
    console.log('Detected text (Canvas - Google Vision):', text);
  };

  return (
    <CanvasInput
      onDetect={handleDetect}
      ocrService="googleVision"
      googleVisionApiKey="YOUR_GOOGLE_VISION_API_KEY"
    />
  );
}

export default App;
```

### `ImageInput` Component

This component allows users to upload an image file for OCR.

**Basic Example (Tesseract.js):**

```jsx
import React from 'react';
import { ImageInput } from 'react-ocr-input';
import { LanguageCodes } from 'react-ocr-input/types'; // Path to types might vary

function App() {
  const handleDetect = (text) => {
    console.log('Detected text (Image - Tesseract):', text);
  };

  return (
    <ImageInput
      onDetect={handleDetect}
      lang={LanguageCodes.English} // Specify the language for Tesseract
    />
  );
}

export default App;
```

**Example with Google Cloud Vision API:**

```jsx
import React from 'react';
import { ImageInput } from 'react-ocr-input';

function App() {
  const handleDetect = (text) => {
    console.log('Detected text (Image - Google Vision):', text);
  };

  return (
    <ImageInput
      onDetect={handleDetect}
      ocrService="googleVision"
      googleVisionApiKey="YOUR_GOOGLE_VISION_API_KEY"
    />
  );
}

export default App;
```

**Importing Types:**

You might need to import specific types for OCR configuration if you're using Tesseract.js parameters directly:

```jsx
import { LanguageCodes, PSM, OEM } from 'react-ocr-input/types';
// LanguageCodes: For setting the OCR language.
// PSM (Page Segmentation Mode): For Tesseract.js.
// OEM (OCR Engine Mode): For Tesseract.js.
```
_(The exact import path for types like `LanguageCodes` might differ based on your project's final build and export configuration. Common paths include `your-library-name/dist/types` or directly from `your-library-name/types` if aliased correctly.)_

## Props Documentation

### `CanvasInputProps`

| Prop                 | Type                                  | Default                            | Description                                                                                                |
| -------------------- | ------------------------------------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `onDetect`           | `(detectedText: string) => void`      | **Required**                       | Callback function triggered with the detected text.                                                        |
| `lang`               | `LangCode` or `LangCode[]`            | `LanguageCodes.English`            | Language(s) for Tesseract.js. Ignored if `ocrService` is 'googleVision'.                                   |
| `ocrService`         | `'tesseract' \| 'googleVision'`       | `'tesseract'`                      | Specifies the OCR engine to use.                                                                           |
| `googleVisionApiKey` | `string`                              | `undefined`                        | Your Google Cloud Vision API key. Required if `ocrService` is 'googleVision'.                              |
| `maxWidth`           | `number`                              | `400`                              | Maximum width of the canvas.                                                                               |
| `height`             | `number`                              | `300`                              | Height of the canvas.                                                                                      |
| `timeout`            | `number`                              | `3` (seconds)                      | Delay in seconds after drawing stops before OCR is triggered.                                              |
| `pageSegMode`        | `PSM` (from Tesseract.js)             | `PSM.SINGLE_LINE`                  | Tesseract.js Page Segmentation Mode. Ignored for Google Vision.                                            |
| `OCRMode`            | `OEM` (from Tesseract.js)             | `OEM.TESSERACT_LSTM_COMBINED`      | Tesseract.js OCR Engine Mode. Ignored for Google Vision.                                                   |
| `loadingContent`     | `ReactElement`                        | `"Please Wait..."` (text)          | Content to display while OCR is in progress.                                                               |
| `className`          | `string`                              | `undefined`                        | Custom CSS class for the component's root div.                                                             |
| `style`              | `React.CSSProperties`                 | `undefined`                        | Custom inline styles for the component's root div.                                                         |

### `ImageInputProps`

| Prop                 | Type                                  | Default                                           | Description                                                                                                |
| -------------------- | ------------------------------------- | ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `onDetect`           | `(detectedText: string) => void`      | **Required**                                      | Callback function triggered with the detected text.                                                        |
| `lang`               | `LangCode` or `LangCode[]`            | `LanguageCodes.English`                           | Language(s) for Tesseract.js. Ignored if `ocrService` is 'googleVision'.                                   |
| `ocrService`         | `'tesseract' \| 'googleVision'`       | `'tesseract'`                                     | Specifies the OCR engine to use.                                                                           |
| `googleVisionApiKey` | `string`                              | `undefined`                                       | Your Google Cloud Vision API key. Required if `ocrService` is 'googleVision'.                              |
| `onFile`             | `(file: File) => void`                | `undefined`                                       | Callback function triggered with the selected file.                                                        |
| `pageSegMode`        | `PSM` (from Tesseract.js)             | `PSM.SINGLE_LINE`                                 | Tesseract.js Page Segmentation Mode. Ignored for Google Vision.                                            |
| `OCRMode`            | `OEM` (from Tesseract.js)             | `OEM.TESSERACT_LSTM_COMBINED`                     | Tesseract.js OCR Engine Mode. Ignored for Google Vision.                                                   |
| `hint`               | `string`                              | `"Drag & Drop an image here or click to select..."` | Placeholder text displayed in the input area.                                                              |
| `maxWidth`           | `string`                              | `"400px"`                                         | Maximum width of the image input component (CSS value).                                                    |
| `loadingContent`     | `ReactElement`                        | `"Please Wait..."` (text)                         | Content to display while OCR is in progress.                                                               |
| `className`          | `string`                              | `undefined`                                       | Custom CSS class for the component's root div.                                                             |
| `style`              | `React.CSSProperties`                 | `undefined`                                       | Custom inline styles for the component's root div.                                                         |

## Google Cloud Vision API Setup

To use the `'googleVision'` OCR service, you need:

1.  A Google Cloud Platform (GCP) project.
2.  The Vision API enabled for your project.
3.  An API key associated with your project that is authorized to use the Vision API.

Provide this API key to the `googleVisionApiKey` prop in the `CanvasInput` or `ImageInput` components.

For detailed instructions on setting up the Vision API and generating an API key, please refer to the [official Google Cloud Vision API documentation](https://cloud.google.com/vision/docs/setup).

## Development & Contributing

### Local Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/yourusername/react-ocr-input.git
    cd react-ocr-input
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```

### Running Tests

Currently, the `package.json` does not have a dedicated `test` script. You can run Jest directly or add a script:

*   **To run Jest directly (if installed globally or via npx):**
    ```bash
    npx jest
    ```
*   **Consider adding a `test` script to your `package.json`:**
    ```json
    "scripts": {
      // ... other scripts
      "test": "jest"
    }
    ```
    Then run:
    ```bash
    npm test
    # or
    yarn test
    ```

### Contribution Guidelines

We welcome contributions! If you'd like to improve `react-ocr-input`:

1.  **Fork** the repository.
2.  Create a new **branch** for your feature or bug fix (e.g., `feature/new-ocr-parameter` or `fix/canvas-rendering-issue`).
3.  Make your **changes**.
4.  **Add tests** for your changes to ensure they work as expected and don't break existing functionality.
5.  Ensure all tests pass.
6.  Submit a **pull request** with a clear description of your changes.

## License

This project is licensed under the MIT License.
