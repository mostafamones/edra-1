/**
 * Client-side helpers for calling our JSON API routes.
 *
 * Every server route returns either the standard envelope from
 * `lib/api/response.ts`:
 *   { success: true, data, meta? } | { success: false, error }
 * or, for routes not yet migrated, a raw JSON body.
 *
 * `apiFetch` normalises both shapes so callers always receive the typed `data`
 * on success and a thrown `ApiError` on failure.
 */

import type { ApiResponse, PaginationMeta } from "./response";

export interface ApiErrorDetails {
  code: string;
  message: string;
  details?: unknown;
  status: number;
}

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details?: unknown;

  constructor({ code, message, details, status }: ApiErrorDetails) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    if (details !== undefined) this.details = details;
  }
}

interface ApiFetchSuccess<T> {
  data: T;
  meta?: PaginationMeta;
}

function hasEnvelope(body: unknown): body is ApiResponse<unknown> {
  return (
    typeof body === "object" &&
    body !== null &&
    "success" in body &&
    typeof (body as { success: unknown }).success === "boolean"
  );
}

async function parseBody(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/**
 * Low-level fetch that returns both `data` and optional `meta` from paginated
 * envelopes. Prefer `apiFetch` unless the caller needs pagination metadata.
 */
export async function apiFetchFull<T>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<ApiFetchSuccess<T>> {
  let res: Response;
  try {
    res = await fetch(input, init);
  } catch (err) {
    throw new ApiError({
      code: "NETWORK_ERROR",
      message: err instanceof Error ? err.message : "Network request failed",
      status: 0,
    });
  }

  const body = await parseBody(res);

  if (hasEnvelope(body)) {
    if (body.success) {
      const envelope = body as Extract<ApiResponse<T>, { success: true }>;
      return envelope.meta
        ? { data: envelope.data, meta: envelope.meta }
        : { data: envelope.data };
    }
    throw new ApiError({
      code: body.error.code,
      message: body.error.message,
      details: body.error.details,
      status: res.status,
    });
  }

  if (!res.ok) {
    const fallback =
      (body && typeof body === "object" && "error" in body && typeof (body as { error: unknown }).error === "string"
        ? (body as { error: string }).error
        : undefined) ?? `Request failed (${res.status})`;
    throw new ApiError({
      code: `HTTP_${res.status}`,
      message: fallback,
      status: res.status,
    });
  }

  return { data: body as T };
}

/**
 * Unwrap a JSON API response to its `data` payload. Throws an {@link ApiError}
 * on HTTP errors or enveloped `success: false` responses.
 */
export async function apiFetch<T>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<T> {
  const { data } = await apiFetchFull<T>(input, init);
  return data;
}

/** Convenience wrappers for the common verbs with JSON bodies. */
export const api = {
  get: <T>(url: string, init?: RequestInit) => apiFetch<T>(url, init),
  post: <T>(url: string, body?: unknown, init?: RequestInit) =>
    apiFetch<T>(url, {
      ...init,
      method: "POST",
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  patch: <T>(url: string, body?: unknown, init?: RequestInit) =>
    apiFetch<T>(url, {
      ...init,
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  put: <T>(url: string, body?: unknown, init?: RequestInit) =>
    apiFetch<T>(url, {
      ...init,
      method: "PUT",
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  delete: <T>(url: string, init?: RequestInit) =>
    apiFetch<T>(url, { ...init, method: "DELETE" }),
};
