export class ApiClientError extends Error {
  readonly status: number;
  readonly fieldErrors?: Record<string, string>;
  readonly details?: string[];

  constructor(
    status: number,
    message: string,
    extras?: { fieldErrors?: Record<string, string>; details?: string[] },
  ) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.fieldErrors = extras?.fieldErrors;
    this.details = extras?.details;
  }
}

type ApiErrorPayload = {
  error?: string;
  fieldErrors?: Record<string, string>;
  details?: string[];
};

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  const response = await fetch(path, {
    ...init,
    headers,
    credentials: "same-origin",
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const payload = (await response.json().catch(() => null)) as
    | (T & ApiErrorPayload)
    | ApiErrorPayload
    | null;

  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "error" in payload
        ? (payload.error ?? "Request failed")
        : "Request failed";
    throw new ApiClientError(response.status, message, {
      fieldErrors:
        payload && typeof payload === "object" && "fieldErrors" in payload
          ? payload.fieldErrors
          : undefined,
      details:
        payload && typeof payload === "object" && "details" in payload
          ? payload.details
          : undefined,
    });
  }

  return payload as T;
}
