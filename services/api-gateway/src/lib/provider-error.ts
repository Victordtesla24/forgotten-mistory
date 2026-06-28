export type ProviderName = "openai" | "gemini" | "elevenlabs" | "d-id" | "local-llama" | "orchestrator" | "bridge";

export class ProviderApiError extends Error {
  provider: ProviderName;
  status: number;
  code: string;
  retryable: boolean;
  details?: string;

  constructor(args: {
    provider: ProviderName;
    status: number;
    code: string;
    message: string;
    retryable?: boolean;
    details?: string;
  }) {
    super(args.message);
    this.name = "ProviderApiError";
    this.provider = args.provider;
    this.status = args.status;
    this.code = args.code;
    this.retryable = args.retryable ?? (args.status >= 500 || args.status === 429);
    this.details = args.details;
  }
}

function truncate(value: string, max = 320): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length > max ? `${normalized.slice(0, max)}...` : normalized;
}

function detectCode(status: number): string {
  if (status === 400) return "bad_request";
  if (status === 401) return "unauthorized";
  if (status === 403) return "forbidden";
  if (status === 404) return "not_found";
  if (status === 408) return "timeout";
  if (status === 409) return "conflict";
  if (status === 422) return "unprocessable";
  if (status === 429) return "rate_limited";
  if (status >= 500) return "provider_unavailable";
  return "provider_error";
}

export async function providerErrorFromResponse(
  provider: ProviderName,
  response: Response,
  contextMessage: string
): Promise<ProviderApiError> {
  const body = await response.text();
  const details = truncate(body || "empty response body");
  return new ProviderApiError({
    provider,
    status: response.status,
    code: detectCode(response.status),
    message: `${contextMessage} (${response.status})`,
    details
  });
}

export function normalizeProviderError(error: unknown, fallbackProvider: ProviderName): ProviderApiError {
  if (error instanceof ProviderApiError) {
    return error;
  }

  if (error instanceof Error) {
    try {
      const parsed = JSON.parse(error.message) as {
        provider?: ProviderName;
        status?: number;
        code?: string;
        error?: string;
        retryable?: boolean;
        details?: string;
      };

      if (parsed && typeof parsed === "object" && parsed.provider && parsed.status && parsed.code && parsed.error) {
        return new ProviderApiError({
          provider: parsed.provider,
          status: Number(parsed.status),
          code: parsed.code,
          message: parsed.error,
          retryable: typeof parsed.retryable === "boolean" ? parsed.retryable : undefined,
          details: parsed.details
        });
      }
    } catch {
      // The message is not a serialized provider error payload.
    }
  }

  if (error instanceof Error && error.name === "AbortError") {
    return new ProviderApiError({
      provider: fallbackProvider,
      status: 504,
      code: "timeout",
      message: `${fallbackProvider} request timed out`,
      retryable: true
    });
  }

  return new ProviderApiError({
    provider: fallbackProvider,
    status: 500,
    code: "provider_error",
    message: `${fallbackProvider} request failed`,
    details: error instanceof Error ? truncate(error.message) : String(error),
    retryable: true
  });
}

export function providerErrorPayload(error: ProviderApiError) {
  return {
    error: error.message,
    provider: error.provider,
    code: error.code,
    status: error.status,
    retryable: error.retryable,
    details: error.details || ""
  };
}
