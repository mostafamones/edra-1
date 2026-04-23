"use client"

import { borderClassForColorId } from "@/components/helpers/academy-utils"
import { cn } from "@/lib/utils"
import { LevelHeader } from "./level-header"
import { GroupRow, GroupAddForm, GroupListEmpty } from "./group-row"
import { useStructureEditorContext } from "./context"
import type {
  StructureId,
  StructureLevel,
  EditLevelState,
  EditLevelHandlers,
  AddGroupState,
  AddGroupHandlers,
  EditGroupState,
  EditGroupHandlers,
  DeleteHandlers,
  StructureDisabledPredicates,
} from "./types"
import { Card } from "@/components/ui/card"

// ═══════════════════════════════════════════════════════════════════════════
// LevelItem — composes a LevelHeader + expanded groups body
// ═══════════════════════════════════════════════════════════════════════════

interface LevelItemProps<TId extends StructureId> {
  level: StructureLevel<TId>
  isExpanded: boolean
  onToggleExpand: () => void

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
  predicates: StructureDisabledPredicates<TId>

  // Drag-and-drop props
  draggable?: boolean
  isDragging?: boolean
  isDragOver?: boolean
  onDragStart?: (e: React.DragEvent) => void
  onDragOver?: (e: React.DragEvent) => void
  onDrop?: (e: React.DragEvent) => void
  onDragEnd?: (e: React.DragEvent) => void

  className?: string
}

export function LevelItem<TId extends StructureId>({
  level,
  isExpanded,
  onToggleExpand,
  editLevel,
  addGroup,
  editGroup,
  deleteHandlers,
  predicates,
  draggable,
  isDragging,
  isDragOver,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  className,
}: LevelItemProps<TId>) {
  const { disabled } = useStructureEditorContext()
  const isAddingGroupHere = addGroup.state.levelId === level.id

  const handleToggleWithCleanup = () => {
    onToggleExpand()
    if (editGroup.state.groupId) editGroup.handlers.onCancel()
    if (addGroup.state.levelId) addGroup.handlers.onCancel()
  }

  return (
    <Card
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={cn(
        "py-1 border-l-2 gap-0 p-0 shadow-sm",
        borderClassForColorId(level.color),
        isDragging && "opacity-40 scale-[0.98]",
        isDragOver && !isDragging && "ring-1 ring-primary/20 ring-offset-1",
        className
      )}
    >
      <LevelHeader
        level={level}
        isExpanded={isExpanded}
        onToggleExpand={handleToggleWithCleanup}
        onStartAddGroup={() => addGroup.handlers.onStart(level.id)}
        editState={editLevel.state}
        editHandlers={editLevel.handlers}
        deleteHandlers={deleteHandlers}
        predicates={predicates}
      />

      {isExpanded && (
        <div className="border-t border-input/50 bg-muted/10">
          {level.groups.length === 0 && !isAddingGroupHere && (
            <GroupListEmpty
              onStartAdd={() => addGroup.handlers.onStart(level.id)}
            />
          )}

          {level.groups.map((group) => (
            <GroupRow
              key={String(group.id)}
              levelId={level.id}
              group={group}
              editState={editGroup.state}
              editHandlers={editGroup.handlers}
              deleteHandlers={deleteHandlers}
              predicates={predicates}
            />
          ))}

          {isAddingGroupHere && !disabled && (
            <GroupAddForm
              levelId={level.id}
              value={addGroup.state.name}
              onValueChange={addGroup.handlers.onNameChange}
              onConfirm={() => addGroup.handlers.onConfirm(level.id)}
              onCancel={addGroup.handlers.onCancel}
              confirmDisabled={predicates.isGroupAddDisabled?.(level.id)}
            />
          )}
        </div>
      )}
    </Card>
  )
}
