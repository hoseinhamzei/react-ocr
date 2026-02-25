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

    // Mock Image to make onload fire immediately in tests
    const mockImage = {
      onload: null as any,
      onerror: null as any,
      src: "",
      width: 100,
      height: 100,
    };

    global.Image = jest.fn().mockImplementation(() => {
      // Trigger onload asynchronously when src is set
      setTimeout(() => {
        if (mockImage.onload) {
          mockImage.onload();
        }
      }, 0);
      return mockImage;
    }) as any;

    // Mock document.createElement for canvas
    const mockCanvas = {
      width: 0,
      height: 0,
      getContext: jest.fn().mockReturnValue({
        imageSmoothingEnabled: true,
        imageSmoothingQuality: "high",
        drawImage: jest.fn(),
        getImageData: jest.fn().mockReturnValue({
          data: new Uint8ClampedArray(400), // 100x100 image with RGBA
        }),
        putImageData: jest.fn(),
      }),
      toDataURL: jest.fn().mockReturnValue("data:image/png;base64,mockprocessed"),
    };

    const originalCreateElement = document.createElement.bind(document);
    jest.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'canvas') {
        return mockCanvas as any;
      }
      return originalCreateElement(tagName);
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
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
      PSM.AUTO,
      false,
    );

    const setParametersCall = workerInstance.setParameters.mock.calls[0][0];
    expect(setParametersCall.tessedit_pageseg_mode).toBe(PSM.AUTO);
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
