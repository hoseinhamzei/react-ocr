import { PSM, WorkerParams, type Worker } from "tesseract.js";

/**
 * Preprocess the input image before sending to Tesseract.
 *
 * - For canvas handwriting, we upscale more aggressively and apply a strong
 *   binarization to emphasize strokes.
 * - For normal images, we do a lighter grayscale + contrast adjustment so we
 *   don't destroy detail from photos/screenshots.
 *
 * Always falls back to the original data URL if anything goes wrong or we're
 * not in a DOM environment.
 */
async function preprocessForTesseract(
  dataUrl: string,
  isCanvasHandWrite: boolean,
): Promise<string | HTMLCanvasElement> {
  if (typeof document === "undefined") {
    return dataUrl;
  }

  return new Promise((resolve) => {
    const img = new Image();

    img.onload = () => {
      try {
        const MIN_TARGET_WIDTH = isCanvasHandWrite ? 512 : 320;
        const scale =
          img.width && img.width < MIN_TARGET_WIDTH
            ? MIN_TARGET_WIDTH / img.width
            : 1;

        const canvas = document.createElement("canvas");
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(dataUrl);
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const { data } = imageData;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          // Perceptual grayscale
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;

          if (isCanvasHandWrite) {
            // Strong binarization for sharp pen strokes.
            const bin = gray > 180 ? 255 : 0;
            data[i] = bin;
            data[i + 1] = bin;
            data[i + 2] = bin;
          } else {
            // Lighter contrast tweak for generic images.
            const contrast = 1.1;
            const contrasted =
              (gray - 128) * contrast + 128; /* simple linear contrast */
            const clamped = Math.max(0, Math.min(255, contrasted));
            data[i] = clamped;
            data[i + 1] = clamped;
            data[i + 2] = clamped;
          }
        }

        ctx.putImageData(imageData, 0, 0);

        resolve(canvas);
      } catch {
        resolve(dataUrl);
      }
    };

    img.onerror = () => {
      resolve(dataUrl);
    };

    img.src = dataUrl;
  });
}

/**
 * Runs OCR on an image using a Tesseract.js worker.
 *
 * @param worker - Initialized Tesseract Worker instance.
 * @param reader - FileReader containing the loaded image data.
 * @param pageSegMode - Tesseract Page Segmentation Mode (PSM).
 * @param isCanvasHandWrite - Whether the image originates from the handwriting canvas.
 * @returns The recognized text, or undefined if no text is found.
 */
async function performTesseractOcr(
  worker: Promise<Worker>,
  reader: FileReader,
  pageSegMode: PSM,
  isCanvasHandWrite: boolean = false,
): Promise<string | undefined> {
  const ocr = await worker;

  const ocrConfig: Partial<WorkerParams> &
    Record<string, string | PSM | undefined> = {
      tessedit_pageseg_mode: pageSegMode,
      preserve_interword_spaces: "1",
      // Slightly higher virtual DPI for clean canvas handwriting.
      user_defined_dpi: isCanvasHandWrite ? "400" : "300",
    };

  await ocr.setParameters(ocrConfig);

  const preprocessedInput = await preprocessForTesseract(
    reader.result as string,
    isCanvasHandWrite,
  );

  const {
    data: { text },
  } = await ocr.recognize(preprocessedInput);

  const trimmedText = text?.trim();

  if (!trimmedText) {
    console.log("No text detected by Tesseract.");
    return;
  }

  return trimmedText;
}

export { performTesseractOcr };
