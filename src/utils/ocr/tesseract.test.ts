import { PSM } from "tesseract.js";
import { performTesseractOcr } from "./tesseract";

describe("performTesseractOcr", () => {
  let mockWorker: any;
  let mockFileReader: any;

  beforeEach(() => {
    mockFileReader = {
      result:
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    };

    mockWorker = Promise.resolve({
      setParameters: jest.fn().mockResolvedValue(undefined),
      recognize: jest.fn(),
    });
  });

  it("should return trimmed recognized text", async () => {
    const recognizeResult = {
      data: {
        text: "  Hello World  \n",
      },
    };

    const workerInstance = await mockWorker;
    workerInstance.recognize.mockResolvedValue(recognizeResult);

    const result = await performTesseractOcr(
      mockWorker,
      mockFileReader,
      PSM.AUTO,
      false,
    );

    expect(result).toBe("Hello World");
  });

  it("should return undefined when no text is detected", async () => {
    const recognizeResult = {
      data: {
        text: "   \n  ",
      },
    };

    const workerInstance = await mockWorker;
    workerInstance.recognize.mockResolvedValue(recognizeResult);

    const result = await performTesseractOcr(
      mockWorker,
      mockFileReader,
      PSM.AUTO,
      false,
    );

    expect(result).toBeUndefined();
  });

  it("should set correct DPI for normal images (300)", async () => {
    const recognizeResult = {
      data: {
        text: "Test",
      },
    };

    const workerInstance = await mockWorker;
    workerInstance.recognize.mockResolvedValue(recognizeResult);

    await performTesseractOcr(mockWorker, mockFileReader, PSM.AUTO, false);

    const setParametersCall = workerInstance.setParameters.mock.calls[0][0];
    expect(setParametersCall.user_defined_dpi).toBe("300");
  });

  it("should set correct DPI for canvas handwriting (400)", async () => {
    const recognizeResult = {
      data: {
        text: "Test",
      },
    };

    const workerInstance = await mockWorker;
    workerInstance.recognize.mockResolvedValue(recognizeResult);

    await performTesseractOcr(mockWorker, mockFileReader, PSM.AUTO, true);

    const setParametersCall = workerInstance.setParameters.mock.calls[0][0];
    expect(setParametersCall.user_defined_dpi).toBe("400");
  });

  it("should set PSM and preserve interword spaces parameters", async () => {
    const recognizeResult = {
      data: {
        text: "Test",
      },
    };

    const workerInstance = await mockWorker;
    workerInstance.recognize.mockResolvedValue(recognizeResult);

    await performTesseractOcr(
      mockWorker,
      mockFileReader,
      PSM.SINGLE_LINE,
      false,
    );

    const setParametersCall = workerInstance.setParameters.mock.calls[0][0];
    expect(setParametersCall.tessedit_pageseg_mode).toBe(PSM.SINGLE_LINE);
    expect(setParametersCall.preserve_interword_spaces).toBe("1");
  });

  it("should handle recognition errors", async () => {
    const workerInstance = await mockWorker;
    workerInstance.recognize.mockRejectedValue(
      new Error("Recognition failed"),
    );

    await expect(
      performTesseractOcr(mockWorker, mockFileReader, PSM.AUTO, false),
    ).rejects.toThrow("Recognition failed");
  });
});
