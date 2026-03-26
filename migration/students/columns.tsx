"use client"

import { ColumnDef } from "@tanstack/react-table"
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
import type { StudentWithLevelRating, StudentField } from "@/lib"
import { STATUS_COLORS, getFieldDisplayValue } from "./helpers"
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip"

// ─── Sortable Header ──────────────────────────────────────────

export function SortableHeader({ column, label }: { column: any; label: string }) {
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

/** Select checkbox column — used when table has row selection enabled */
export function selectColumn(): ColumnDef<StudentWithLevelRating> {
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

/** Name column with avatar — always visible */
export function nameColumn(): ColumnDef<StudentWithLevelRating> {
  return {
    accessorKey: "full_name",
    header: ({ column }) => <SortableHeader column={column} label="NAME" />,
    cell: ({ row }) => {
      const student = row.original
      return (
        <p className="font-medium text-sm truncate">{student.full_name}</p>
      )
    },
    enableHiding: false,
  }
}

/** Status badge column */
export function statusColumn(): ColumnDef<StudentWithLevelRating> {
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

/** Level badge column */
export function levelColumn(): ColumnDef<StudentWithLevelRating> {
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

/** Branch column */
export function branchColumn(): ColumnDef<StudentWithLevelRating> {
  return {
    id: "branch",
    header: "BRANCH",
    accessorFn: (row) => row.branch?.name || "",
    cell: ({ row }) => {
      const name = row.original.branch?.name
      return name ? (
        <span className="text-sm">{name}</span>
      ) : (
        <span className="text-muted-foreground text-xs">—</span>
      )
    },
  }
}

/** Schedules column */
export function schedulesColumn(): ColumnDef<StudentWithLevelRating> {
  return {
    id: "schedules",
    header: "SCHEDULES",
    cell: ({ row }) => {
      const schedules = row.original.schedule_enrollments || []
      if (schedules.length === 0) {
        return <span className="text-muted-foreground text-xs">—</span>
      }

      // Sort schedules: mandatory ones at the end (hidden in +1 badge)
      const sortedSchedules = [...schedules].sort((a, b) => {
        const aMandatory = a.schedule?.is_mandatory ? 1 : 0
        const bMandatory = b.schedule?.is_mandatory ? 1 : 0
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

// /** Email column (hidden by default in full view) */
// export function emailColumn(): ColumnDef<StudentWithLevelRating> {
//   return {
//     accessorKey: "email",
//     header: ({ column }) => <SortableHeader column={column} label="Email" />,
//     cell: ({ row }) => {
//       const email = row.getValue("email") as string | null
//       return email ? (
//         <span className="text-sm text-muted-foreground">{email}</span>
//       ) : (
//         <span className="text-muted-foreground text-xs">—</span>
//       )
//     },
//   }
// }

/** Joined / created_at column */
export function joinedColumn(): ColumnDef<StudentWithLevelRating> {
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

// ─── Dynamic field columns ────────────────────────────────────

/** Create columns for academy custom fields */
export function fieldColumns(fields: StudentField[]): ColumnDef<StudentWithLevelRating>[] {
  return fields.map((field) => ({
    id: `field_${field.id}`,
    header: ({ column }) => <SortableHeader column={column} label={field.name.toUpperCase()} />,
    accessorFn: (row: StudentWithLevelRating) => {
      const fv = (row.student_field_values || []).find((v) => v.field_id === field.id)
      if (!fv) return ""
      return getFieldDisplayValue(fv, field.field_type)
    },
    cell: ({ getValue }: any) => {
      const val = getValue() as string
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

// ─── Actions column ───────────────────────────────────────────

/** Row actions dropdown (edit, delete, archive) */
export function actionsColumn(
  onEdit: (s: StudentWithLevelRating) => void,
  onDelete: (s: StudentWithLevelRating) => void,
  onArchive?: (s: StudentWithLevelRating) => void,
): ColumnDef<StudentWithLevelRating> {
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

// ─── Presets ──────────────────────────────────────────────────

/**
 * Full column set for the main students page.
 * Includes select, all core columns, dynamic fields, and actions.
 */
export function buildFullColumns(
  fields: StudentField[],
  onEdit: (s: StudentWithLevelRating) => void,
  onDelete: (s: StudentWithLevelRating) => void,
  onArchive?: (s: StudentWithLevelRating) => void,
): ColumnDef<StudentWithLevelRating>[] {
  return [
    selectColumn(),
    nameColumn(),
    statusColumn(),
    levelColumn(),
    branchColumn(),
    schedulesColumn(),
    ...fieldColumns(fields),
    // emailColumn(),
    joinedColumn(),
    actionsColumn(onEdit, onDelete, onArchive),
  ]
}

/**
 * Compact column set for embedding in other pages (e.g., schedule detail).
 * Name + required custom fields only. Optionally include select column. No actions.
 */
export function buildCompactColumns(
  fields: StudentField[],
  selectable?: boolean,
  actionsColumn?: ColumnDef<StudentWithLevelRating>,
): ColumnDef<StudentWithLevelRating>[] {
  const requiredFields = fields.filter((f) => f.is_required)
  const cols: ColumnDef<StudentWithLevelRating>[] = [
    nameColumn(),
    ...fieldColumns(requiredFields),
  ]
  if (selectable) {
    cols.unshift(selectColumn())
  }
  if (actionsColumn) {
    cols.push(actionsColumn)
  }
  return cols
}
