import { useRef, useState } from "react"
import type { StructureId, StructureLevel } from "./types"

interface UseDragReorderOptions<TId extends StructureId> {
  levels: StructureLevel<TId>[]
  onReorder?: (orderedIds: TId[]) => void
  enabled: boolean
}

interface UseDragReorderResult<TId extends StructureId> {
  canDrag: boolean
  draggingId: TId | null
  dragOverId: TId | null
  handleDragStart: (e: React.DragEvent, level: StructureLevel<TId>, index: number) => void
  handleDragOver: (e: React.DragEvent, level: StructureLevel<TId>) => void
  handleDrop: (e: React.DragEvent, targetLevel: StructureLevel<TId>) => void
  handleDragEnd: () => void
}

export function useDragReorder<TId extends StructureId>({
  levels,
  onReorder,
  enabled,
}: UseDragReorderOptions<TId>): UseDragReorderResult<TId> {
  const [draggingId, setDraggingId] = useState<TId | null>(null)
  const [dragOverId, setDragOverId] = useState<TId | null>(null)
  const dragSrcIndex = useRef<number>(-1)

  const canDrag = !!onReorder && enabled

  function handleDragStart(e: React.DragEvent, level: StructureLevel<TId>, index: number) {
    setDraggingId(level.id)
    dragSrcIndex.current = index
    e.dataTransfer.effectAllowed = "move"
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

    onReorder?.(next.map((l) => l.id))
    setDraggingId(null)
    setDragOverId(null)
  }

  function handleDragEnd() {
    setDraggingId(null)
    setDragOverId(null)
  }

  return {
    canDrag,
    draggingId,
    dragOverId,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd,
  }
}
