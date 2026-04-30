"use client";

import { Skeleton } from "@/components/ui/skeleton";

import type { ScheduleViewMode } from "../types";

function ListViewSkeleton() {
  return (
    <div className="space-y-6">
      {[1, 2, 3].map((section) => (
        <div key={section}>
          <div className="mb-3 flex items-center gap-3">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-6 rounded-full" />
            <Skeleton className="h-px flex-1" />
          </div>
          <div className="grid gap-2">
            {[1, 2].map((row) => (
              <Skeleton key={row} className="h-28 rounded-xl" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function CalendarViewSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border bg-background">
      <div className="grid shrink-0 border-b" style={{ gridTemplateColumns: "56px repeat(5, 1fr)" }}>
        <div className="border-r" />
        {[1, 2, 3, 4, 5].map((column) => (
          <div key={column} className="border-r py-2.5 text-center last:border-r-0">
            <div className="flex items-center justify-center gap-2">
              <Skeleton className="h-6 w-6 rounded" />
              <Skeleton className="h-5 w-12" />
            </div>
          </div>
        ))}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="relative grid" style={{ gridTemplateColumns: "56px repeat(5, 1fr)", height: 1536 }}>
          <div className="relative border-r">
            {Array.from({ length: 24 }, (_, index) => (
              <Skeleton
                key={index}
                className="absolute right-2 h-4 w-full"
                style={{ top: index * 64 }}
              />
            ))}
          </div>
          {[1, 2, 3, 4, 5].map((column) => (
            <div key={column} className="relative border-r last:border-r-0">
              {Array.from({ length: 24 }, (_, index) => (
                <Skeleton key={index} className="absolute h-px w-full" style={{ top: index * 64 }} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SchedulesViewSkeleton({ viewMode }: { viewMode: ScheduleViewMode }) {
  return viewMode === "calendar" ? <CalendarViewSkeleton /> : <ListViewSkeleton />;
}
