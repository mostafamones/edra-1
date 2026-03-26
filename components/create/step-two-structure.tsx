"use client"

import { useEffect, useState } from "react"
import {
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import {
  DEFAULT_LEVEL_COLOR_ID,
  StructureEditorRows,
  type StructureLevel,
} from "@/components/shared/academy-structure/rows"
import { MAX_EXPANDED_LEVELS } from "@/components/shared/academy-structure/constants"
import { expandLevelWithCap } from "@/components/shared/academy-structure/utils"

interface Group {
  id: string
  name: string
}

interface Level {
  id: string
  name: string
  groups: Group[]
  color?: string | null
}

interface StepTwoStructureProps {
  initialData: {
    levels: Level[]
  }
  onUpdate: (data: { levels: Level[] }) => void
  /** When true (first visit to this step in the wizard), expand up to MAX levels that have groups. */
  autoExpandOnMount?: boolean
  /** Called once after auto-expand is applied so the parent can skip auto-expand on later visits. */
  onAutoExpandConsumed?: () => void
}

function initialExpandedFromLevels(
  levels: Level[],
  autoExpand: boolean
): Set<string> {
  if (!autoExpand) return new Set()
  const ids = levels
    .filter((l) => l.groups.length > 0)
    .map((l) => l.id)
  return new Set(ids.slice(0, MAX_EXPANDED_LEVELS))
}

export function StepTwoStructure({
  initialData,
  onUpdate,
  autoExpandOnMount = true,
  onAutoExpandConsumed,
}: StepTwoStructureProps) {
  const [levels, setLevels] = useState<Level[]>(initialData.levels || [])
  const [expandedLevels, setExpandedLevels] = useState<Set<string>>(() =>
    initialExpandedFromLevels(initialData.levels || [], autoExpandOnMount)
  )

  useEffect(() => {
    if (autoExpandOnMount) {
      onAutoExpandConsumed?.()
    }
    // Only on mount: prop reflects whether this visit is the first time opening Structure.
  }, [])

  const [editingLevelId, setEditingLevelId] = useState<string | null>(null)
  const [editingLevelName, setEditingLevelName] = useState("")
  const [editingLevelColor, setEditingLevelColor] = useState<string>(DEFAULT_LEVEL_COLOR_ID)
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null)
  const [editingGroupName, setEditingGroupName] = useState("")

  const [addingLevelName, setAddingLevelName] = useState("")
  const [addingLevelColor, setAddingLevelColor] = useState<string>(DEFAULT_LEVEL_COLOR_ID)
  const [showAddLevel, setShowAddLevel] = useState(false)
  const [addingGroupToLevel, setAddingGroupToLevel] = useState<string | null>(null)
  const [addingGroupName, setAddingGroupName] = useState("")

  const updateLevels = (newLevels: Level[]) => {
    setLevels(newLevels)
    onUpdate({ levels: newLevels })
  }

  const closeAddLevelInline = () => {
    setShowAddLevel(false)
    setAddingLevelName("")
    setAddingLevelColor(DEFAULT_LEVEL_COLOR_ID)
  }

  const beginEditLevel = (level: Level) => {
    closeAddLevelInline()
    setEditingLevelId(level.id)
    setEditingLevelName(level.name)
    setEditingLevelColor(level.color ?? DEFAULT_LEVEL_COLOR_ID)
  }

  const toggleLevel = (levelId: string) => {
    setExpandedLevels((prev) => {
      const next = new Set(prev)
      if (next.has(levelId)) {
        next.delete(levelId)
      } else {
        return expandLevelWithCap(prev, levelId)
      }
      return next
    })
  }

  const removeLevel = (levelId: string) => {
    updateLevels(levels.filter((l) => l.id !== levelId))
    setExpandedLevels((prev) => {
      const next = new Set(prev)
      next.delete(levelId)
      return next
    })
    if (editingLevelId === levelId) setEditingLevelId(null)
    if (addingGroupToLevel === levelId) setAddingGroupToLevel(null)
  }

  const removeGroup = (levelId: string, groupId: string) => {
    updateLevels(
      levels.map((l) =>
        l.id === levelId ? { ...l, groups: l.groups.filter((g) => g.id !== groupId) } : l
      )
    )
    if (editingGroupId === groupId) setEditingGroupId(null)
  }

  const handleAddLevel = () => {
    if (!addingLevelName.trim()) return
    const newLevel: Level = {
      id: `level-${Date.now()}`,
      name: addingLevelName.trim(),
      groups: [],
      color: addingLevelColor,
    }
    const newLevels = [newLevel, ...levels]
    updateLevels(newLevels)
    setAddingLevelName("")
    setAddingLevelColor(DEFAULT_LEVEL_COLOR_ID)
    setShowAddLevel(false)
  }

  const handleUpdateLevel = (levelId: string) => {
    if (!editingLevelName.trim()) return
    const newLevels = levels.map((l) =>
      l.id === levelId
        ? { ...l, name: editingLevelName.trim(), color: editingLevelColor }
        : l
    )
    updateLevels(newLevels)
    setEditingLevelId(null)
  }

  const handleAddGroup = (levelId: string) => {
    if (!addingGroupName.trim()) return
    const newGroup: Group = {
      id: `group-${Date.now()}`,
      name: addingGroupName.trim(),
    }
    const newLevels = levels.map((l) =>
      l.id === levelId ? { ...l, groups: [...l.groups, newGroup] } : l
    )
    updateLevels(newLevels)
    setAddingGroupName("")
    setAddingGroupToLevel(null)
    setExpandedLevels((prev) => expandLevelWithCap(prev, levelId))
  }

  const handleUpdateGroup = (levelId: string, groupId: string) => {
    if (!editingGroupName.trim()) return
    const newLevels = levels.map((l) =>
      l.id === levelId
        ? {
            ...l,
            groups: l.groups.map((g) =>
              g.id === groupId ? { ...g, name: editingGroupName.trim() } : g
            ),
          }
        : l
    )
    updateLevels(newLevels)
    setEditingGroupId(null)
  }

  return (
    <div className="flex flex-col">
      <CardHeader className="text-left mb-4">
        <CardTitle className="text-2xl font-semibold">Academy Structure</CardTitle>
        <CardDescription className="text-sm -mt-1">
          Specify your levels and group names!
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-2 h-full flex flex-col">
        <StructureEditorRows
          levels={levels as StructureLevel<string>[]}
          expandedLevels={expandedLevels}
          showAddLevel={showAddLevel}
          addingLevelName={addingLevelName}
          addingLevelColor={addingLevelColor}
          editingLevelId={editingLevelId}
          editingLevelName={editingLevelName}
          editingLevelColor={editingLevelColor}
          editingGroupId={editingGroupId}
          editingGroupName={editingGroupName}
          addingGroupToLevel={addingGroupToLevel}
          addingGroupName={addingGroupName}
          disableAddLevelSubmit={!addingLevelName.trim()}
          isLevelUpdateDisabled={(level) =>
            !editingLevelName.trim() ||
            (level.name === editingLevelName.trim() &&
              (level.color ?? DEFAULT_LEVEL_COLOR_ID) === editingLevelColor)
          }
          isGroupUpdateDisabled={(group) =>
            !editingGroupName.trim() || group.name === editingGroupName
          }
          isGroupAddDisabled={() => !addingGroupName.trim()}
          onOpenAddLevel={() => {
            setShowAddLevel(true)
            setAddingLevelName("")
            setAddingLevelColor(DEFAULT_LEVEL_COLOR_ID)
          }}
          onCloseAddLevel={() => setShowAddLevel(false)}
          onAddLevel={handleAddLevel}
          onAddingLevelNameChange={setAddingLevelName}
          onAddingLevelColorChange={setAddingLevelColor}
          onToggleLevel={toggleLevel}
          onStartAddGroup={(levelId) => {
            setAddingGroupToLevel(levelId)
            setAddingGroupName("")
            setExpandedLevels((prev) => expandLevelWithCap(prev, levelId))
          }}
          onCancelAddGroup={() => setAddingGroupToLevel(null)}
          onAddingGroupNameChange={setAddingGroupName}
          onAddGroup={handleAddGroup}
          onStartEditLevel={(level) => beginEditLevel(level)}
          onCancelEditLevel={() => setEditingLevelId(null)}
          onEditingLevelNameChange={setEditingLevelName}
          onEditingLevelColorChange={setEditingLevelColor}
          onUpdateLevel={handleUpdateLevel}
          onDeleteLevel={removeLevel}
          onStartEditGroup={(group) => {
            setEditingGroupId(group.id)
            setEditingGroupName(group.name)
          }}
          onCancelEditGroup={() => setEditingGroupId(null)}
          onEditingGroupNameChange={setEditingGroupName}
          onUpdateGroup={handleUpdateGroup}
          onDeleteGroup={(levelId, groupId) => removeGroup(levelId, groupId)}
        />
      </CardContent>
    </div>
  )
}
