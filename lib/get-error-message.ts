/**
 * Normalize unknown thrown values for user-visible or log messages.
 */
export function getErrorMessage(error: unknown, fallback = "Something went wrong"): string {
  if (error instanceof Error) return error.message
  if (typeof error === "string") return error
  if (error && typeof error === "object" && "message" in error && typeof (error as { message: unknown }).message === "string") {
    return (error as { message: string }).message
  }
  return fallback
}
