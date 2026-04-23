"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  IconCheck,
  IconDotsVertical,
  IconEdit,
  IconTrash,
  IconUsers,
  IconX,
} from "@tabler/icons-react"
import { useStructureEditorContext } from "./context"
import type {
  StructureId,
  StructureGroup,
  EditGroupState,
  EditGroupHandlers,
  DeleteHandlers,
  StructureDisabledPredicates,
} from "./types"

// ═══════════════════════════════════════════════════════════════════════════
// GroupRow — single group row (display or edit)
// ═══════════════════════════════════════════════════════════════════════════

interface GroupRowProps<TId extends StructureId> {
  levelId: TId
  group: StructureGroup<TId>
  editState: EditGroupState<TId>
  editHandlers: EditGroupHandlers<TId>
  deleteHandlers: Pick<DeleteHandlers<TId>, "onDeleteGroup" | "onRequestDeleteGroup">
  predicates: Pick<StructureDisabledPredicates<TId>, "isGroupUpdateDisabled" | "isGroupDeleteDisabled">
}

export function GroupRow<TId extends StructureId>({
  levelId,
  group,
  editState,
  editHandlers,
  deleteHandlers,
  predicates,
}: GroupRowProps<TId>) {
  const { disabled } = useStructureEditorContext()
  const isEditing = editState.groupId === group.id

  const requestDelete = () => {
    const proceed = () => deleteHandlers.onDeleteGroup(levelId, group.id)
    if (deleteHandlers.onRequestDeleteGroup) {
      deleteHandlers.onRequestDeleteGroup(levelId, group.id, proceed)
    } else {
      proceed()
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 px-3 pl-6 h-15 border-t border-input/30 bg-background/25 first:border-t-0 transition-colors">
      <div className="size-9 flex items-center justify-center">
        <IconUsers className="size-4 text-muted-foreground" />
      </div>

      {isEditing ? (
        <GroupEditForm
          value={editState.name}
          onValueChange={editHandlers.onNameChange}
          onConfirm={() => editHandlers.onConfirm(levelId, group.id)}
          onCancel={editHandlers.onCancel}
          confirmDisabled={predicates.isGroupUpdateDisabled?.(group)}
        />
      ) : (
        <GroupDisplayRow
          name={group.name}
          showActions={!disabled}
          onEdit={() => editHandlers.onStart(group)}
          onDelete={requestDelete}
          deleteDisabled={predicates.isGroupDeleteDisabled?.(group.id)}
        />
      )}
    </div>
  )
}

// ── Edit form ────────────────────────────────────────────────────────────────

interface GroupEditFormProps {
  value: string
  onValueChange: (v: string) => void
  onConfirm: () => void
  onCancel: () => void
  confirmDisabled?: boolean
}

function GroupEditForm({
  value,
  onValueChange,
  onConfirm,
  onCancel,
  confirmDisabled,
}: GroupEditFormProps) {
  return (
    <div className="flex items-center gap-1 w-full min-w-0">
      <Input
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        className="h-9 text-base flex-1"
        autoFocus
        onKeyDown={(e) => {
          if (e.key === "Enter") onConfirm()
          if (e.key === "Escape") onCancel()
        }}
      />
      <div className="flex gap-0">
        <Button
          size="sm"
          className="size-9 p-0 ml-1 text-xs"
          onClick={onConfirm}
          disabled={confirmDisabled}
        >
          <IconCheck className="size-4" />
        </Button>
        <Button variant="ghost" size="sm" className="size-9 p-0" onClick={onCancel}>
          <IconX className="size-4" />
        </Button>
      </div>
    </div>
  )
}

// ── Display row (with kebab menu) ─────────────────────────────────────────────

interface GroupDisplayRowProps {
  name: string
  showActions: boolean
  onEdit: () => void
  onDelete: () => void
  deleteDisabled?: boolean
}

function GroupDisplayRow({
  name,
  showActions,
  onEdit,
  onDelete,
  deleteDisabled,
}: GroupDisplayRowProps) {
  return (
    <div className="flex items-center h-7 justify-between w-full">
      <p className="text-sm">{name}</p>
      {showActions && (
        <div className="flex items-center gap-0 shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="size-9 p-0 ml-1 text-muted-foreground"
              >
                <IconDotsVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={onEdit}>
                <IconEdit className="size-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={onDelete}
                disabled={deleteDisabled}
                className="text-destructive"
              >
                <IconTrash className="size-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// GroupAddForm — inline "new group" form under a level
// ═══════════════════════════════════════════════════════════════════════════

interface GroupAddFormProps<TId extends StructureId> {
  levelId: TId
  value: string
  onValueChange: (v: string) => void
  onConfirm: () => void
  onCancel: () => void
  confirmDisabled?: boolean
}

export function GroupAddForm<TId extends StructureId>({
  value,
  onValueChange,
  onConfirm,
  onCancel,
  confirmDisabled,
}: GroupAddFormProps<TId>) {
  return (
    <div className="flex items-center gap-2 px-3 pl-6 h-15 border-t border-primary/20 bg-primary/5">
      <div className="size-9 w-8 flex items-center justify-center">
        <IconUsers className="size-4 text-primary" />
      </div>
      <Input
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        placeholder="Group name..."
        className="h-9 text-sm flex-1"
        autoFocus
        onKeyDown={(e) => {
          if (e.key === "Enter") onConfirm()
          if (e.key === "Escape") onCancel()
        }}
      />
      <div className="flex gap-0.5">
        <Button
          size="sm"
          className="size-9 gap-1 text-xs"
          onClick={onConfirm}
          disabled={confirmDisabled}
        >
          <IconCheck className="size-3.5" />
        </Button>
        <Button variant="ghost" size="sm" className="size-9 p-0" onClick={onCancel}>
          <IconX className="size-3.5" />
        </Button>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// GroupListEmpty — empty state under a level
// ═══════════════════════════════════════════════════════════════════════════

interface GroupListEmptyProps {
  onStartAdd: () => void
}

export function GroupListEmpty({ onStartAdd }: GroupListEmptyProps) {
  const { disabled } = useStructureEditorContext()
  return (
    <div className="flex items-center justify-center h-15 text-xs text-muted-foreground">
      <div className="flex items-center gap-2">
        <IconUsers className="size-3.5 opacity-50" />
        No groups yet
      </div>
      {!disabled && (
        <Button
          variant="link"
          size="sm"
          className="text-primary hover:underline"
          onClick={onStartAdd}
        >
          Add one
        </Button>
      )}
    </div>
  )
}
