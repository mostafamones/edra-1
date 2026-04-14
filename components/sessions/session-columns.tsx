import type { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import {
  IconArchive,
  IconArchiveOff,
  IconArrowDown,
  IconArrowUp,
  IconEye,
  IconSelector,
  IconTrash,
} from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import type { SessionWithSchedule } from "@/lib/types"

export interface SessionColumnsProps {
  onView: (s: SessionWithSchedule) => void
  onDelete: (s: SessionWithSchedule) => void
  onArchive?: (s: SessionWithSchedule) => void
}

export function SortableHeader({
  column,
  label,
}: {
  column: any
  label: string
}) {
  const sorted = column.getIsSorted()
  return (
    <button
      className="flex items-center gap-1 hover:text-foreground transition-colors -ml-1 px-1 rounded"
      onClick={() => column.toggleSorting(sorted === "asc")}
    >
      <span>{label}</span>
      {sorted === "asc" ? (
        <IconArrowUp className="size-3" />
      ) : sorted === "desc" ? (
        <IconArrowDown className="size-3" />
      ) : (
        <IconSelector className="size-3 opacity-40" />
      )}
    </button>
  )
}

export function selectColumn(): ColumnDef<SessionWithSchedule> {
  return {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-x-[6.5px]"
      />
    ),
    cell: ({ row }) => (
      <div className="p-1">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          onClick={(e) => e.stopPropagation()}
          className="translate-x-[3px]"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
    size: 35,
  }
}

export function nameColumn(): ColumnDef<SessionWithSchedule> {
  return {
    accessorKey: "name",
    header: ({ column }) => <SortableHeader column={column} label="NAME" />,
    cell: ({ row }) => {
      const session = row.original
      const schedule = session.schedule
      const isLive = !session.is_cancelled && session.status === "live"
      const hasSessionName = !!session.name

      return (
        <div className="flex items-center gap-4">
          {isLive && (
            <div className="relative flex-shrink-0">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="absolute top-0 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              </span>
            </div>
          )}
          <div className="text-sm">
            <p>{hasSessionName ? session.name : schedule?.name}</p>
            <p className="text-xs text-muted-foreground">
              {hasSessionName && schedule?.name ? `${schedule.name} · ` : ""}
              {schedule?.level?.name}
              {schedule?.group?.name ? ` · ${schedule.group.name}` : ""}
            </p>
          </div>
        </div>
      )
    },
    sortingFn: (a, b) => {
      const aLive = a.original.schedule && a.original.status === "live"
      const bLive = b.original.schedule && b.original.status === "live"
      if (aLive && !bLive) return -1
      if (!aLive && bLive) return 1
      return 0
    },
  }
}

export function dateColumn(): ColumnDef<SessionWithSchedule> {
  return {
    accessorKey: "session_date",
    header: ({ column }) => <SortableHeader column={column} label="DATE" />,
    cell: ({ row }) => {
      const date = row.getValue("session_date") as string
      return <div className="text-sm">{format(new Date(date), "MMM d, yyyy")}</div>
    },
    sortingFn: (a, b) => {
      const aLive = a.original.schedule && !a.original.is_cancelled
      const bLive = b.original.schedule && !b.original.is_cancelled
      if (aLive && !bLive) return -1
      if (!aLive && bLive) return 1
      return 0
    },
  }
}

export function timeColumn(): ColumnDef<SessionWithSchedule> {
  return {
    accessorKey: "session_date",
    id: "time",
    header: "TIME",
    cell: ({ row }) => {
      const sessionDate = row.original.session_date
      const schedule = row.original.schedule
      const timeSlot = schedule?.time_slots?.[0]

      if (timeSlot?.day_of_week !== undefined && timeSlot?.day_of_week !== null) {
        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
        const dayName = days[timeSlot.day_of_week]
        return (
          <div className="text-sm">
            <span className="font-medium">{dayName}</span>
            <span className="text-muted-foreground"> {timeSlot.start_time}</span>
          </div>
        )
      }

      const time = format(new Date(sessionDate), "h:mm a")
      return <div className="text-sm">{time}</div>
    },
  }
}

export function statusColumn(): ColumnDef<SessionWithSchedule> {
  return {
    accessorKey: "status",
    header: "STATUS",
    cell: ({ row }) => {
      const isCancelled = row.original.is_cancelled
      const status = (row.getValue("status") as string) || "live"

      if (isCancelled) {
        return (
          <Badge variant="destructive" className="capitalize text-xs">
            Cancelled
          </Badge>
        )
      }

      return (
        <Badge
          variant={
            status === "archived"
              ? "secondary"
              : status === "ended"
                ? "outline"
                : "outline"
          }
          className={
            status === "live"
              ? "border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-300 capitalize text-xs"
              : "capitalize text-xs"
          }
        >
          {status}
        </Badge>
      )
    },
  }
}

export function actionsColumn({
  onView,
  onDelete,
  onArchive,
}: SessionColumnsProps): ColumnDef<SessionWithSchedule> {
  return {
    id: "actions",
    enableHiding: false,
    enableSorting: false,
    size: 50,
    cell: ({ row }) => {
      const session = row.original
      return (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            title="View Details"
            className="h-7 w-7 p-0 text-muted-foreground"
            onClick={(e) => {
              e.stopPropagation()
              onView(session)
            }}
          >
            <IconEye className="size-4" />
          </Button>
          {onArchive && (
            <Button
              variant="ghost"
              title={session.status === "archived" ? "Unarchive" : "Archive"}
              className="h-7 w-7 p-0 text-muted-foreground"
              onClick={(e) => {
                e.stopPropagation()
                onArchive(session)
              }}
            >
              {session.status === "archived" ? (
                <IconArchiveOff className="size-4" />
              ) : (
                <IconArchive className="size-4" />
              )}
            </Button>
          )}
          <Button
            variant="ghost"
            title="Delete"
            className="h-7 w-7 p-0 text-destructive"
            onClick={(e) => {
              e.stopPropagation()
              onDelete(session)
            }}
          >
            <IconTrash className="size-4" />
          </Button>
        </div>
      )
    },
  }
}

export function buildSessionColumns({
  onView,
  onDelete,
  onArchive,
}: SessionColumnsProps): ColumnDef<SessionWithSchedule>[] {
  return [
    selectColumn(),
    nameColumn(),
    dateColumn(),
    timeColumn(),
    statusColumn(),
    actionsColumn({ onView, onDelete, onArchive }),
  ]
}

