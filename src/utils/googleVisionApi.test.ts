import { performGoogleVisionOCR } from './googleVisionApi';

// Mock the global fetch function
global.fetch = jest.fn();

describe('performGoogleVisionOCR', () => {
  const mockApiKey = 'test-api-key';
  const mockBase64Image = 'test-base64-image';

  beforeEach(() => {
    // Clear all previous mock calls and implementations
    (fetch as jest.Mock).mockClear();
    jest.spyOn(console, 'error').mockImplementation(() => {}); // Suppress console.error
    jest.spyOn(console, 'log').mockImplementation(() => {});   // Suppress console.log
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return detected text on successful API call', async () => {
    const mockText = 'Hello, Vision!';
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        responses: [
          {
            fullTextAnnotation: {
              text: mockText,
            },
          },
        ],
      }),
    });

    const result = await performGoogleVisionOCR(mockBase64Image, mockApiKey);

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(
      `https://vision.googleapis.com/v1/images:annotate?key=${mockApiKey}`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          requests: [
            {
              image: { content: mockBase64Image },
              features: [{ type: 'TEXT_DETECTION' }],
            },
          ],
        }),
      })
    );
    expect(result).toBe(mockText);
  });

  it('should return an empty string if no text is detected', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        responses: [
          {
            // No fullTextAnnotation
          },
        ],
      }),
    });

    const result = await performGoogleVisionOCR(mockBase64Image, mockApiKey);
    expect(result).toBe('');
    expect(console.log).toHaveBeenCalledWith("No text detected by Google Vision API or unexpected response structure.");
  });

  it('should return an empty string if responses array is empty or missing', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        responses: [], // Empty responses
      }),
    });
    let result = await performGoogleVisionOCR(mockBase64Image, mockApiKey);
    expect(result).toBe('');
    expect(console.log).toHaveBeenCalledWith("No text detected by Google Vision API or unexpected response structure.");

    (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}), // No responses field
      });
    result = await performGoogleVisionOCR(mockBase64Image, mockApiKey);
    expect(result).toBe('');
    expect(console.log).toHaveBeenCalledWith("No text detected by Google Vision API or unexpected response structure.");
  });


  it('should throw an error if API request fails (response not ok)', async () => {
    const errorMessage = 'API Error';
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: async () => ({ error: { message: errorMessage } }),
    });

    await expect(performGoogleVisionOCR(mockBase64Image, mockApiKey)).rejects.toThrow(
      `Google Vision API request failed with status 500: ${errorMessage}`
    );
    expect(console.error).toHaveBeenCalledWith("Google Vision API error:", {"error": {"message": "API Error"}});
    expect(console.error).toHaveBeenCalledWith("Error calling Google Vision API:", expect.any(Error));
  });

  it('should throw an error if API request fails (response not ok, no error message in body)', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 403,
      statusText: 'Forbidden',
      json: async () => ({}), // Empty error body
    });

    await expect(performGoogleVisionOCR(mockBase64Image, mockApiKey)).rejects.toThrow(
      `Google Vision API request failed with status 403: Forbidden`
    );
    expect(console.error).toHaveBeenCalledWith("Google Vision API error:", {});
    expect(console.error).toHaveBeenCalledWith("Error calling Google Vision API:", expect.any(Error));
  });

  it('should throw an error if network request fails (fetch rejects)', async () => {
    const networkError = new Error('Network failure');
    (fetch as jest.Mock).mockRejectedValueOnce(networkError);

    await expect(performGoogleVisionOCR(mockBase64Image, mockApiKey)).rejects.toThrow(
      networkError
    );
    expect(console.error).toHaveBeenCalledWith("Error calling Google Vision API:", networkError);
  });
});
