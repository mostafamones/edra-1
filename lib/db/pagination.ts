/**
 * Shared pagination primitives for DB helpers.
 *
 * Pair with `parsePagination` / `paginated()` from `@/lib/api/response` at the
 * route edge.
 */

export interface ListPagination {
  /** 1-based page number */
  page: number;
  /** Rows per page */
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
}
