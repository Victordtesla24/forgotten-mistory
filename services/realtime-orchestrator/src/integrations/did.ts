import { normalizeProviderError, providerErrorFromResponse } from "../lib/provider-error.js";

type DidStreamResponse = {
  id?: string;
  stream_id?: string;
};

export async function createDidStream(apiKey?: string, sourceUrl?: string): Promise<string | null> {
  if (!apiKey) {
    return null;
  }

  const body = sourceUrl
    ? { source_url: sourceUrl }
    : { source_url: "https://create-images-results.d-id.com/DefaultPresenters/Noelle_f/image.png" };

  try {
    const response = await fetch("https://api.d-id.com/talks/streams", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Basic ${apiKey}`
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw await providerErrorFromResponse("d-id", response, "D-ID stream creation failed");
    }

    const payload = (await response.json().catch(() => ({}))) as DidStreamResponse & { message?: string };
    return payload.id || payload.stream_id || null;
  } catch (error) {
    throw normalizeProviderError(error, "d-id");
  }
}
