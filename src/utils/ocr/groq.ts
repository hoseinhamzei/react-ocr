const groqApiEndpoint = "https://api.groq.com/openai/v1/chat/completions";

/**
 * Performs OCR using Groq Vision models (Llama 4 Scout/Maverick) on a base64 image.
 *
 * @param groqApiKey - Your Groq API key.
 * @param base64Image - Image as a Base64 string.
 * @returns The recognized text from the image.
 */
async function performGroqOcr(
  groqApiKey: string,
  base64Image: string,
): Promise<string | undefined> {
  if (!groqApiKey) {
    throw new Error("Groq API key is required.");
  }

  if (!base64Image) {
    throw new Error("Base64 image string is required.");
  }

  // Groq Vision request
  const response = await fetch(groqApiEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${groqApiKey}`,
    },
    body: JSON.stringify({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract all readable text from this image. only return the detected text otherwise return 'No text detected'",
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/png;base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      temperature: 0,
      max_completion_tokens: 1024,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Groq OCR failed: ${response.status} ${errText}`);
  }

  const json = await response.json();
  const text = json?.choices?.[0]?.message?.content;

  if (!text) {
    console.log("No text detected by Groq Vision.");
    return;
  }

  return text;
}

export { performGroqOcr };
