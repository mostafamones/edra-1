"use client"

import type { ColumnDef } from "@tanstack/react-table"

import { Badge } from "@/components/ui/badge"
import type { StudentWithLevelRating } from "@/lib/types"

import { STATUS_COLORS } from "../../../utils/table-helpers"
import { SortableHeader } from "./sortable-header"

export function nameColumn<TRow extends StudentWithLevelRating>(): ColumnDef<TRow> {
  return {
    accessorKey: "full_name",
    header: ({ column }) => <SortableHeader column={column} label="NAME" />,
    cell: ({ row }) => <p className="truncate text-sm font-medium">{row.original.full_name}</p>,
    enableHiding: false,
  }
}

export function statusColumn<TRow extends StudentWithLevelRating>(): ColumnDef<TRow> {
  return {
    accessorKey: "status",
    header: ({ column }) => <SortableHeader column={column} label="STATUS" />,
    cell: ({ row }) => {
      const student = row.original
      const status = student.is_archived ? "archived" : (student.status || "inactive")
      const badgeClass = student.is_archived
        ? "border-border bg-muted text-muted-foreground"
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
        <Badge variant="outline" className="text-xs font-normal">
          {name}
        </Badge>
      ) : (
        <span className="text-xs text-muted-foreground">—</span>
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
        <span className="text-xs text-muted-foreground">—</span>
      )
    },
  }
}

export function joinedColumn<TRow extends StudentWithLevelRating>(): ColumnDef<TRow> {
  return {
    accessorKey: "created_at",
    header: ({ column }) => <SortableHeader column={column} label="Joined" />,
    cell: ({ row }) => {
      const date = row.getValue("created_at") as string | null
      if (!date) return <span className="text-xs text-muted-foreground">—</span>

      return (
        <span className="tabular-nums text-xs text-muted-foreground">
          {new Date(date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </span>
      )
    },
  }
}

