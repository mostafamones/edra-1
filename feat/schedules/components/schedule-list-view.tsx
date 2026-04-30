"use client";

import type { ScheduleWithRelations } from "@/lib/types";

import type { ScheduleDaySection as ScheduleDaySectionType, ScheduleRow } from "../types";
import { ScheduleDaySection } from "./schedule-day-section";
import { ScheduleListRowCard } from "./schedule-list-row-card";

export function ScheduleListView({
  activeDays,
  unscheduledRows,
  oneOffRows,
  onEdit,
  onDelete,
}: {
  activeDays: ScheduleDaySectionType[];
  unscheduledRows: ScheduleRow[];
  oneOffRows: ScheduleRow[];
  onEdit: (schedule: ScheduleWithRelations) => void;
  onDelete: (schedule: ScheduleWithRelations) => void;
}) {
  return (
    <div className="space-y-6">
      {activeDays.map(({ dayIndex, dayName, rows }) => (
        <ScheduleDaySection key={dayIndex} title={dayName} count={rows.length}>
          {rows.map((row) => (
            <ScheduleListRowCard
              key={`${row.schedule.id}-${row.timeSlot.id}`}
              row={row}
              onEdit={() => onEdit(row.schedule)}
              onDelete={() => onDelete(row.schedule)}
            />
          ))}
        </ScheduleDaySection>
      ))}

      {unscheduledRows.length > 0 ? (
        <ScheduleDaySection title="Unscheduled" count={unscheduledRows.length}>
          {unscheduledRows.map((row) => (
            <ScheduleListRowCard
              key={`unscheduled-${row.schedule.id}-${row.timeSlot.id}`}
              row={row}
              onEdit={() => onEdit(row.schedule)}
              onDelete={() => onDelete(row.schedule)}
            />
          ))}
          <p className="mt-2 text-[11px] text-muted-foreground">
            These schedules are missing day or time slots. Edit them to add time slots.
          </p>
        </ScheduleDaySection>
      ) : null}

      {oneOffRows.length > 0 ? (
        <ScheduleDaySection title="One-off Sessions" count={oneOffRows.length}>
          {oneOffRows.map((row) => (
            <ScheduleListRowCard
              key={`oneoff-${row.schedule.id}-${row.timeSlot.id}`}
              row={row}
              onEdit={() => onEdit(row.schedule)}
              onDelete={() => onDelete(row.schedule)}
            />
          ))}
        </ScheduleDaySection>
      ) : null}
    </div>
  );
}
