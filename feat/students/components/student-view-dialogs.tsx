"use client"

import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import type { StudentWithLevelRating } from "@/lib/types"

interface StudentViewDialogsProps {
  archiveTarget: StudentWithLevelRating | null
  bulkAction: "delete" | "archive" | null
  deleteTarget: StudentWithLevelRating | null
  isActioning: boolean
  onArchiveConfirm: () => void | Promise<void>
  onArchiveOpenChange: (open: boolean) => void
  onBulkConfirm: () => void | Promise<void>
  onBulkOpenChange: (open: boolean) => void
  onDeleteConfirm: () => void | Promise<void>
  onDeleteOpenChange: (open: boolean) => void
}

export function StudentViewDialogs({
  archiveTarget,
  bulkAction,
  deleteTarget,
  isActioning,
  onArchiveConfirm,
  onArchiveOpenChange,
  onBulkConfirm,
  onBulkOpenChange,
  onDeleteConfirm,
  onDeleteOpenChange,
}: StudentViewDialogsProps) {
  return (
    <>
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={onDeleteOpenChange}
        variant="delete"
        entity="student"
        targetIdentifier={deleteTarget?.full_name}
        onConfirm={onDeleteConfirm}
        onCancel={() => onDeleteOpenChange(false)}
        loading={isActioning}
      />

      <ConfirmDialog
        open={!!archiveTarget}
        onOpenChange={onArchiveOpenChange}
        variant="archive"
        title={`${archiveTarget?.is_archived ? "Unarchive" : "Archive"} Student`}
        description={
          archiveTarget?.is_archived
            ? "This student will be unarchived and will appear in the main list."
            : "This student will be archived and hidden from the main list. You can unarchive them later."
        }
        confirmLabel={archiveTarget?.is_archived ? "Unarchive" : "Archive"}
        onConfirm={onArchiveConfirm}
        onCancel={() => onArchiveOpenChange(false)}
        loading={isActioning}
      />

      <ConfirmDialog
        open={!!bulkAction}
        onOpenChange={onBulkOpenChange}
        variant={bulkAction === "delete" ? "delete" : "archive"}
        title={`${bulkAction === "delete" ? "Delete" : "Archive"} Students`}
        description={
          bulkAction === "delete"
            ? "This will permanently delete the selected students and all their associated data. This cannot be undone."
            : "The selected students will be archived. You can unarchive them later."
        }
        confirmLabel={bulkAction === "delete" ? "Delete" : "Archive"}
        onConfirm={onBulkConfirm}
        loading={isActioning}
      />
    </>
  )
}
