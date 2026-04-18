"use client"

import type { CellContext, Column, ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  IconDotsVertical,
  IconEdit,
  IconTrash,
  IconArrowUp,
  IconArrowDown,
  IconSelector,
  IconArchive,
  IconArchiveOff,
} from "@tabler/icons-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import type { StudentWithLevelRating, StudentField } from "@/lib/types"
import { STATUS_COLORS, getFieldDisplayValue } from "./helpers"

// ─── Sortable Header ──────────────────────────────────────────

type StudentScheduleEnrollment = NonNullable<StudentWithLevelRating["schedule_enrollments"]>[number]
type StudentSchedule = NonNullable<StudentScheduleEnrollment["schedule"]> & {
  is_mandatory?: boolean
}

function isMandatorySchedule(schedule: StudentScheduleEnrollment["schedule"]) {
  return (schedule as StudentSchedule | null)?.is_mandatory === true
}

export function SortableHeader<TData>({
  column,
  label,
}: {
  column: Column<TData, unknown>
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

// ─── Core column definitions ──────────────────────────────────

export function selectColumn<TRow extends StudentWithLevelRating>(): ColumnDef<TRow> {
  return {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
        aria-label="Select all"
        className="translate-x-[6px]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(v) => row.toggleSelected(!!v)}
        aria-label="Select row"
        className="translate-x-[6px]"
        onClick={(e) => e.stopPropagation()}
      />
    ),
    enableSorting: false,
    enableHiding: false,
    size: 35,
  }
}

export function nameColumn<TRow extends StudentWithLevelRating>(): ColumnDef<TRow> {
  return {
    accessorKey: "full_name",
    header: ({ column }) => <SortableHeader column={column} label="NAME" />,
    cell: ({ row }) => (
      <p className="font-medium text-sm truncate">{row.original.full_name}</p>
    ),
    enableHiding: false,
  }
}

export function statusColumn<TRow extends StudentWithLevelRating>(): ColumnDef<TRow> {
  return {
    accessorKey: "status",
    header: ({ column }) => <SortableHeader column={column} label="STATUS" />,
    cell: ({ row }) => {
      const student = row.original
      const isArchived = student.is_archived
      const status = isArchived ? "archived" : (student.status || "inactive")
      const badgeClass = isArchived
        ? "bg-muted text-muted-foreground border-border"
        : (STATUS_COLORS[status] || "")
      return (
        <Badge variant="outline" className={`text-xs capitalize ${badgeClass}`}>
          {status}
        </Badge>
      )
    },
  }
}

export function levelColumn<TRow extends StudentWithLevelRating>(): ColumnDef<TRow> {
  return {
    id: "level",
    header: "LEVEL",
    accessorFn: (row) => row.level?.name || "",
    cell: ({ row }) => {
      const name = row.original.level?.name
      return name ? (
        <Badge variant="outline" className="text-xs font-normal">{name}</Badge>
      ) : (
        <span className="text-muted-foreground text-xs">—</span>
      )
    },
  }
}

export function groupColumn<TRow extends StudentWithLevelRating>(): ColumnDef<TRow> {
  return {
    id: "group",
    header: "GROUP",
    accessorFn: (row) => row.group?.name || "",
    cell: ({ row }) => {
      const name = row.original.group?.name
      return name ? (
        <span className="text-sm">{name}</span>
      ) : (
        <span className="text-muted-foreground text-xs">—</span>
      )
    },
  }
}

export function schedulesColumn<TRow extends StudentWithLevelRating>(): ColumnDef<TRow> {
  return {
    id: "schedules",
    header: "SCHEDULES",
    cell: ({ row }) => {
      const schedules = row.original.schedule_enrollments || []
      if (schedules.length === 0) {
        return <span className="text-muted-foreground text-xs">—</span>
      }

      const sortedSchedules = [...schedules].sort((a, b) => {
        const aMandatory = isMandatorySchedule(a.schedule) ? 1 : 0
        const bMandatory = isMandatorySchedule(b.schedule) ? 1 : 0
        return aMandatory - bMandatory
      })

      return (
        <div className="flex flex-wrap gap-1">
          {sortedSchedules.slice(0, 1).map((s, i) => (
            <Badge key={i} variant="secondary" className="text-xs px-1.5 py-0 font-normal">
              {s.schedule?.name || "Schedule"}
            </Badge>
          ))}
          {sortedSchedules.length > 1 && (
            <Tooltip>
              <TooltipTrigger>
                <Badge variant="outline" className="text-xs px-1.5 py-0 font-normal">
                  +{sortedSchedules.length - 1}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                {sortedSchedules.slice(1).map((s, i) => (
                  <p key={i} className="text-xs px-1.5 py-0 font-normal">
                    {s.schedule?.name || "Schedule"}
                  </p>
                ))}
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      )
    },
    enableSorting: false,
  }
}

export function joinedColumn<TRow extends StudentWithLevelRating>(): ColumnDef<TRow> {
  return {
    accessorKey: "created_at",
    header: ({ column }) => <SortableHeader column={column} label="Joined" />,
    cell: ({ row }) => {
      const date = row.getValue("created_at") as string | null
      if (!date) return <span className="text-muted-foreground text-xs">—</span>
      return (
        <span className="text-xs text-muted-foreground tabular-nums">
          {new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </span>
      )
    },
  }
}

export function fieldColumns<TRow extends StudentWithLevelRating>(
  fields: StudentField[],
): ColumnDef<TRow>[] {
  return fields.map((field) => ({
    id: `field_${field.id}`,
    header: ({ column }) => <SortableHeader column={column} label={field.name.toUpperCase()} />,
    accessorFn: (row: TRow) => {
      const fv = (row.student_field_values || []).find((v) => v.field_id === field.id)
      if (!fv) return ""
      return getFieldDisplayValue(fv, field.field_type)
    },
    cell: ({ getValue }: CellContext<TRow, string>) => {
      const val = getValue()
      if (!val) return <span className="text-muted-foreground text-xs">—</span>
      if (field.field_type === "boolean") {
        return (
          <Badge variant="outline" className={`text-[11px] ${val === "Yes" ? "text-emerald-600 border-emerald-500/20" : "text-muted-foreground"}`}>
            {val}
          </Badge>
        )
      }
      return <span className="text-sm">{val}</span>
    },
    enableSorting: true,
  }))
}

export function actionsColumn<TRow extends StudentWithLevelRating>(
  onEdit: (s: TRow) => void,
  onDelete: (s: TRow) => void,
  onArchive?: (s: TRow) => void,
): ColumnDef<TRow> {
  return {
    id: "actions",
    enableHiding: false,
    enableSorting: false,
    size: 50,
    cell: ({ row }) => {
      const student = row.original
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-7 w-7 p-0 text-muted-foreground"
              onClick={(e) => e.stopPropagation()}
            >
              <IconDotsVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuLabel className="text-xs">Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                onEdit(student)
              }}
            >
              <IconEdit className="size-3.5 mr-2" />
              Edit
            </DropdownMenuItem>
            {onArchive && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  onArchive(student)
                }}
              >
                {student.is_archived ? (
                  <IconArchiveOff className="size-3.5 mr-2" />
                ) : (
                  <IconArchive className="size-3.5 mr-2" />
                )}
                {student.is_archived ? "Unarchive" : "Archive"}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onSelect={(e) => {
                e.preventDefault()
                onDelete(student)
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <IconTrash className="size-3.5 mr-2 text-destructive" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  }
}

export function buildFullColumns<TRow extends StudentWithLevelRating>(
  fields: StudentField[],
  onEdit: (s: TRow) => void,
  onDelete: (s: TRow) => void,
  onArchive?: (s: TRow) => void,
): ColumnDef<TRow>[] {
  return [
    selectColumn<TRow>(),
    nameColumn<TRow>(),
    statusColumn<TRow>(),
    levelColumn<TRow>(),
    groupColumn<TRow>(),
    schedulesColumn<TRow>(),
    ...fieldColumns<TRow>(fields),
    joinedColumn<TRow>(),
    actionsColumn(onEdit, onDelete, onArchive),
  ]
}

export function buildCompactColumns<TRow extends StudentWithLevelRating>(
  fields: StudentField[],
  selectable?: boolean,
  extraActionsColumn?: ColumnDef<TRow>,
): ColumnDef<TRow>[] {
  const requiredFields = fields.filter((f) => f.is_required)
  const cols: ColumnDef<TRow>[] = [
    nameColumn<TRow>(),
    ...fieldColumns<TRow>(requiredFields),
  ]
  if (selectable) cols.unshift(selectColumn<TRow>())
  if (extraActionsColumn) cols.push(extraActionsColumn)
  return cols
}
