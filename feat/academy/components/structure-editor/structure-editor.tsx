"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { StructureEditorProvider } from "./context"
import { useDragReorder } from "./use-drag-reorder"
import { LevelItem } from "./level-item"
import { StructureAddLevelSection, StructureEmptyState } from "./add-level"
import type {
  StructureId,
  StructureLevel,
  AddLevelState,
  AddLevelHandlers,
  EditLevelState,
  EditLevelHandlers,
  AddGroupState,
  AddGroupHandlers,
  EditGroupState,
  EditGroupHandlers,
  DeleteHandlers,
  StructureDisabledPredicates,
} from "./types"

// ═══════════════════════════════════════════════════════════════════════════
// StructureEditor — top-level component
// ═══════════════════════════════════════════════════════════════════════════

export interface StructureEditorProps<TId extends StructureId> {
  levels: StructureLevel<TId>[]
  expandedLevels: Set<TId>
  onToggleLevel: (levelId: TId) => void

  addLevel: {
    state: AddLevelState
    handlers: AddLevelHandlers
    confirmDisabled?: boolean
  }
  editLevel: {
    state: EditLevelState<TId>
    handlers: EditLevelHandlers<TId>
  }
  addGroup: {
    state: AddGroupState<TId>
    handlers: AddGroupHandlers<TId>
  }
  editGroup: {
    state: EditGroupState<TId>
    handlers: EditGroupHandlers<TId>
  }
  deleteHandlers: DeleteHandlers<TId>
  predicates?: StructureDisabledPredicates<TId>

  // Display flags
  disabled?: boolean
  canShowAddLevelCta?: boolean
  hideAddLevelSection?: boolean
  alwaysExpanded?: boolean
  showColorDot?: boolean
  kebabMenu?: boolean

  // Drag and drop
  onReorderLevels?: (orderedIds: TId[]) => void

  // Style escape hatches
  className?: string
  listClassName?: string
  itemClassName?: string
  addSectionClassName?: string
  emptyStateClassName?: string
}

export function StructureEditor<TId extends StructureId>({
  levels,
  expandedLevels,
  onToggleLevel,
  addLevel,
  editLevel,
  addGroup,
  editGroup,
  deleteHandlers,
  predicates = {},
  disabled = false,
  canShowAddLevelCta = true,
  hideAddLevelSection = false,
  alwaysExpanded = false,
  showColorDot = false,
  kebabMenu = false,
  onReorderLevels,
  className,
  listClassName,
  itemClassName,
  addSectionClassName,
  emptyStateClassName,
}: StructureEditorProps<TId>) {
  const ctx = React.useMemo(
    () => ({ disabled, kebabMenu, showColorDot, alwaysExpanded }),
    [disabled, kebabMenu, showColorDot, alwaysExpanded]
  )

  const drag = useDragReorder({
    levels,
    onReorder: onReorderLevels,
    enabled: !disabled,
  })

  const showEmptyState = levels.length === 0 && !addLevel.state.isOpen

  return (
    <StructureEditorProvider value={ctx}>
      <div className={cn("flex flex-col gap-3", className)}>
        {!hideAddLevelSection && (
          <StructureAddLevelSection
            state={addLevel.state}
            handlers={addLevel.handlers}
            confirmDisabled={addLevel.confirmDisabled}
            canShowCta={canShowAddLevelCta && !disabled}
            className={addSectionClassName}
          />
        )}

        <div className={cn("flex flex-col gap-3", listClassName)}>
          {levels.map((level, index) => {
            const isExpanded = alwaysExpanded || expandedLevels.has(level.id)
            return (
              <LevelItem
                key={String(level.id)}
                level={level}
                isExpanded={isExpanded}
                onToggleExpand={() => onToggleLevel(level.id)}
                editLevel={editLevel}
                addGroup={addGroup}
                editGroup={editGroup}
                deleteHandlers={deleteHandlers}
                predicates={predicates}
                draggable={drag.canDrag}
                isDragging={drag.draggingId === level.id}
                isDragOver={drag.dragOverId === level.id}
                onDragStart={
                  drag.canDrag
                    ? (e) => drag.handleDragStart(e, level, index)
                    : undefined
                }
                onDragOver={drag.canDrag ? (e) => drag.handleDragOver(e, level) : undefined}
                onDrop={drag.canDrag ? (e) => drag.handleDrop(e, level) : undefined}
                onDragEnd={drag.canDrag ? drag.handleDragEnd : undefined}
                className={itemClassName}
              />
            )
          })}

          {showEmptyState && (
            <StructureEmptyState
              showCta={canShowAddLevelCta && !disabled}
              onOpenAddLevel={addLevel.handlers.onOpen}
              className={emptyStateClassName}
            />
          )}
        </div>
      </div>
    </StructureEditorProvider>
  )
}
