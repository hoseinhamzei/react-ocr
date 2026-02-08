import { PSM, WorkerParams, type Worker } from "tesseract.js";

/**
 * Runs OCR on an image using a Tesseract.js worker.
 *
 * @param worker - Initialized Tesseract Worker instance.
 * @param reader - FileReader containing the loaded image data.
 * @param pageSegMode - Tesseract Page Segmentation Mode (PSM).
 * @returns The recognized text, or undefined if no text is found.
 */
async function performTesseractOcr(
  worker: Promise<Worker>,
  reader: FileReader,
  pageSegMode: PSM
): Promise<string | undefined> {
  const ocr = await worker;

  const ocrConfig: Partial<WorkerParams> = {
    tessedit_pageseg_mode: pageSegMode,
  };

  // setParameters and recognize are async
  await ocr.setParameters(ocrConfig);

  const {
    data: { text },
  } = await ocr.recognize(reader.result as string);

  if (!text) {
    console.log("No text detected by Tesseract.");
    return;
  }

  return text;
}

export { performTesseractOcr };
