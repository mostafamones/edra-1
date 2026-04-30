"use client"

import { useEffect, useMemo, useState } from "react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { expandLevelWithCap } from "@/components/helpers/academy-utils"
import {
  DEFAULT_LEVEL_COLOR_ID,
  StructureAddLevelButton,
  StructureAddLevelSection,
  StructureEditor,
  type AddGroupHandlers,
  type AddGroupState,
  type AddLevelHandlers,
  type AddLevelState,
  type DeleteHandlers,
  type EditGroupHandlers,
  type EditGroupState,
  type EditLevelHandlers,
  type EditLevelState,
  type StructureDisabledPredicates,
  type StructureLevel,
} from "@/feat/academy"

import type { AcademyDraftLevel } from "../types"
import { createDraftId, reorderByIds } from "../utils"

interface StructureStepProps {
  initialData: {
    levels: AcademyDraftLevel[]
  }
  onUpdate: (data: { levels: AcademyDraftLevel[] }) => void
  autoExpandOnMount?: boolean
  onAutoExpandConsumed?: () => void
}

function initialExpandedFromLevels(levels: AcademyDraftLevel[], autoExpand: boolean) {
  if (!autoExpand) return new Set<string>()

  const secondLevel = levels[1]
  if (!secondLevel || secondLevel.groups.length === 0) {
    return new Set<string>()
  }

  return new Set([secondLevel.id])
}

export function StructureStep({
  initialData,
  onUpdate,
  autoExpandOnMount = true,
  onAutoExpandConsumed,
}: StructureStepProps) {
  const [levels, setLevels] = useState<AcademyDraftLevel[]>(initialData.levels || [])
  const [expandedLevels, setExpandedLevels] = useState<Set<string>>(() =>
    initialExpandedFromLevels(initialData.levels || [], autoExpandOnMount)
  )

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

  const [deleteConfirm, setDeleteConfirm] = useState<{
    title: string
    description: string
    proceed: () => void
  } | null>(null)

  useEffect(() => {
    if (autoExpandOnMount) {
      onAutoExpandConsumed?.()
    }
  }, [autoExpandOnMount, onAutoExpandConsumed])

  const updateLevels = (nextLevels: AcademyDraftLevel[]) => {
    setLevels(nextLevels)
    onUpdate({ levels: nextLevels })
  }

  const openAddLevel = () => {
    setShowAddLevel(true)
    setAddingLevelName("")
    setAddingLevelColor(DEFAULT_LEVEL_COLOR_ID)
  }

  const handleAddLevel = () => {
    if (!addingLevelName.trim()) return

    const nextLevels = [
      {
        id: createDraftId("level"),
        name: addingLevelName.trim(),
        color: addingLevelColor,
        groups: [],
      },
      ...levels,
    ]

    updateLevels(nextLevels)
    setShowAddLevel(false)
    setAddingLevelName("")
    setAddingLevelColor(DEFAULT_LEVEL_COLOR_ID)
  }

  const handleUpdateLevel = (levelId: string) => {
    if (!editingLevelName.trim()) return

    updateLevels(
      levels.map((level) =>
        level.id === levelId
          ? {
              ...level,
              name: editingLevelName.trim(),
              color: editingLevelColor,
            }
          : level
      )
    )

    setEditingLevelId(null)
  }

  const handleDeleteLevel = (levelId: string) => {
    updateLevels(levels.filter((level) => level.id !== levelId))
    setExpandedLevels((previous) => {
      const next = new Set(previous)
      next.delete(levelId)
      return next
    })
    if (editingLevelId === levelId) setEditingLevelId(null)
    if (addingGroupToLevel === levelId) setAddingGroupToLevel(null)
  }

  const handleAddGroup = (levelId: string) => {
    if (!addingGroupName.trim()) return

    updateLevels(
      levels.map((level) =>
        level.id === levelId
          ? {
              ...level,
              groups: [
                ...level.groups,
                {
                  id: createDraftId("group"),
                  name: addingGroupName.trim(),
                },
              ],
            }
          : level
      )
    )

    setAddingGroupName("")
    setAddingGroupToLevel(null)
    setExpandedLevels((previous) => expandLevelWithCap(previous, levelId))
  }

  const handleUpdateGroup = (levelId: string, groupId: string) => {
    if (!editingGroupName.trim()) return

    updateLevels(
      levels.map((level) =>
        level.id === levelId
          ? {
              ...level,
              groups: level.groups.map((group) =>
                group.id === groupId ? { ...group, name: editingGroupName.trim() } : group
              ),
            }
          : level
      )
    )

    setEditingGroupId(null)
  }

  const handleDeleteGroup = (levelId: string, groupId: string) => {
    updateLevels(
      levels.map((level) =>
        level.id === levelId
          ? {
              ...level,
              groups: level.groups.filter((group) => group.id !== groupId),
            }
          : level
      )
    )

    if (editingGroupId === groupId) setEditingGroupId(null)
  }

  const addLevelConfirmDisabled = !addingLevelName.trim()

  const addLevelStateBody: AddLevelState = {
    name: addingLevelName,
    color: addingLevelColor,
    isOpen: showAddLevel,
  }

  const addLevelStateHeader: AddLevelState = {
    ...addLevelStateBody,
    isOpen: false,
  }

  const addLevelHandlers: AddLevelHandlers = {
    onNameChange: setAddingLevelName,
    onColorChange: setAddingLevelColor,
    onOpen: openAddLevel,
    onClose: () => setShowAddLevel(false),
    onConfirm: handleAddLevel,
  }

  const editLevelState: EditLevelState<string> = {
    levelId: editingLevelId,
    name: editingLevelName,
    color: editingLevelColor,
  }

  const editLevelHandlers: EditLevelHandlers<string> = {
    onStart: (level) => {
      setEditingLevelId(level.id)
      setEditingLevelName(level.name)
      setEditingLevelColor(level.color ?? DEFAULT_LEVEL_COLOR_ID)
      setShowAddLevel(false)
    },
    onCancel: () => setEditingLevelId(null),
    onConfirm: handleUpdateLevel,
    onNameChange: setEditingLevelName,
    onColorChange: setEditingLevelColor,
  }

  const addGroupState: AddGroupState<string> = {
    levelId: addingGroupToLevel,
    name: addingGroupName,
  }

  const addGroupHandlers: AddGroupHandlers<string> = {
    onStart: (levelId) => {
      setAddingGroupToLevel(levelId)
      setAddingGroupName("")
      setExpandedLevels((previous) => expandLevelWithCap(previous, levelId))
    },
    onCancel: () => setAddingGroupToLevel(null),
    onConfirm: handleAddGroup,
    onNameChange: setAddingGroupName,
  }

  const editGroupState: EditGroupState<string> = {
    groupId: editingGroupId,
    name: editingGroupName,
  }

  const editGroupHandlers: EditGroupHandlers<string> = {
    onStart: (group) => {
      setEditingGroupId(group.id)
      setEditingGroupName(group.name)
    },
    onCancel: () => setEditingGroupId(null),
    onConfirm: handleUpdateGroup,
    onNameChange: setEditingGroupName,
  }

  const deleteHandlers: DeleteHandlers<string> = {
    onDeleteLevel: handleDeleteLevel,
    onDeleteGroup: handleDeleteGroup,
    onRequestDeleteLevel: (_levelId, proceed) => {
      setDeleteConfirm({
        title: "Delete level?",
        description:
          "This will permanently remove the level and all of its groups from the draft.",
        proceed,
      })
    },
    onRequestDeleteGroup: (_levelId, _groupId, proceed) => {
      setDeleteConfirm({
        title: "Delete group?",
        description: "This group will be removed from the draft.",
        proceed,
      })
    },
  }

  const predicates: StructureDisabledPredicates<string> = useMemo(
    () => ({
      isLevelUpdateDisabled: (level) =>
        !editingLevelName.trim() ||
        (level.name === editingLevelName.trim() &&
          (level.color ?? DEFAULT_LEVEL_COLOR_ID) === editingLevelColor),
      isGroupUpdateDisabled: (group) =>
        !editingGroupName.trim() || group.name === editingGroupName.trim(),
      isGroupAddDisabled: () => !addingGroupName.trim(),
    }),
    [addingGroupName, editingGroupName, editingLevelColor, editingLevelName]
  )

  const toggleLevel = (levelId: string) => {
    setExpandedLevels((previous) => {
      const next = new Set(previous)
      if (next.has(levelId)) {
        next.delete(levelId)
        return next
      }

      return expandLevelWithCap(previous, levelId)
    })
  }

  const handleReorderLevels = (orderedIds: string[]) => {
    updateLevels(reorderByIds(levels, orderedIds))
  }

  return (
    <div className="flex flex-col gap-4">
      <CardHeader className="text-left">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-2xl font-semibold">Academy Structure</CardTitle>
            <CardDescription className="text-sm -mt-1">
              Define the levels and groups you want to start with.
            </CardDescription>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <StructureAddLevelButton
              state={addLevelStateHeader}
              handlers={addLevelHandlers}
              confirmDisabled={addLevelConfirmDisabled}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex h-full flex-col space-y-3">
        <StructureEditor
          levels={levels as StructureLevel<string>[]}
          expandedLevels={expandedLevels}
          onToggleLevel={toggleLevel}
          addLevel={{
            state: addLevelStateBody,
            handlers: addLevelHandlers,
            confirmDisabled: addLevelConfirmDisabled,
          }}
          editLevel={{ state: editLevelState, handlers: editLevelHandlers }}
          addGroup={{ state: addGroupState, handlers: addGroupHandlers }}
          editGroup={{ state: editGroupState, handlers: editGroupHandlers }}
          deleteHandlers={deleteHandlers}
          predicates={predicates}
          canShowAddLevelCta={false}
          hideAddLevelSection
          onReorderLevels={handleReorderLevels}
        />

        {showAddLevel && (
          <StructureAddLevelSection
            state={addLevelStateBody}
            handlers={addLevelHandlers}
            confirmDisabled={addLevelConfirmDisabled}
            canShowCta={false}
          />
        )}

        {deleteConfirm && (
          <AlertDialog
            open
            onOpenChange={(open) => {
              if (!open) setDeleteConfirm(null)
            }}
          >
            <AlertDialogContent size="sm">
              <AlertDialogHeader>
                <AlertDialogTitle>{deleteConfirm.title}</AlertDialogTitle>
                <AlertDialogDescription>{deleteConfirm.description}</AlertDialogDescription>
              </AlertDialogHeader>

              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  onClick={() => {
                    deleteConfirm.proceed()
                    setDeleteConfirm(null)
                  }}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </CardContent>
    </div>
  )
}
