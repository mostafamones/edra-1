"use client";

import {
  IconClock,
  IconDotsVertical,
  IconEdit,
  IconGitBranch,
  IconSchool,
  IconTrash,
  IconUsers,
} from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { borderClassForColorId } from "@/components/helpers/academy-utils";

import type { ScheduleRow } from "../types";
import { formatDate, formatTime } from "../utils/format-time";

export function ScheduleListRowCard({
  row,
  onEdit,
  onDelete,
}: {
  row: ScheduleRow;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { schedule, timeSlot } = row;
  const studentCount = schedule.schedule_enrollments?.[0]?.count ?? 0;
  const isActive = schedule.is_active !== false;
  const slotCount = schedule.time_slots?.length ?? 0;
  const instanceDate = timeSlot.instance_date || schedule.one_off_date;

  return (
    <Card
      size="sm"
      className={`border-l-3 bg-card/40 transition-colors shadow-sm hover:bg-muted/30 ${borderClassForColorId(schedule.level?.color)} ${!isActive ? "opacity-60" : ""}`}
    >
      <CardContent className="flex items-center gap-2 py-1">
        <div className="flex flex-col items-center gap-0 px-2 pr-4">
          {instanceDate ? (
            <span className="flex items-center gap-1 text-muted-foreground text-xs">
              {formatDate(instanceDate)}
            </span>
          ) : null}
          {timeSlot.start_time ? (
            <span className="flex items-center gap-1.5 text-[15px]">
              <IconClock className="size-4 text-muted-foreground" />
              {formatTime(timeSlot.start_time)}
            </span>
          ) : !instanceDate ? (
            <span className="italic">No time</span>
          ) : null}
        </div>

        <div className="flex flex-col items-left gap-0.5">
          <div className="flex flex-wrap items-start gap-2">
            <h3 className="truncate text-base font-medium">{schedule.name}</h3>
            {schedule.auto_assign ? (
              <Badge variant="secondary" className="text-[11px] px-2.5">
                Auto-assign
              </Badge>
            ) : null}
            {!schedule.show_on_form && !schedule.auto_assign ? (
              <Badge variant="secondary" className="gap-1 text-[11px]">
                Manually assigned
              </Badge>
            ) : null}
            {schedule.schedule_type === "one_off" ? (
              <Badge variant="secondary" className="text-[11px]">
                One-off
              </Badge>
            ) : null}
            {slotCount > 1 && schedule.schedule_type !== "one_off" ? (
              <Badge variant="secondary" className="text-[11px]">
                {slotCount} days/wk
              </Badge>
            ) : null}
            {!isActive ? (
              <Badge variant="outline" className="text-[11px] text-muted-foreground">
                Inactive
              </Badge>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            {schedule.level?.name ? (
              <span className="flex items-center gap-1">
                <IconSchool className="size-3" />
                {schedule.level.name}
              </span>
            ) : null}
            {schedule.group?.name ? (
              <span className="flex items-center gap-1">
                <IconGitBranch className="size-3" />
                {schedule.group.name}
              </span>
            ) : null}
            <span className="flex items-center gap-1">
              <IconUsers className="size-3" />
              {studentCount} student{studentCount !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        <div className="ml-auto">
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm">
                  <IconDotsVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit}>
                  <IconEdit className="size-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDelete} variant="destructive">
                  <IconTrash className="size-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
