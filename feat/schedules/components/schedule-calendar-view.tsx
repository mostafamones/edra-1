"use client";

import { useEffect, useMemo, useRef } from "react";

import type { ScheduleWithRelations } from "@/lib/types";

import {
  BLOCK_GAP,
  DAYS_SHORT,
  DEFAULT_DURATION,
  HOUR_HEIGHT,
} from "../constants";
import type { ScheduleRow } from "../types";
import { normalizeDayOfWeek } from "../utils/derive-schedules";
import { formatTimeShort, timeToMinutes, toDateString } from "../utils/format-time";
import { ScheduleCalendarEvent } from "./schedule-calendar-event";

function getNextFiveDays() {
  const today = new Date();
  return Array.from({ length: 5 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() + index);
    return date;
  });
}

function isToday(date: Date) {
  return date.toDateString() === new Date().toDateString();
}

export function ScheduleCalendarView({
  rows,
  matchedScheduleIds,
  onSelectSchedule,
}: {
  rows: ScheduleRow[];
  matchedScheduleIds?: Set<number>;
  onSelectSchedule: (schedule: ScheduleWithRelations) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const nextFiveDays = useMemo(() => getNextFiveDays(), []);
  const nextFiveStrings = useMemo(() => nextFiveDays.map(toDateString), [nextFiveDays]);

  const activeRows = useMemo(
    () => rows.filter((row) => row.schedule.is_active !== false),
    [rows]
  );

  const dayData = useMemo(
    () =>
      nextFiveDays.map((date, index) => {
        const dayOfWeek = date.getDay();
        const dateStr = nextFiveStrings[index];
        const dayRows = activeRows.filter((row) => {
          if (!row.timeSlot.start_time) return false;

          if (row.schedule.schedule_type !== "one_off") {
            return normalizeDayOfWeek(row.timeSlot.day_of_week) === dayOfWeek;
          }

          const instanceDate = row.timeSlot.instance_date || row.schedule.one_off_date;
          return instanceDate === dateStr;
        });

        return {
          date,
          today: isToday(date),
          rows: dayRows,
        };
      }),
    [activeRows, nextFiveDays, nextFiveStrings]
  );

  const { startHour, totalHours } = useMemo(() => {
    let minHour = 8;
    let maxHour = 22;

    activeRows.forEach((row) => {
      if (!row.timeSlot.start_time) return;

      const startMinutes = timeToMinutes(row.timeSlot.start_time);
      const endMinutes = row.timeSlot.end_time
        ? timeToMinutes(row.timeSlot.end_time)
        : startMinutes + DEFAULT_DURATION;

      const eventStartHour = Math.floor(startMinutes / 60);
      const eventEndHour = Math.ceil(endMinutes / 60);

      if (eventStartHour < minHour) minHour = Math.max(0, eventStartHour);
      if (eventEndHour > maxHour) maxHour = Math.min(24, eventEndHour);
    });

    return {
      startHour: minHour,
      totalHours: Math.max(1, maxHour - minHour),
    };
  }, [activeRows]);

  useEffect(() => {
    if (!scrollRef.current) return;

    const container = scrollRef.current;
    const currentHour = new Date().getHours();

    if (currentHour >= startHour && currentHour <= startHour + totalHours) {
      const gridHeight = Math.max(container.clientHeight, totalHours * HOUR_HEIGHT);
      const topPx = ((currentHour - startHour) / totalHours) * gridHeight;
      container.scrollTop = Math.max(0, topPx - container.clientHeight / 2 + HOUR_HEIGHT / 2);
    }
  }, [startHour, totalHours]);

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const showNowLine =
    currentMinutes / 60 >= startHour && currentMinutes / 60 <= startHour + totalHours;
  const nowPct = showNowLine
    ? (((currentMinutes / 60) - startHour) / totalHours) * 100
    : 0;

  return (
    <div className="flex h-[calc(100vh-9.75rem)] flex-col overflow-hidden rounded-xl border bg-background">
      <div className="grid shrink-0 border-b" style={{ gridTemplateColumns: "56px repeat(5, 1fr)" }}>
        <div className="border-r" />
        {dayData.map(({ date, today }, index) => (
          <div
            key={index}
            className={`border-r py-2.5 text-center last:border-r-0 ${today ? "bg-primary/5" : ""}`}
          >
            <div className="flex items-center justify-center gap-2">
              <p className={`text-lg font-semibold leading-tight ${today ? "text-primary" : ""}`}>
                {date.getDate()}
              </p>
              <p className={`text-md font-medium uppercase ${today ? "text-primary" : "text-muted-foreground"}`}>
                {DAYS_SHORT[date.getDay()]}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div ref={scrollRef} className="relative min-h-0 flex-1 overflow-y-auto">
        <div
          className="relative grid h-full"
          style={{ gridTemplateColumns: "56px repeat(5, 1fr)", minHeight: totalHours * HOUR_HEIGHT }}
        >
          <div className="relative border-r">
            {Array.from({ length: totalHours + 1 }, (_, index) => (
              <div
                key={index}
                className="absolute flex w-full items-start justify-end pr-2"
                style={{ top: `${(index / totalHours) * 100}%` }}
              >
                <span className="-translate-y-1/2 text-[10px] font-medium tabular-nums text-muted-foreground">
                  {formatTimeShort(`${startHour + index}:00`)}
                </span>
              </div>
            ))}
          </div>

          {dayData.map(({ today, rows: dayRows }, columnIndex) => (
            <div
              key={columnIndex}
              className={`relative border-r last:border-r-0 ${today ? "bg-primary/[0.02]" : ""}`}
            >
              {Array.from({ length: totalHours + 1 }, (_, index) => (
                <div
                  key={index}
                  className="absolute w-full border-t border-border/40"
                  style={{ top: `${(index / totalHours) * 100}%` }}
                />
              ))}

              {Array.from({ length: totalHours }, (_, index) => (
                <div
                  key={`half-${index}`}
                  className="absolute w-full border-t border-dashed border-border/20"
                  style={{ top: `${((index + 0.5) / totalHours) * 100}%` }}
                />
              ))}

              {today && showNowLine ? (
                <div className="absolute left-0 right-0 z-20 flex items-center" style={{ top: `${nowPct}%` }}>
                  <div className="-ml-1 size-2 shrink-0 rounded-full bg-destructive" />
                  <div className="h-[1.5px] flex-1 bg-destructive/60" />
                </div>
              ) : null}

              {dayRows.map((row) => (
                <ScheduleCalendarEvent
                  key={`${row.schedule.id}-${row.timeSlot.id}-${BLOCK_GAP}`}
                  row={row}
                  startHour={startHour}
                  totalHours={totalHours}
                  today={today}
                  currentMinutes={currentMinutes}
                  isDimmed={
                    !!matchedScheduleIds &&
                    matchedScheduleIds.size > 0 &&
                    !matchedScheduleIds.has(row.schedule.id)
                  }
                  onSelect={() => onSelectSchedule(row.schedule)}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
