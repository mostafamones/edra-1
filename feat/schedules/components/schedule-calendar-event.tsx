"use client";

import { IconClock } from "@tabler/icons-react";

import { Card } from "@/components/ui/card";
import { borderClassForColorId } from "@/components/helpers/academy-utils";
import { cn } from "@/lib/utils";

import type { ScheduleRow } from "../types";
import { formatTimeShort, timeToMinutes } from "../utils/format-time";

export function ScheduleCalendarEvent({
  row,
  startHour,
  totalHours,
  today,
  currentMinutes,
  isDimmed = false,
  onSelect,
}: {
  row: ScheduleRow;
  startHour: number;
  totalHours: number;
  today: boolean;
  currentMinutes: number;
  isDimmed?: boolean;
  onSelect: () => void;
}) {
  const startMinutes = timeToMinutes(row.timeSlot.start_time);
  const endMinutes = row.timeSlot.end_time
    ? timeToMinutes(row.timeSlot.end_time)
    : startMinutes + 120;
  const duration = endMinutes - startMinutes;
  const topPct = (((startMinutes / 60) - startHour) / totalHours) * 100;
  const heightPct = ((duration / 60) / totalHours) * 100;
  const isPast = today && endMinutes <= currentMinutes;

  return (
    <Card
      className={cn(
        borderClassForColorId(row.schedule.level?.color),
        "group absolute left-1 right-1 z-10 h-auto items-start overflow-hidden rounded-md border-l-2 bg-card px-2 py-2 text-left transition hover:scale-[1.02] hover:shadow-md",
        isPast && "opacity-50 saturate-75",
        isDimmed && "opacity-25 saturate-50"
      )}
      style={{
        top: `calc(${topPct}% + 1px)`,
        height: `calc(${heightPct}% - 2px)`,
        minHeight: "24px",
      }}
      onClick={onSelect}
    >
      <div className="min-w-0 h-full flex flex-col justify-between">
        <div className="flex flex-col gap-0.5">
          <p className="truncate text-[13px] font-semibold leading-tight">{row.schedule.name}</p>
          {duration >= 45 ? (
            <p className="flex items-center gap-1 text-[11px] leading-tight text-muted-foreground group-hover:text-foreground/80">
              <IconClock className="size-3" />
              {formatTimeShort(row.timeSlot.start_time)}
              {row.timeSlot.end_time ? ` - ${formatTimeShort(row.timeSlot.end_time)}` : ""}
            </p>
          ) : null}
        </div>
        {duration >= 60 && row.schedule.level?.name ? (
          <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
            {row.schedule.level.name}
            {row.schedule.group?.name ? ` · ${row.schedule.group.name}` : ""}
          </p>
        ) : null}
      </div>
    </Card>
  );
}
