"use client"

import React, { useEffect } from "react"
import { useQuery, invalidateCache, type UseQueryOptions } from "./use-query"
import { apiFetch } from "@/lib/api/client"
import { createClient } from "@/utils/supabase/client"
import type { AttendanceWithStudent } from "@/lib/types"

/**
 * Fetch all attendance records for a specific session.
 * Integrates Supabase Realtime filtering by `session_id`.
 * 
 * @example
 * ```tsx
 * const { data: attendance, loading, refresh } = useAttendance(sessionId);
 * ```
 */
export function useAttendance(
  sessionId: number | null,
  options: UseQueryOptions<AttendanceWithStudent[]> = {}
) {
  const cacheKey = sessionId ? `attendance:${sessionId}` : null

  const result = useQuery<AttendanceWithStudent[]>(
    cacheKey,
    () =>
      apiFetch<AttendanceWithStudent[]>(
        `/api/attendance?sessionId=${sessionId}&_t=${Date.now()}`,
        { cache: "no-store" }
      ),
    {
      enabled: !!sessionId,
      deps: [sessionId],
      ...options,
    }
  )
  // Use a ref to store the latest refresh function so it doesn't trigger effect re-runs
  const refreshRef = React.useRef(result.refresh)
  useEffect(() => {
    refreshRef.current = result.refresh
  }, [result.refresh])

  // Subscribes to Supabase Realtime for this session's attendance
  useEffect(() => {
    if (!sessionId) return

    const supabase = createClient()

    // Subscribe to INSERT, UPDATE, DELETE on the attendance table for this session
    const channel = supabase
      .channel(`realtime-attendance-${sessionId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "attendance", filter: `session_id=eq.${sessionId}` },
        (payload: any) => {
          console.log("Realtime event received:", payload)
          // Local fallback filter if Supabase Realtime drops bigint composite updates
          const newRecord = payload.new as any
          const oldRecord = payload.old as any
          const isRelevant =
            newRecord?.session_id === sessionId ||
            oldRecord?.session_id === sessionId

          if (isRelevant || payload.eventType === "DELETE") {
            refreshRef.current?.()
          }
        }
      )
      .subscribe((status, err) => {
        console.log("Realtime Status:", status, err)
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [sessionId])

  return result
}

/** Invalidate attendance cache globally if needed. */
export function invalidateAttendance() {
  invalidateCache("attendance:")
}
