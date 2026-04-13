"use client"

import { useRef, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  IconBlocks,
  IconCheck,
  IconChevronRight,
  IconDotsVertical,
  IconEdit,
  IconGripVertical,
  IconPlus,
  IconTrash,
  IconUsers,
  IconX,
} from "@tabler/icons-react"
import { ColorSelector } from "@/components/ui/color-selector"
import { DEFAULT_LEVEL_COLOR_ID } from "@/lib/constants"
import { borderClassForColorId, swatchClassForColorId } from "@/components/helpers/academy-utils"
import { cn } from "@/lib/utils"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

type StructureId = string | number

export interface StructureGroup<TId extends StructureId> {
  id: TId
  name: string
}

export interface StructureLevel<TId extends StructureId> {
  id: TId
  name: string
  color?: string | null
  groups: StructureGroup<TId>[]
}

interface StructureEditorRowsProps<TId extends StructureId> {
  levels: StructureLevel<TId>[]
  expandedLevels: Set<TId>
  showAddLevel: boolean
  addingLevelName: string
  addingLevelColor: string
  editingLevelId: TId | null
  editingLevelName: string
  editingLevelColor: string
  editingGroupId: TId | null
  editingGroupName: string
  addingGroupToLevel: TId | null
  addingGroupName: string
  disabled?: boolean
  canShowAddLevelCta?: boolean
  disableAddLevelSubmit?: boolean
  /**
   * When true the built-in StructureAddLevelSection at the top of the list is
   * NOT rendered. Use this when you want to place the add-level trigger (button
   * or inline form) somewhere else in the layout — e.g. in the card header.
   * You are then responsible for rendering either <StructureAddLevelButton> or
   * <StructureAddLevelSection> yourself.
   */
  hideAddLevelSection?: boolean
  /**
   * When true, all levels are always expanded and the collapse/expand chevron
   * is hidden. Useful in contexts where the hierarchy should always be visible.
   */
  alwaysExpanded?: boolean
  showColorDot?: boolean
  kebabMenu?: boolean
  isLevelDeleteDisabled?: (levelId: TId) => boolean
  isLevelUpdateDisabled?: (level: StructureLevel<TId>) => boolean
  isGroupUpdateDisabled?: (group: StructureGroup<TId>) => boolean
  isGroupDeleteDisabled?: (groupId: TId) => boolean
  isGroupAddDisabled?: (levelId: TId) => boolean
  /**
   * Called when the user finishes a drag-and-drop reorder.
   * Receives the new ordered array of level IDs.
   * When provided, a grip handle is shown on each row.
   */
  onReorderLevels?: (orderedIds: TId[]) => void
  onOpenAddLevel: () => void
  onCloseAddLevel: () => void
  onAddLevel: () => void
  onAddingLevelNameChange: (value: string) => void
  onAddingLevelColorChange: (value: string) => void
  onToggleLevel: (levelId: TId) => void
  onStartAddGroup: (levelId: TId) => void
  onCancelAddGroup: () => void
  onAddingGroupNameChange: (value: string) => void
  onAddGroup: (levelId: TId) => void
  onStartEditLevel: (level: StructureLevel<TId>) => void
  onCancelEditLevel: () => void
  onEditingLevelNameChange: (value: string) => void
  onEditingLevelColorChange: (value: string) => void
  onUpdateLevel: (levelId: TId) => void
  onDeleteLevel: (levelId: TId) => void
  onRequestDeleteLevel?: (levelId: TId, proceed: () => void) => void
  onStartEditGroup: (group: StructureGroup<TId>) => void
  onCancelEditGroup: () => void
  onEditingGroupNameChange: (value: string) => void
  onUpdateGroup: (levelId: TId, groupId: TId) => void
  onDeleteGroup: (levelId: TId, groupId: TId) => void
  onRequestDeleteGroup?: (levelId: TId, groupId: TId, proceed: () => void) => void
}

// ---------------------------------------------------------------------------
// StructureAddLevelButton — compact trigger for toolbar / header placement.
// Shows an icon-only button that opens the inline add-level form, or renders
// the inline form itself when showAddLevel is true.
// ---------------------------------------------------------------------------

interface StructureAddLevelButtonProps {
  showAddLevel: boolean
  addingLevelName: string
  addingLevelColor: string
  disableAddLevelSubmit?: boolean
  disabled?: boolean
  onAddingLevelNameChange: (value: string) => void
  onAddingLevelColorChange: (value: string) => void
  onOpenAddLevel: () => void
  onCloseAddLevel: () => void
  onAddLevel: () => void
}

export function StructureAddLevelButton({
  showAddLevel,
  addingLevelName,
  addingLevelColor,
  disableAddLevelSubmit = false,
  disabled = false,
  onAddingLevelNameChange,
  onAddingLevelColorChange,
  onOpenAddLevel,
  onCloseAddLevel,
  onAddLevel,
}: StructureAddLevelButtonProps) {
  if (showAddLevel) {
    // When the form is open, render the full inline form (same as StructureAddLevelSection)
    return (
      <StructureAddLevelSection
        showAddLevel
        canShowAddLevelCta={false}
        addingLevelName={addingLevelName}
        addingLevelColor={addingLevelColor}
        disableAddLevelSubmit={disableAddLevelSubmit}
        onAddingLevelNameChange={onAddingLevelNameChange}
        onAddingLevelColorChange={onAddingLevelColorChange}
        onOpenAddLevel={onOpenAddLevel}
        onCloseAddLevel={onCloseAddLevel}
        onAddLevel={onAddLevel}
      />
    )
  }

  return (
    <Button
      variant="outline"
      className="gap-1 h-8 px-3 text-sm"
      onClick={onOpenAddLevel}
      disabled={disabled}
    >
      <IconPlus className="size-3.5" />
      Add Level
    </Button>
  )
}

interface StructureAddLevelSectionProps {
  showAddLevel: boolean
  canShowAddLevelCta: boolean
  addingLevelName: string
  addingLevelColor: string
  disableAddLevelSubmit: boolean
  onAddingLevelNameChange: (value: string) => void
  onAddingLevelColorChange: (value: string) => void
  onOpenAddLevel: () => void
  onCloseAddLevel: () => void
  onAddLevel: () => void
}

export function StructureAddLevelSection({
  showAddLevel,
  canShowAddLevelCta,
  addingLevelName,
  addingLevelColor,
  disableAddLevelSubmit,
  onAddingLevelNameChange,
  onAddingLevelColorChange,
  onOpenAddLevel,
  onCloseAddLevel,
  onAddLevel,
}: StructureAddLevelSectionProps) {
  if (showAddLevel) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 h-15 px-3">
        <ColorSelector value={addingLevelColor} onChange={onAddingLevelColorChange} />
        <Input
          value={addingLevelName}
          onChange={(e) => onAddingLevelNameChange(e.target.value)}
          placeholder="Enter level name..."
          className="h-9 flex-1 items-center"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") onAddLevel()
            if (e.key === "Escape") onCloseAddLevel()
          }}
        />
        <div className="flex gap-0.5">
          <Button size="icon-lg" onClick={onAddLevel} disabled={disableAddLevelSubmit}>
            <IconCheck className="size-4" />
          </Button>
          <Button variant="ghost" size="icon-lg" onClick={onCloseAddLevel}>
            <IconX className="size-4" />
          </Button>
        </div>
      </div>
    )
  }

  if (!canShowAddLevelCta) return null
  return (
    <div className="flex items-center justify-center h-15">
      <Button variant="outline" onClick={onOpenAddLevel} className="gap-1.5 h-10 w-full">
        <IconPlus className="size-5" />
        Add Level
      </Button>
    </div>
  )
}

interface StructureEmptyStateProps {
  levelsCount: number
  showAddLevel: boolean
  canShowAddLevelCta: boolean
  onOpenAddLevel: () => void
}

export function StructureEmptyState({
  levelsCount,
  showAddLevel,
  canShowAddLevelCta,
  onOpenAddLevel,
}: StructureEmptyStateProps) {
  if (levelsCount > 0 || showAddLevel) return null
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-muted-foreground">
      <IconBlocks className="size-10 opacity-40" />
      <p className="text-sm">No levels defined yet.</p>
      {canShowAddLevelCta && (
        <Button variant="outline" size="sm" onClick={onOpenAddLevel}>
          <IconPlus className="size-4 mr-1" />
          Create your first level
        </Button>
      )}
    </div>
  )
}

export function StructureEditorRows<TId extends StructureId>({
  levels,
  expandedLevels,
  showAddLevel,
  addingLevelName,
  addingLevelColor,
  editingLevelId,
  editingLevelName,
  editingLevelColor,
  editingGroupId,
  editingGroupName,
  addingGroupToLevel,
  addingGroupName,
  disabled = false,
  canShowAddLevelCta = true,
  disableAddLevelSubmit = false,
  hideAddLevelSection = false,
  alwaysExpanded = false,
  showColorDot = false,
  kebabMenu = false,
  isLevelDeleteDisabled,
  isLevelUpdateDisabled,
  isGroupUpdateDisabled,
  isGroupDeleteDisabled,
  isGroupAddDisabled,
  onReorderLevels,
  onOpenAddLevel,
  onCloseAddLevel,
  onAddLevel,
  onAddingLevelNameChange,
  onAddingLevelColorChange,
  onToggleLevel,
  onStartAddGroup,
  onCancelAddGroup,
  onAddingGroupNameChange,
  onAddGroup,
  onStartEditLevel,
  onCancelEditLevel,
  onEditingLevelNameChange,
  onEditingLevelColorChange,
  onUpdateLevel,
  onDeleteLevel,
  onRequestDeleteLevel,
  onStartEditGroup,
  onCancelEditGroup,
  onEditingGroupNameChange,
  onUpdateGroup,
  onDeleteGroup,
  onRequestDeleteGroup,
}: StructureEditorRowsProps<TId>) {
  // ── Drag-and-drop state ──────────────────────────────────────────────────
  const [draggingId, setDraggingId] = useState<TId | null>(null)
  const [dragOverId, setDragOverId] = useState<TId | null>(null)
  const dragSrcIndex = useRef<number>(-1)

  const canDrag = !!onReorderLevels && !disabled

  function handleDragStart(e: React.DragEvent, level: StructureLevel<TId>, index: number) {
    setDraggingId(level.id)
    dragSrcIndex.current = index
    e.dataTransfer.effectAllowed = "move"
    // Transparent ghost is fine; browser uses the element itself
    e.dataTransfer.setData("text/plain", String(level.id))
  }

  function handleDragOver(e: React.DragEvent, level: StructureLevel<TId>) {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    if (level.id !== draggingId) {
      setDragOverId(level.id)
    }
  }

  function handleDrop(e: React.DragEvent, targetLevel: StructureLevel<TId>) {
    e.preventDefault()
    if (!draggingId || draggingId === targetLevel.id) {
      setDraggingId(null)
      setDragOverId(null)
      return
    }

    const srcIdx = levels.findIndex((l) => l.id === draggingId)
    const dstIdx = levels.findIndex((l) => l.id === targetLevel.id)
    if (srcIdx === -1 || dstIdx === -1) return

    const next = [...levels]
    const [moved] = next.splice(srcIdx, 1)
    next.splice(dstIdx, 0, moved)

    onReorderLevels?.(next.map((l) => l.id))
    setDraggingId(null)
    setDragOverId(null)
  }

  function handleDragEnd() {
    setDraggingId(null)
    setDragOverId(null)
  }

  return (
    <div className="flex flex-col gap-3">
      {!hideAddLevelSection && (
        <StructureAddLevelSection
          showAddLevel={showAddLevel}
          canShowAddLevelCta={canShowAddLevelCta}
          addingLevelName={addingLevelName}
          addingLevelColor={addingLevelColor}
          disableAddLevelSubmit={disableAddLevelSubmit}
          onAddingLevelNameChange={onAddingLevelNameChange}
          onAddingLevelColorChange={onAddingLevelColorChange}
          onOpenAddLevel={onOpenAddLevel}
          onCloseAddLevel={onCloseAddLevel}
          onAddLevel={onAddLevel}
        />
      )}

      {levels.map((level, index) => {
        const isExpanded = alwaysExpanded || expandedLevels.has(level.id)
        const isEditingThis = editingLevelId === level.id
        const isAddingGroup = addingGroupToLevel === level.id
        const isDragging = draggingId === level.id
        const isDragOver = dragOverId === level.id

        return (
          <div
            key={String(level.id)}
            draggable={canDrag}
            onDragStart={canDrag ? (e) => handleDragStart(e, level, index) : undefined}
            onDragOver={canDrag ? (e) => handleDragOver(e, level) : undefined}
            onDrop={canDrag ? (e) => handleDrop(e, level) : undefined}
            onDragEnd={canDrag ? handleDragEnd : undefined}
            className={cn(
              `rounded-lg border-l-2 ${borderClassForColorId(level.color)} bg-input/10 overflow-hidden shadow-lg transition-all`,
              isDragging && "opacity-40 scale-[0.98]",
              isDragOver && !isDragging && "ring-2 ring-primary/50 ring-offset-1"
            )}
          >
            <div className="flex items-center gap-3 h-15 px-3 group hover:bg-muted/10">
              {/* Drag handle */}
              {/* {canDrag && (
                <div
                  className="shrink-0 cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground transition-colors touch-none"
                  title="Drag to reorder"
                >
                  <IconGripVertical className="size-4" />
                </div>
              )} */}

              {!alwaysExpanded && (
                <button
                  type="button"
                  onClick={() => {
                    onToggleLevel(level.id)
                    if (editingGroupId) onCancelEditGroup()
                    if (addingGroupToLevel) onCancelAddGroup()
                  }}
                  className={`shrink-0 size-8 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors ${isExpanded ? "rotate-90" : ""} transition-transform`}
                >
                  <IconChevronRight className="size-5" />
                </button>
              )}

              {isEditingThis ? (
                <div className="flex min-w-0 flex-1 items-center justify-center gap-2">
                  <InputGroup className="h-9 min-w-0 flex-1">
                    <InputGroupAddon align="inline-start" onClick={(e) => e.stopPropagation()}>
                      <ColorSelector
                        value={editingLevelColor}
                        onChange={onEditingLevelColorChange}
                        align="start"
                        compact
                      />
                    </InputGroupAddon>
                    <InputGroupInput
                      value={editingLevelName}
                      onChange={(e) => onEditingLevelNameChange(e.target.value)}
                      className="h-9 min-w-0 text-sm font-medium"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") onUpdateLevel(level.id)
                        if (e.key === "Escape") onCancelEditLevel()
                      }}
                    />
                  </InputGroup>
                  <div className="flex gap-0.5">
                    <Button
                      size="sm"
                      className="size-9 shrink-0 gap-1"
                      onClick={() => onUpdateLevel(level.id)}
                      disabled={isLevelUpdateDisabled?.(level)}
                    >
                      <IconCheck className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="size-9 shrink-0 p-0"
                      onClick={onCancelEditLevel}
                    >
                      <IconX className="size-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  className={cn(
                    "flex h-8 min-w-0 flex-1 items-center gap-3",
                    !alwaysExpanded && "cursor-pointer",
                    alwaysExpanded && "pl-2.5"
                  )}
                  onClick={!alwaysExpanded ? () => {
                    onToggleLevel(level.id)
                    if (editingGroupId) onCancelEditGroup()
                    if (addingGroupToLevel) onCancelAddGroup()
                  } : undefined}
                >
                  {showColorDot && (
                    <span
                      className={cn("size-2 shrink-0 rounded-full", swatchClassForColorId(level.color))}
                      aria-hidden
                    />
                  )}
                  <p className="min-w-0 truncate text-[15px] font-medium">{level.name}</p>
                  {level.groups.length > 0 && (
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
                  )}
                </div>
              )}

              {!disabled && !isEditingThis && (
                <div className="flex shrink-0 items-center gap-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="size-9 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                    onClick={() => onStartAddGroup(level.id)}
                    title="Add group"
                  >
                    <IconPlus className="size-4" />
                  </Button>
                  {kebabMenu ? (<DropdownMenu>
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
                      <DropdownMenuItem onClick={() => onStartEditLevel(level)}>
                        <IconEdit className="size-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        const proceed = () => onDeleteLevel(level.id)
                        if (onRequestDeleteLevel) {
                          onRequestDeleteLevel(level.id, proceed)
                        } else {
                          proceed()
                        }
                      }} className="text-destructive">
                        <IconTrash className="size-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>) : (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="size-9 p-0 text-muted-foreground hover:text-foreground"
                        onClick={() => onStartEditLevel(level)}
                        title="Edit level"
                      >
                        <IconEdit className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="size-9 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => {
                          const proceed = () => onDeleteLevel(level.id)
                          if (onRequestDeleteLevel) {
                            onRequestDeleteLevel(level.id, proceed)
                          } else {
                            proceed()
                          }
                        }}
                        title="Delete level"
                      >
                        <IconTrash className="size-4" />
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>

            {isExpanded && (
              <div className="border-t border-input/50 bg-muted/10">
                {level.groups.length === 0 && !isAddingGroup && (
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
                        onClick={() => onStartAddGroup(level.id)}
                      >
                        Add one
                      </Button>
                    )}
                  </div>
                )}

                {level.groups.map((group) => {
                  const isEditingGroup = editingGroupId === group.id
                  return (
                    <div
                      key={String(group.id)}
                      className="flex items-center justify-between gap-3 px-3 pl-6 h-15 border-t border-input/30 bg-background/25 first:border-t-0 transition-colors"
                    >
                      <div className="size-9 flex items-center justify-center">
                        <IconUsers className="size-4 text-muted-foreground" />
                      </div>
                      {isEditingGroup ? (
                        <div className="flex items-center gap-1 w-full min-w-0">
                          <Input
                            value={editingGroupName}
                            onChange={(e) => onEditingGroupNameChange(e.target.value)}
                            className="h-9 text-base flex-1"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Enter") onUpdateGroup(level.id, group.id)
                              if (e.key === "Escape") onCancelEditGroup()
                            }}
                          />
                          <div className="flex gap-0">
                            <Button
                              size="sm"
                              className="size-9 p-0 ml-1 text-xs"
                              onClick={() => onUpdateGroup(level.id, group.id)}
                              disabled={isGroupUpdateDisabled?.(group)}
                            >
                              <IconCheck className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="size-9 p-0"
                              onClick={onCancelEditGroup}
                            >
                              <IconX className="size-4" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center h-7 justify-between w-full">
                          <p className="text-sm">{group.name}</p>
                          {!disabled && (
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
                                  <DropdownMenuItem onClick={() => onStartEditGroup(group)}>
                                    <IconEdit className="size-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => {
                                    const proceed = () => onDeleteGroup(level.id, group.id)
                                    if (onRequestDeleteGroup) {
                                      onRequestDeleteGroup(level.id, group.id, proceed)
                                    } else {
                                      proceed()
                                    }
                                  }} disabled={isGroupDeleteDisabled?.(group.id)} className="text-destructive">
                                    <IconTrash className="size-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}

                {isAddingGroup && !disabled && (
                  <div className="flex items-center gap-2 px-3 pl-6 h-15 border-t border-primary/20 bg-primary/5">
                    <div className="size-9 w-8 flex items-center justify-center">
                      <IconUsers className="size-4 text-primary" />
                    </div>
                    <Input
                      value={addingGroupName}
                      onChange={(e) => onAddingGroupNameChange(e.target.value)}
                      placeholder="Group name..."
                      className="h-9 text-sm flex-1"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") onAddGroup(level.id)
                        if (e.key === "Escape") onCancelAddGroup()
                      }}
                    />
                    <div className="flex gap-0.5">
                      <Button
                        size="sm"
                        className="size-9 gap-1 text-xs"
                        onClick={() => onAddGroup(level.id)}
                        disabled={isGroupAddDisabled?.(level.id)}
                      >
                        <IconCheck className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="size-9 p-0"
                        onClick={onCancelAddGroup}
                      >
                        <IconX className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}

      <StructureEmptyState
        levelsCount={levels.length}
        showAddLevel={showAddLevel}
        canShowAddLevelCta={canShowAddLevelCta}
        onOpenAddLevel={onOpenAddLevel}
      />
    </div>
  )
}

export { DEFAULT_LEVEL_COLOR_ID }
