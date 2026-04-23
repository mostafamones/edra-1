"use client"

import { useCallback, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { IconEye } from "@tabler/icons-react"
import {
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { toast } from "sonner"
import type { Level, Group } from "@/lib"
import { useGroups, useLevels } from "@/lib/hooks/use-data"
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
import {
  DEFAULT_LEVEL_COLOR_ID,
  StructureEditor,
  StructureAddLevelButton,
  StructureAddLevelSection,
  type StructureLevel,
  type AddLevelState,
  type AddLevelHandlers,
  type EditLevelState,
  type EditLevelHandlers,
  type AddGroupState,
  type AddGroupHandlers,
  type EditGroupState,
  type EditGroupHandlers,
  type DeleteHandlers,
  type StructureDisabledPredicates,
} from "@/feat/academy"
import { expandLevelWithCap } from "@/components/helpers/academy-utils"
import { api } from "@/lib/api/client"
import * as mutations from "@/lib/hooks/mutations"
import { invalidateLevels } from "@/lib/hooks/use-data"
import { getErrorMessage } from "@/lib/get-error-message"

type GroupShape = Pick<Group, "id" | "name">
type LevelShape = Pick<Level, "id" | "name" | "color"> & { groups: GroupShape[] }

function AcademyStructureSkeleton() {
  return (
    <div className="flex flex-col gap-3 px-6 py-4">
      <Skeleton className="h-15 w-full" />
      <Skeleton className="h-15 w-full" />
      <Skeleton className="h-15 w-full" />
    </div>
  )
}

export function AcademyStructure({
  disabled,
  academyId,
  title
}: {
  disabled?: boolean
  academyId?: string
  title?: React.ReactNode
}) {
  const [expandedLevels, setExpandedLevels] = useState<Set<number>>(new Set())

  const [editingLevelId, setEditingLevelId] = useState<number | null>(null)
  const [editingLevelName, setEditingLevelName] = useState("")
  const [editingLevelColor, setEditingLevelColor] = useState<string>(DEFAULT_LEVEL_COLOR_ID)
  const [editingGroupId, setEditingGroupId] = useState<number | null>(null)
  const [editingGroupName, setEditingGroupName] = useState("")

  const [addingLevelName, setAddingLevelName] = useState("")
  const [addingLevelColor, setAddingLevelColor] = useState<string>(DEFAULT_LEVEL_COLOR_ID)
  const [showAddLevel, setShowAddLevel] = useState(false)
  const [addingGroupToLevel, setAddingGroupToLevel] = useState<number | null>(null)
  const [addingGroupName, setAddingGroupName] = useState("")

  const [savingId, setSavingId] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{
    title: string
    description: string
    proceed: () => void
  } | null>(null)

  const [pendingOrder, setPendingOrder] = useState<number[] | null>(null)
  const [savingOrder, setSavingOrder] = useState(false)

  const {
    data: levelsData,
    loading: levelsLoading,
    error: levelsError,
    refresh: refreshLevels,
  } = useLevels(academyId ?? null)
  const {
    data: groupsData,
    loading: groupsLoading,
    error: groupsError,
    refresh: refreshGroups,
  } = useGroups(academyId ?? null)

  const levels: LevelShape[] = useMemo(() => {
    const resolvedLevels = levelsData ?? []
    const resolvedGroups = groupsData ?? []

    let orderedLevels = resolvedLevels
    if (pendingOrder) {
      const map = new Map(resolvedLevels.map((l) => [l.id, l]))
      const reordered = pendingOrder.map((id) => map.get(id)).filter(Boolean) as typeof resolvedLevels
      const inOrder = new Set(pendingOrder)
      const extras = resolvedLevels.filter((l) => !inOrder.has(l.id))
      orderedLevels = [...reordered, ...extras]
    }

    return orderedLevels.map((level) => ({
      id: level.id,
      name: level.name,
      color: level.color,
      groups: resolvedGroups
        .filter((g) => g.level_id === level.id)
        .map((g) => ({ id: g.id, name: g.name })),
    }))
  }, [levelsData, groupsData, pendingOrder])

  const loading = levelsLoading || groupsLoading
  const loadError = levelsError || groupsError

  const toggleLevel = (levelId: number) => {
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

  const openAddLevel = () => {
    setShowAddLevel(true)
    setAddingLevelName("")
    setAddingLevelColor(DEFAULT_LEVEL_COLOR_ID)
  }

  const handleAddLevel = async () => {
    if (!academyId || !addingLevelName.trim()) return
    setSavingId("add-level")
    try {
      const nextSortOrder = levels.length + 1
      await api.post("/api/levels", {
        academy_id: academyId,
        name: addingLevelName.trim(),
        color: addingLevelColor,
        sort_order: nextSortOrder,
      })
      invalidateLevels()
      await refreshLevels()
      setAddingLevelName("")
      setAddingLevelColor(DEFAULT_LEVEL_COLOR_ID)
      setShowAddLevel(false)
    } catch (err) {
      console.error("Error creating level:", err)
      toast.error(getErrorMessage(err) || "Could not create level.")
    } finally {
      setSavingId(null)
    }
  }

  const handleUpdateLevel = async (levelId: number) => {
    if (!editingLevelName.trim()) return
    setSavingId(`level-${levelId}`)
    try {
      await mutations.updateLevel(levelId, {
        name: editingLevelName.trim(),
        color: editingLevelColor,
      })
      await refreshLevels()
      setEditingLevelId(null)
    } catch (err) {
      console.error("Error updating level:", err)
      toast.error(getErrorMessage(err) || "Could not update level.")
    } finally {
      setSavingId(null)
    }
  }

  const handleDeleteLevel = async (levelId: number) => {
    setSavingId(`delete-level-${levelId}`)
    try {
      await mutations.deleteLevel(levelId)
      await Promise.all([refreshLevels(), refreshGroups()])
      setExpandedLevels((prev) => {
        const next = new Set(prev)
        next.delete(levelId)
        return next
      })
      setPendingOrder((prev) => (prev ? prev.filter((id) => id !== levelId) : null))
    } catch (err) {
      console.error("Error deleting level:", err)
      toast.error(getErrorMessage(err) || "Could not delete level.")
    } finally {
      setSavingId(null)
    }
  }

  const handleAddGroup = async (levelId: number) => {
    if (!academyId || !addingGroupName.trim()) return
    setSavingId(`add-group-${levelId}`)
    try {
      await mutations.createGroup({
        academy_id: academyId,
        level_id: levelId,
        name: addingGroupName.trim(),
      })
      await refreshGroups()
      setAddingGroupName("")
      setAddingGroupToLevel(null)
      setExpandedLevels((prev) => expandLevelWithCap(prev, levelId))
    } catch (err) {
      console.error("Error creating group:", err)
      toast.error(getErrorMessage(err) || "Could not create group.")
    } finally {
      setSavingId(null)
    }
  }

  const handleUpdateGroup = async (levelId: number, groupId: number) => {
    if (!editingGroupName.trim()) return
    setSavingId(`group-${groupId}`)
    try {
      await mutations.updateGroup(groupId, { name: editingGroupName.trim() })
      await refreshGroups()
      setEditingGroupId(null)
    } catch (err) {
      console.error("Error updating group:", err)
      toast.error(getErrorMessage(err) || "Could not update group.")
    } finally {
      setSavingId(null)
    }
  }

  const handleDeleteGroup = async (_levelId: number, groupId: number) => {
    setSavingId(`delete-group-${groupId}`)
    try {
      await mutations.deleteGroup(groupId)
      await refreshGroups()
    } catch (err) {
      console.error("Error deleting group:", err)
      toast.error(getErrorMessage(err) || "Could not delete group.")
    } finally {
      setSavingId(null)
    }
  }

  const handleReorderLevels = useCallback((orderedIds: number[]) => {
    setPendingOrder(orderedIds)
  }, [])

  const handleSaveOrder = async () => {
    if (!pendingOrder) return
    setSavingOrder(true)
    try {
      await api.patch("/api/levels/reorder", { orderedIds: pendingOrder })
      invalidateLevels()
      await refreshLevels()
      setPendingOrder(null)
      toast.success("Level order saved.")
    } catch (err) {
      console.error("Error saving level order:", err)
      toast.error(getErrorMessage(err) || "Could not save order.")
    } finally {
      setSavingOrder(false)
    }
  }

  const addLevelConfirmDisabled = !addingLevelName.trim() || savingId === "add-level"

  const addLevelHandlers: AddLevelHandlers = {
    onNameChange: setAddingLevelName,
    onColorChange: setAddingLevelColor,
    onOpen: openAddLevel,
    onClose: () => setShowAddLevel(false),
    onConfirm: handleAddLevel,
  }

  const addLevelStateBody: AddLevelState = {
    name: addingLevelName,
    color: addingLevelColor,
    isOpen: showAddLevel,
  }

  const addLevelStateHeader: AddLevelState = {
    ...addLevelStateBody,
    isOpen: false,
  }

  const editLevelState: EditLevelState<number> = {
    levelId: editingLevelId,
    name: editingLevelName,
    color: editingLevelColor,
  }

  const editLevelHandlers: EditLevelHandlers<number> = {
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

  const addGroupState: AddGroupState<number> = {
    levelId: addingGroupToLevel,
    name: addingGroupName,
  }

  const addGroupHandlers: AddGroupHandlers<number> = {
    onStart: (levelId) => {
      setAddingGroupToLevel(levelId)
      setAddingGroupName("")
      setExpandedLevels((prev) => expandLevelWithCap(prev, levelId))
    },
    onCancel: () => setAddingGroupToLevel(null),
    onConfirm: handleAddGroup,
    onNameChange: setAddingGroupName,
  }

  const editGroupState: EditGroupState<number> = {
    groupId: editingGroupId,
    name: editingGroupName,
  }

  const editGroupHandlers: EditGroupHandlers<number> = {
    onStart: (group) => {
      setEditingGroupId(group.id)
      setEditingGroupName(group.name)
    },
    onCancel: () => setEditingGroupId(null),
    onConfirm: handleUpdateGroup,
    onNameChange: setEditingGroupName,
  }

  const deleteHandlers: DeleteHandlers<number> = {
    onDeleteLevel: handleDeleteLevel,
    onDeleteGroup: handleDeleteGroup,
    onRequestDeleteLevel: (_levelId, proceed) => {
      setDeleteConfirm({
        title: "Delete level?",
        description:
          "This will permanently delete the level and all of its groups. This action cannot be undone.",
        proceed,
      })
    },
    onRequestDeleteGroup: (_levelId, _groupId, proceed) => {
      setDeleteConfirm({
        title: "Delete group?",
        description: "This group will be permanently deleted. This action cannot be undone.",
        proceed,
      })
    },
  }

  const predicates: StructureDisabledPredicates<number> = {
    isLevelDeleteDisabled: (levelId) => savingId === `delete-level-${levelId}`,
    isLevelUpdateDisabled: (level) =>
      !editingLevelName.trim() ||
      savingId === `level-${level.id}` ||
      (level.name === editingLevelName.trim() &&
        (level.color ?? DEFAULT_LEVEL_COLOR_ID) === editingLevelColor),
    isGroupUpdateDisabled: (group) =>
      !editingGroupName.trim() ||
      group.name === editingGroupName ||
      savingId === `group-${group.id}`,
    isGroupDeleteDisabled: (groupId) => savingId === `delete-group-${groupId}`,
    isGroupAddDisabled: (levelId) =>
      !addingGroupName.trim() || savingId === `add-group-${levelId}`,
  }

  if (loading) return <AcademyStructureSkeleton />

  if (loadError) {
    return (
      <div className="flex flex-col">
        <CardHeader className="text-left mb-4">
          <CardTitle className="text-2xl font-semibold">Academy Structure</CardTitle>
          <CardDescription className="text-sm -mt-1">
            Unable to load structure right now.
          </CardDescription>
        </CardHeader>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <CardHeader className="text-left">
        <div className="flex items-center justify-between gap-3">
          {title}
          <div className="flex items-center gap-2 shrink-0">
            {!disabled && pendingOrder && (
              <Button
                size="sm"
                className="gap-1.5 h-8 px-3 text-sm"
                onClick={handleSaveOrder}
                disabled={savingOrder}
              >
                {savingOrder ? "Saving…" : "Save"}
              </Button>
            )}
            {!disabled && (
              <StructureAddLevelButton
                state={addLevelStateHeader}
                handlers={addLevelHandlers}
                confirmDisabled={addLevelConfirmDisabled}
              />
            )}
            {disabled && (
              <Badge variant="outline" className="text-xs gap-1.5 h-9 px-3">
                <IconEye className="h-4 w-4" />
                View Only
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-2 h-full flex flex-col text-left">
        <StructureEditor
          levels={levels as StructureLevel<number>[]}
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
          disabled={disabled}
          canShowAddLevelCta={false}
          hideAddLevelSection
          showColorDot={false}
          kebabMenu
          onReorderLevels={!disabled ? handleReorderLevels : undefined}
        />

        {showAddLevel && (
          <StructureAddLevelSection
            state={addLevelStateBody}
            handlers={addLevelHandlers}
            confirmDisabled={addLevelConfirmDisabled}
            canShowCta={false}
          />
        )}
      </CardContent>

      <AlertDialog
        open={!!deleteConfirm}
        onOpenChange={(open) => {
          if (!open) setDeleteConfirm(null)
        }}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>{deleteConfirm?.title ?? "Confirm delete"}</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteConfirm?.description ?? "Are you sure you want to continue?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteConfirm(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                deleteConfirm?.proceed()
                setDeleteConfirm(null)
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
