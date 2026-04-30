"use client"

import type { Column } from "@tanstack/react-table"
import {
  IconArrowDown,
  IconArrowUp,
  IconSelector,
} from "@tabler/icons-react"

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
      className="flex items-center gap-1 rounded px-1 -ml-1 transition-colors hover:text-foreground"
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

