import { ScheduleWithRelations } from "@/lib/types";
import { Card } from "../ui/card";
import { IconClock, IconGitBranch, IconSchool, IconUsers } from "@tabler/icons-react";
import { formatTime } from "./schedule-list-view";
import { cn } from "@/lib/utils";
import { borderClassForColorId } from "../helpers/academy-utils";

export function ScheduleCard({ schedule }: { schedule: ScheduleWithRelations }) {
  return (
    <Card className={cn("px-6 h-18 flex flex-row items-center gap-8 border-l-2 ", borderClassForColorId(schedule.level?.color))}>
      <div className="flex items-center gap-4">
        <IconClock className="size-4 text-muted-foreground" />
        <div className="flex flex-col">
          <p className="text-sm tabular-nums">{formatTime(schedule.time_slots[0].start_time)}</p>
          <p className="text-xs text-muted-foreground tabular-nums">{schedule.time_slots[0].end_time ? formatTime(schedule.time_slots[0].end_time) : ""}</p>
        </div>
      </div>
      <div className="flex flex-col gap-0.5">
        <h1 className="text-sm font-medium truncate">{schedule.name}</h1> 

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <IconSchool className="size-3 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">{schedule.level?.name}</p>
          </div>
          {schedule.group && <div className="flex items-center gap-1">
            <IconUsers className="size-3 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">{schedule.group?.name}</p>
          </div>}
        </div>
        
      </div>
    </Card>
  )
}