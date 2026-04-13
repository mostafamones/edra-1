"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

// ============================================================================
// TYPES
// ============================================================================

export type SkeletonVariant =
  | "table"
  | "card-list"
  | "card-grid"
  | "detail"
  | "form";

export interface DataSkeletonProps {
  /**
   * Layout variant
   */
  variant?: SkeletonVariant;

  /**
   * Number of skeleton rows/cards to render
   */
  count?: number;

  /**
   * Number of columns for table variant
   */
  columns?: number;

  /**
   * Whether to show a header skeleton
   */
  showHeader?: boolean;

  /**
   * Whether to show a search bar skeleton
   */
  showSearch?: boolean;

  /**
   * Whether to show stat cards skeleton
   */
  showStats?: number;

  /**
   * Additional class name
   */
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * DataSkeleton — Reusable skeleton loading states for data-heavy views.
 *
 * @example
 * ```tsx
 * // Table-style loading
 * <DataSkeleton variant="table" count={8} columns={5} showHeader showSearch />
 *
 * // Card list loading
 * <DataSkeleton variant="card-list" count={4} showHeader />
 *
 * // Card grid loading
 * <DataSkeleton variant="card-grid" count={6} />
 * ```
 */
export function DataSkeleton({
  variant = "table",
  count = 5,
  columns = 4,
  showHeader = true,
  showSearch = false,
  showStats,
  className,
}: DataSkeletonProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      {showHeader && (
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-12 w-60" />
          </div>
        </div>
      )}

      {/* Stats row */}
      {showStats && showStats > 0 && (
        <div className={cn(
          "grid gap-3",
          showStats === 2 && "grid-cols-2",
          showStats === 3 && "grid-cols-3",
          showStats >= 4 && "grid-cols-2 sm:grid-cols-4"
        )}>
          {Array.from({ length: showStats }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-lg border px-4 py-3"
            >
              <Skeleton className="size-10 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-5 w-12" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Search bar */}
      {showSearch && (
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 flex-1" />
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-26" />
        </div>
      )}

      {/* Content */}
      {variant === "table" && (
        <TableSkeleton rows={count} columns={columns} />
      )}
      {variant === "card-list" && (
        <CardListSkeleton count={count} />
      )}
      {variant === "card-grid" && (
        <CardGridSkeleton count={count} />
      )}
      {variant === "detail" && <DetailSkeleton />}
      {variant === "form" && <FormSkeleton />}
    </div>
  );
}

// ============================================================================
// VARIANT COMPONENTS
// ============================================================================

function TableSkeleton({ rows, columns }: { rows: number; columns: number }) {
  return (
    <div className="rounded-xl border overflow-hidden">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 p-4 border-b last:border-b-0"
        >
          {i === 0 ? (
            // Header row
            Array.from({ length: columns }).map((_, j) => (
              <Skeleton
                key={j}
                className={cn(
                  "h-4",
                  j === 0 ? "w-48" : "w-20",
                  j === 0 ? "flex-shrink-0" : "flex-1"
                )}
              />
            ))
          ) : (
            // Data rows
            <>
              <Skeleton className="h-5 w-48 flex-shrink-0" />
              <div className="flex items-center justify-around w-full gap-2">
                {Array.from({ length: Math.max(columns - 1, 1) }).map(
                  (_, j) => (
                    <Skeleton
                      key={j}
                      className={cn(
                        "h-5",
                        j === 0 ? "w-20" : "w-16"
                      )}
                    />
                  )
                )}
              </div>
              <Skeleton className="h-6 w-6 flex-shrink-0" />
            </>
          )}
        </div>
      ))}
    </div>
  );
}

function CardListSkeleton({ count }: { count: number }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 rounded-lg border bg-card p-4"
        >
          <Skeleton className="size-10 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-8 w-24 flex-shrink-0" />
        </div>
      ))}
    </div>
  );
}

function CardGridSkeleton({ count }: { count: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-lg border bg-card p-4 space-y-3">
          <div className="flex items-center gap-3">
            <Skeleton className="size-8 rounded-lg" />
            <Skeleton className="h-5 w-32" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
          </div>
          <div className="flex gap-2 pt-1">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="size-16 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-5 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

function FormSkeleton() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
      ))}
      <div className="flex gap-2 pt-4">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  );
}

// ============================================================================
// DOMAIN-SPECIFIC SKELETON PRESETS
// ============================================================================

/**
 * Pre-configured skeleton for the schedules view.
 */
export function ScheduleSkeleton() {
  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-9 w-32" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-16 rounded-lg" />
        <Skeleton className="h-16 rounded-lg" />
      </div>
      <div className="grid gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Pre-configured skeleton for sessions/list views with date filters.
 */
export function SessionSkeleton() {
  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-4 w-56" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-9 w-32" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Skeleton className="h-16 rounded-lg" />
        <Skeleton className="h-16 rounded-lg" />
        <Skeleton className="h-16 rounded-lg" />
      </div>
      <div className="rounded-xl border overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 p-4 border-b last:border-b-0"
          >
            <Skeleton className="h-5 w-24 flex-shrink-0" />
            <Skeleton className="h-5 w-40 flex-shrink-0" />
            <div className="flex-1" />
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-6" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Pre-configured skeleton for the instructors list.
 */
export function InstructorSkeleton() {
  return (
    <div className="flex flex-col gap-12">
      <div className="flex items-center justify-between">
        <Skeleton className="h-12 w-80" />
        <Skeleton className="h-9 w-24" />
      </div>
      <div className="flex flex-col gap-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex items-center gap-4 rounded-lg border bg-card p-4"
          >
            <Skeleton className="size-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-8 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}
