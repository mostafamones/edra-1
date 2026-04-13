"use client";

import { useState, useEffect, useCallback, useRef } from "react";

// ============================================================================
// TYPES
// ============================================================================

export interface UseQueryOptions<T> {
  /** Whether to fetch data immediately on mount. Default: true */
  enabled?: boolean;

  /** Time-to-live for cached data in ms. Default: 5 minutes */
  cacheTTL?: number;

  /** Transform the raw response JSON before storing */
  transform?: (data: any) => T;

  /** Dependencies that trigger a refetch when changed */
  deps?: unknown[];
}

export interface UseQueryResult<T> {
  /** The fetched data, or null if not yet loaded / errored */
  data: T | null;

  /** Whether the initial fetch is in progress */
  loading: boolean;

  /** Whether a background refresh is in progress */
  refreshing: boolean;

  /** Error message if the fetch failed */
  error: string | null;

  /** Manually refresh the data */
  refresh: () => Promise<void>;

  /** Optimistically update the local data without refetching */
  setData: React.Dispatch<React.SetStateAction<T | null>>;
}

// ============================================================================
// IN-MEMORY CACHE
// ============================================================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const queryCache = new Map<string, CacheEntry<unknown>>();

/**
 * Invalidate cache entries matching a prefix.
 * Call this after mutations to force fresh data on next fetch.
 *
 * @example
 * ```ts
 * // After creating a student:
 * invalidateCache("students");
 * ```
 */
export function invalidateCache(prefix: string): void {
  for (const key of queryCache.keys()) {
    if (key.startsWith(prefix)) {
      queryCache.delete(key);
    }
  }
}

/**
 * Clear the entire query cache.
 */
export function clearCache(): void {
  queryCache.clear();
}

// ============================================================================
// GENERIC useQuery HOOK
// ============================================================================

/**
 * useQuery — a lightweight data-fetching hook with caching.
 *
 * Features:
 * - In-memory cache with configurable TTL
 * - Loading and error states
 * - Background refresh
 * - Optimistic data updates via `setData`
 * - Dependency-based refetching
 *
 * @param cacheKey  Unique key for this query (also used as the API URL unless `fetcher` overrides)
 * @param fetcher   An async function that returns the data
 * @param options   Configuration options
 *
 * @example
 * ```ts
 * const { data, loading, error, refresh } = useQuery(
 *   `/api/students?academyId=${academyId}`,
 *   () => fetch(`/api/students?academyId=${academyId}`).then(r => r.json()),
 *   { enabled: !!academyId, deps: [academyId] }
 * );
 * ```
 */
export function useQuery<T>(
  cacheKey: string | null,
  fetcher: () => Promise<T>,
  options: UseQueryOptions<T> = {}
): UseQueryResult<T> {
  const {
    enabled = true,
    cacheTTL = 5 * 60 * 1000, // 5 minutes default
    transform,
    deps = [],
  } = options;

  const [data, setData] = useState<T | null>(() => {
    // Check cache on mount
    if (cacheKey) {
      const cached = queryCache.get(cacheKey) as CacheEntry<T> | undefined;
      if (cached && Date.now() - cached.timestamp < cacheTTL) {
        return cached.data;
      }
    }
    return null;
  });
  const [loading, setLoading] = useState<boolean>(!data && enabled);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track the latest cacheKey to avoid stale updates
  const latestKey = useRef(cacheKey);
  latestKey.current = cacheKey;

  const fetchData = useCallback(
    async (isRefresh = false) => {
      if (!cacheKey || !enabled) return;

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        let result: any = await fetcher();

        if (transform) {
          result = transform(result);
        }

        // Only apply if cacheKey hasn't changed during the fetch
        if (latestKey.current === cacheKey) {
          setData(result as T);
          queryCache.set(cacheKey, { data: result, timestamp: Date.now() });
        }
      } catch (err: any) {
        if (latestKey.current === cacheKey) {
          setError(err?.message || "Failed to fetch data");
        }
      } finally {
        if (latestKey.current === cacheKey) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cacheKey, enabled, ...deps]
  );

  // Auto-fetch on mount and when deps change
  useEffect(() => {
    if (!enabled || !cacheKey) {
      setLoading(false);
      return;
    }

    // Check if cache is still valid
    const cached = queryCache.get(cacheKey) as CacheEntry<T> | undefined;
    if (cached && Date.now() - cached.timestamp < cacheTTL) {
      setData(cached.data);
      setLoading(false);
      return;
    }

    fetchData(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey, enabled, ...deps]);

  const refresh = useCallback(async () => {
    // Invalidate cache before refetching
    if (cacheKey) {
      queryCache.delete(cacheKey);
    }
    await fetchData(true);
  }, [cacheKey, fetchData]);

  return { data, loading, refreshing, error, refresh, setData };
}
