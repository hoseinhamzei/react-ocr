import { performGroqOcr } from "./groq";

describe("performGroqOcr", () => {
  const mockApiKey = "test-groq-api-key";
  const mockBase64Image = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk";

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should throw error when API key is missing", async () => {
    await expect(performGroqOcr("", mockBase64Image)).rejects.toThrow(
      "Groq API key is required.",
    );
  });

  it("should throw error when base64 image is missing", async () => {
    await expect(performGroqOcr(mockApiKey, "")).rejects.toThrow(
      "Base64 image string is required.",
    );
  });

  it("should return recognized text on successful API response", async () => {
    const mockResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content: "Hello World",
            },
          },
        ],
      }),
    };

    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    const result = await performGroqOcr(mockApiKey, mockBase64Image);

    expect(result).toBe("Hello World");
    expect(global.fetch).toHaveBeenCalledWith(
      "https://api.groq.com/openai/v1/chat/completions",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: `Bearer ${mockApiKey}`,
        }),
      }),
    );
  });

  it("should send correct request body with base64 image", async () => {
    const mockResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue({
        choices: [{ message: { content: "Test" } }],
      }),
    };

    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    await performGroqOcr(mockApiKey, mockBase64Image);

    const callArgs = (global.fetch as jest.Mock).mock.calls[0][1];
    const body = JSON.parse(callArgs.body);

    expect(body.model).toBe("meta-llama/llama-4-scout-17b-16e-instruct");
    expect(body.messages[0].content[1].image_url.url).toContain(
      `data:image/png;base64,${mockBase64Image}`,
    );
  });

  it("should return undefined when no text is in response", async () => {
    const consoleSpy = jest.spyOn(console, "log").mockImplementation();

    const mockResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue({
        choices: [{ message: { content: "" } }],
      }),
    };

    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    const result = await performGroqOcr(mockApiKey, mockBase64Image);

    expect(result).toBeUndefined();
    expect(consoleSpy).toHaveBeenCalledWith("No text detected by Groq Vision.");

    consoleSpy.mockRestore();
  });

  it("should throw error on failed API response", async () => {
    const mockResponse = {
      ok: false,
      status: 401,
      text: jest.fn().mockResolvedValue("Unauthorized"),
    };

    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    await expect(performGroqOcr(mockApiKey, mockBase64Image)).rejects.toThrow(
      "Groq OCR failed: 401 Unauthorized",
    );
  });
});
