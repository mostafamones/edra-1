"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ColorSelector } from "@/components/ui/color-selector"
import { swatchClassForColorId } from "@/components/helpers/academy-utils"
import { cn } from "@/lib/utils"
import {
  IconCheck,
  IconChevronRight,
  IconDotsVertical,
  IconEdit,
  IconPlus,
  IconTrash,
  IconX,
} from "@tabler/icons-react"
import { useStructureEditorContext } from "./context"
import type {
  StructureId,
  StructureLevel,
  EditLevelState,
  EditLevelHandlers,
  DeleteHandlers,
  StructureDisabledPredicates,
} from "./types"
import { CardHeader } from "@/components/ui/card"

// ═══════════════════════════════════════════════════════════════════════════
// LevelHeader — top row of a level (display or edit mode + action buttons)
// ═══════════════════════════════════════════════════════════════════════════

interface LevelHeaderProps<TId extends StructureId> {
  level: StructureLevel<TId>
  isExpanded: boolean
  onToggleExpand: () => void
  onStartAddGroup: () => void

  editState: EditLevelState<TId>
  editHandlers: EditLevelHandlers<TId>
  deleteHandlers: Pick<DeleteHandlers<TId>, "onDeleteLevel" | "onRequestDeleteLevel">
  predicates: Pick<StructureDisabledPredicates<TId>, "isLevelUpdateDisabled">
}

export function LevelHeader<TId extends StructureId>({
  level,
  isExpanded,
  onToggleExpand,
  onStartAddGroup,
  editState,
  editHandlers,
  deleteHandlers,
  predicates,
}: LevelHeaderProps<TId>) {
  const { disabled, alwaysExpanded } = useStructureEditorContext()
  const isEditing = editState.levelId === level.id

  const requestDelete = () => {
    const proceed = () => deleteHandlers.onDeleteLevel(level.id)
    if (deleteHandlers.onRequestDeleteLevel) {
      deleteHandlers.onRequestDeleteLevel(level.id, proceed)
    } else {
      proceed()
    }
  }

  return (
    <CardHeader className="flex items-center gap-3 h-15 px-3 group hover:bg-muted/10">
      {!alwaysExpanded && (
        <ExpandToggle isExpanded={isExpanded} onClick={onToggleExpand} />
      )}

      {isEditing ? (
        <LevelEditForm
          value={editState.name}
          color={editState.color}
          onValueChange={editHandlers.onNameChange}
          onColorChange={editHandlers.onColorChange}
          onConfirm={() => editHandlers.onConfirm(level.id)}
          onCancel={editHandlers.onCancel}
          confirmDisabled={predicates.isLevelUpdateDisabled?.(level)}
        />
      ) : (
        <LevelDisplayInfo
          level={level}
          onClick={!alwaysExpanded ? onToggleExpand : undefined}
        />
      )}

      {!disabled && !isEditing && (
        <LevelActions
          onAddGroup={onStartAddGroup}
          onEdit={() => editHandlers.onStart(level)}
          onDelete={requestDelete}
        />
      )}
    </CardHeader>
  )
}

// ── Expand chevron ───────────────────────────────────────────────────────────

function ExpandToggle({ isExpanded, onClick }: { isExpanded: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 size-8 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all",
        isExpanded && "rotate-90"
      )}
    >
      <IconChevronRight className="size-5" />
    </button>
  )
}

// ── Level display info (name, color dot, group count badge) ──────────────────

interface LevelDisplayInfoProps<TId extends StructureId> {
  level: StructureLevel<TId>
  onClick?: () => void
}

function LevelDisplayInfo<TId extends StructureId>({
  level,
  onClick,
}: LevelDisplayInfoProps<TId>) {
  const { showColorDot, alwaysExpanded } = useStructureEditorContext()

  return (
    <div
      className={cn(
        "flex h-8 min-w-0 flex-1 items-center gap-3",
        !alwaysExpanded && onClick && "cursor-pointer",
        alwaysExpanded && "pl-2.5"
      )}
      onClick={onClick}
    >
      {showColorDot && (
        <span
          className={cn("size-2 shrink-0 rounded-full", swatchClassForColorId(level.color))}
          aria-hidden
        />
      )}
      <p className="min-w-0 truncate text-[15px] font-medium">{level.name}</p>
      {level.groups.length > 0 && <GroupCountBadge level={level} />}
    </div>
  )
}

function GroupCountBadge<TId extends StructureId>({ level }: { level: StructureLevel<TId> }) {
  return (
    <Tooltip>
      <TooltipTrigger
        className="flex shrink-0 items-center"
        onClick={(e) => e.stopPropagation()}
      >
        <Badge variant="secondary" className="text-[11px]">
          {level.groups.length} Group{level.groups.length !== 1 ? "s" : ""}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        <div className="flex flex-col">
          {level.groups.map((group) => (
            <p key={String(group.id)}>{group.name}</p>
          ))}
        </div>
      </TooltipContent>
    </Tooltip>
  )
}

// ── Level edit form ──────────────────────────────────────────────────────────

interface LevelEditFormProps {
  value: string
  color: string
  onValueChange: (v: string) => void
  onColorChange: (v: string) => void
  onConfirm: () => void
  onCancel: () => void
  confirmDisabled?: boolean
}

function LevelEditForm({
  value,
  color,
  onValueChange,
  onColorChange,
  onConfirm,
  onCancel,
  confirmDisabled,
}: LevelEditFormProps) {
  return (
    <div className="flex min-w-0 flex-1 items-center justify-center gap-2">
      <InputGroup className="h-9 min-w-0 flex-1">
        <InputGroupAddon align="inline-start" onClick={(e) => e.stopPropagation()}>
          <ColorSelector value={color} onChange={onColorChange} align="start" compact />
        </InputGroupAddon>
        <InputGroupInput
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          className="h-9 min-w-0 text-sm font-medium"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") onConfirm()
            if (e.key === "Escape") onCancel()
          }}
        />
      </InputGroup>
      <div className="flex gap-0.5">
        <Button
          size="sm"
          className="size-9 shrink-0 gap-1"
          onClick={onConfirm}
          disabled={confirmDisabled}
        >
          <IconCheck className="size-4" />
        </Button>
        <Button variant="ghost" size="sm" className="size-9 shrink-0 p-0" onClick={onCancel}>
          <IconX className="size-4" />
        </Button>
      </div>
    </div>
  )
}

// ── Level actions (add group / edit / delete) ────────────────────────────────

interface LevelActionsProps {
  onAddGroup: () => void
  onEdit: () => void
  onDelete: () => void
}

function LevelActions({ onAddGroup, onEdit, onDelete }: LevelActionsProps) {
  const { kebabMenu } = useStructureEditorContext()

  return (
    <div className="flex shrink-0 items-center gap-0">
      <Button
        variant="ghost"
        size="sm"
        className="size-9 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
        onClick={onAddGroup}
        title="Add group"
      >
        <IconPlus className="size-4" />
      </Button>

      {kebabMenu ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="size-9 p-0 text-muted-foreground hover:text-foreground"
              title="More actions"
            >
              <IconDotsVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right">
            <DropdownMenuItem onClick={onEdit}>
              <IconEdit className="size-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete} className="text-destructive">
              <IconTrash className="size-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <>
          <Button
            variant="ghost"
            size="sm"
            className="size-9 p-0 text-muted-foreground hover:text-foreground"
            onClick={onEdit}
            title="Edit level"
          >
            <IconEdit className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="size-9 p-0 text-muted-foreground hover:text-destructive"
            onClick={onDelete}
            title="Delete level"
          >
            <IconTrash className="size-4" />
          </Button>
        </>
      )}
    </div>
  )
}
