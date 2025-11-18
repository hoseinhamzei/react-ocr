interface GoogleVisionTextAnnotation {
  text: string;
  // Add other properties if needed based on the API response structure
}

interface GoogleVisionResponse {
  responses: {
    fullTextAnnotation?: GoogleVisionTextAnnotation;
    // Add other properties if needed
  }[];
  // Add other properties if needed
}

/**
 * Performs OCR using Google Cloud Vision API.
 *
 * @param base64Image The Base64 encoded image string (without the data URI prefix).
 * @param apiKey The Google Cloud API key.
 * @returns A promise that resolves to the detected text string, or an empty string if no text is detected.
 * @throws An error if the API request fails or returns an error.
 */
async function performGoogleVisionOCR(
  base64Image: string,
  apiKey: string
): Promise<string> {
  const apiUrl = `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`;

  const requestPayload = {
    requests: [
      {
        image: {
          content: base64Image,
        },
        features: [
          {
            type: "TEXT_DETECTION",
          },
        ],
      },
    ],
  };

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestPayload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Google Vision API error:", errorData);
      throw new Error(
        `Google Vision API request failed with status ${response.status}: ${errorData?.error?.message || response.statusText}`
      );
    }

    const data: GoogleVisionResponse = await response.json();

    if (
      data.responses &&
      data.responses.length > 0 &&
      data.responses[0].fullTextAnnotation &&
      data.responses[0].fullTextAnnotation.text
    ) {
      return data.responses[0].fullTextAnnotation.text;
    } else {
      console.log("No text detected by Google Vision API or unexpected response structure.");
      return ""; // Return empty string if no text is detected or annotation is missing
    }
  } catch (error) {
    console.error("Error calling Google Vision API:", error);
    throw error; // Re-throw the error to be handled by the caller
  }
}

export { performGoogleVisionOCR };
