import { NextRequest } from "next/server";
import { z, ZodSchema, ZodError } from "zod";
import { errors } from "./response";

// ============================================
// Validation Result Types
// ============================================

type ValidationSuccess<T> = { success: true; data: T };
type ValidationFailure = { success: false; response: ReturnType<typeof errors.validationError> };
type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

// ============================================
// Body Validation
// ============================================

/**
 * Validate a JSON request body against a Zod schema.
 *
 * Usage in an API route:
 * ```ts
 * const result = await validateBody(request, mySchema);
 * if (!result.success) return result.response;
 * const data = result.data; // fully typed
 * ```
 */
export async function validateBody<T extends ZodSchema>(
  request: NextRequest,
  schema: T
): Promise<ValidationResult<z.infer<T>>> {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return {
        success: false,
        response: errors.validationError(
          "Request body validation failed",
          formatZodErrors(parsed.error)
        ),
      };
    }

    return { success: true, data: parsed.data };
  } catch {
    return {
      success: false,
      response: errors.badRequest("Invalid JSON in request body"),
    };
  }
}

// ============================================
// Query Parameter Validation
// ============================================

/**
 * Validate URL search parameters against a Zod schema.
 *
 * Converts the URLSearchParams to a plain object before validation.
 *
 * Usage:
 * ```ts
 * const result = validateQuery(request, myQuerySchema);
 * if (!result.success) return result.response;
 * const { academyId, page } = result.data;
 * ```
 */
export function validateQuery<T extends ZodSchema>(
  request: NextRequest,
  schema: T
): ValidationResult<z.infer<T>> {
  const params: Record<string, string> = {};
  request.nextUrl.searchParams.forEach((value, key) => {
    params[key] = value;
  });

  const parsed = schema.safeParse(params);

  if (!parsed.success) {
    return {
      success: false,
      response: errors.validationError(
        "Query parameter validation failed",
        formatZodErrors(parsed.error)
      ),
    };
  }

  return { success: true, data: parsed.data };
}

// ============================================
// Common Schemas
// ============================================

/** Reusable schema for routes that require an academyId query parameter. */
export const academyIdQuerySchema = z.object({
  academyId: z.string().uuid("academyId must be a valid UUID"),
});

/** Reusable schema for paginated list queries. */
export const paginatedQuerySchema = z.object({
  academyId: z.string().uuid("academyId must be a valid UUID"),
  page: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : undefined)),
  limit: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : undefined)),
});

// ============================================
// Helpers
// ============================================

/**
 * Format Zod errors into a structured array for API responses.
 */
function formatZodErrors(zodError: ZodError): Array<{ field: string; message: string }> {
  return zodError.issues.map((issue) => ({
    field: issue.path.join("."),
    message: issue.message,
  }));
}
