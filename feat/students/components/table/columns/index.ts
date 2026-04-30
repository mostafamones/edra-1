"use client"

import type { ColumnDef } from "@tanstack/react-table"

import type { StudentField, StudentWithLevelRating } from "@/lib/types"

import { actionsColumn } from "./actions-column"
import { fieldColumns, schedulesColumn } from "./field-columns"
import { groupColumn, joinedColumn, levelColumn, nameColumn, statusColumn } from "./core-columns"
import { selectColumn } from "./select-column"
export { SortableHeader } from "./sortable-header"

export function buildStudentTableColumns<TRow extends StudentWithLevelRating>(
  fields: StudentField[],
  onEdit: (student: TRow) => void,
  onDelete: (student: TRow) => void,
  onArchive?: (student: TRow) => void
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

export function buildCompactStudentTableColumns<TRow extends StudentWithLevelRating>(
  fields: StudentField[],
  selectable?: boolean,
  extraActionsColumn?: ColumnDef<TRow>
): ColumnDef<TRow>[] {
  const requiredFields = fields.filter((field) => field.is_required)
  const columns: ColumnDef<TRow>[] = [nameColumn<TRow>(), ...fieldColumns<TRow>(requiredFields)]

  if (selectable) columns.unshift(selectColumn<TRow>())
  if (extraActionsColumn) columns.push(extraActionsColumn)

  return columns
}

