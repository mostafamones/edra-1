"use client"

import type { ColumnDef } from "@tanstack/react-table"
import {
  IconArchive,
  IconArchiveOff,
  IconDotsVertical,
  IconEdit,
  IconTrash,
} from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { StudentWithLevelRating } from "@/lib/types"

export function actionsColumn<TRow extends StudentWithLevelRating>(
  onEdit: (student: TRow) => void,
  onDelete: (student: TRow) => void,
  onArchive?: (student: TRow) => void
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
              onClick={(event) => event.stopPropagation()}
            >
              <IconDotsVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuLabel className="text-xs">Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={(event) => {
                event.stopPropagation()
                onEdit(student)
              }}
            >
              <IconEdit className="mr-2 size-3.5" />
              Edit
            </DropdownMenuItem>
            {onArchive && (
              <DropdownMenuItem
                onClick={(event) => {
                  event.stopPropagation()
                  onArchive(student)
                }}
              >
                {student.is_archived ? (
                  <IconArchiveOff className="mr-2 size-3.5" />
                ) : (
                  <IconArchive className="mr-2 size-3.5" />
                )}
                {student.is_archived ? "Unarchive" : "Archive"}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onSelect={(event) => {
                event.preventDefault()
                onDelete(student)
              }}
              onClick={(event) => event.stopPropagation()}
            >
              <IconTrash className="mr-2 size-3.5 text-destructive" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  }
}

