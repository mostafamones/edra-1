import { NextResponse } from "next/server";

// ============================================
// Standardized API Response Types
// ============================================

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: PaginationMeta;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// ============================================
// Pagination Parameters
// ============================================

export interface PaginationParams {
  page: number;
  limit: number;
}

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 50;
export const MAX_LIMIT = 200;

/**
 * Parse pagination parameters from URLSearchParams.
 * Returns sensible defaults if not provided.
 */
export function parsePagination(searchParams: URLSearchParams): PaginationParams {
  const rawPage = searchParams.get("page");
  const rawLimit = searchParams.get("limit");

  const page = Math.max(1, rawPage ? parseInt(rawPage, 10) || DEFAULT_PAGE : DEFAULT_PAGE);
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, rawLimit ? parseInt(rawLimit, 10) || DEFAULT_LIMIT : DEFAULT_LIMIT)
  );

  return { page, limit };
}

// ============================================
// Response Helpers
// ============================================

/**
 * Return a standardized success response.
 */
export function success<T>(data: T, status = 200): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json({ success: true as const, data }, { status });
}

/**
 * Return a standardized success response for paginated data.
 */
export function paginated<T>(
  data: T[],
  meta: PaginationMeta,
  status = 200
): NextResponse<ApiSuccessResponse<T[]>> {
  return NextResponse.json(
    { success: true as const, data, meta },
    { status }
  );
}

/**
 * Return a standardized error response.
 *
 * @param code   A machine-readable error code (e.g. "VALIDATION_ERROR", "NOT_FOUND").
 * @param message A human-readable fallback message.
 * @param status  HTTP status code (default 500).
 * @param details Optional extra detail (e.g. validation issues array).
 */
export function error(
  code: string,
  message: string,
  status = 500,
  details?: unknown
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      success: false as const,
      error: { code, message, ...(details !== undefined && { details }) },
    },
    { status }
  );
}

// ============================================
// Common Error Shortcuts
// ============================================

export const errors = {
  badRequest: (message = "Bad request", details?: unknown) =>
    error("BAD_REQUEST", message, 400, details),

  unauthorized: (message = "Unauthorized") =>
    error("UNAUTHORIZED", message, 401),

  forbidden: (message = "Forbidden") =>
    error("FORBIDDEN", message, 403),

  notFound: (message = "Not found") =>
    error("NOT_FOUND", message, 404),

  conflict: (message = "Conflict") =>
    error("CONFLICT", message, 409),

  validationError: (message: string, details?: unknown) =>
    error("VALIDATION_ERROR", message, 422, details),

  internal: (message = "Internal server error") =>
    error("INTERNAL_ERROR", message, 500),
} as const;
