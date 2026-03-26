"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { IconEye } from "@tabler/icons-react"
import {
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Card,
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
  StructureEditorRows,
  type StructureLevel,
} from "@/components/shared/academy-structure/rows"
import { expandLevelWithCap } from "@/components/shared/academy-structure/utils"

type GroupShape = Pick<Group, "id" | "name">
type LevelShape = Pick<Level, "id" | "name" | "color"> & { groups: GroupShape[] }


export function AcademyStructure({
  disabled,
  academyId,
}: {
  disabled?: boolean
  academyId?: string
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

    return resolvedLevels.map((level) => ({
      id: level.id,
      name: level.name,
      color: level.color,
      groups: resolvedGroups
        .filter((g) => g.level_id === level.id)
        .map((g) => ({ id: g.id, name: g.name })),
    }))
  }, [levelsData, groupsData])

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

  const handleAddLevel = async () => {
    if (!academyId || !addingLevelName.trim()) return
    setSavingId("add-level")
    try {
      const res = await fetch("/api/levels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          academy_id: academyId,
          name: addingLevelName.trim(),
          color: addingLevelColor,
        }),
      })
      if (!res.ok) throw new Error("Failed to create level")
      await res.json()
      await refreshLevels()
      setAddingLevelName("")
      setAddingLevelColor(DEFAULT_LEVEL_COLOR_ID)
      setShowAddLevel(false)
    } catch (err) {
      console.error("Error creating level:", err)
      toast.error("Could not create level.")
    } finally {
      setSavingId(null)
    }
  }

  const handleUpdateLevel = async (levelId: number) => {
    if (!editingLevelName.trim()) return
    setSavingId(`level-${levelId}`)
    try {
      const res = await fetch(`/api/levels/${levelId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editingLevelName.trim(), color: editingLevelColor }),
      })
      if (!res.ok) throw new Error("Failed to update level")
      await refreshLevels()
      setEditingLevelId(null)
    } catch (err) {
      console.error("Error updating level:", err)
      toast.error("Could not update level.")
    } finally {
      setSavingId(null)
    }
  }

  const handleDeleteLevel = async (levelId: number) => {
    setSavingId(`delete-level-${levelId}`)
    try {
      const res = await fetch(`/api/levels/${levelId}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete level")
      await Promise.all([refreshLevels(), refreshGroups()])
      setExpandedLevels((prev) => {
        const next = new Set(prev)
        next.delete(levelId)
        return next
      })
    } catch (err) {
      console.error("Error deleting level:", err)
      toast.error("Could not delete level.")
    } finally {
      setSavingId(null)
    }
  }

  const handleAddGroup = async (levelId: number) => {
    if (!academyId || !addingGroupName.trim()) return
    setSavingId(`add-group-${levelId}`)
    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          academy_id: academyId,
          level_id: levelId,
          name: addingGroupName.trim(),
        }),
      })
      if (!res.ok) throw new Error("Failed to create group")
      await res.json()
      await refreshGroups()
      setAddingGroupName("")
      setAddingGroupToLevel(null)
      setExpandedLevels((prev) => expandLevelWithCap(prev, levelId))
    } catch (err) {
      console.error("Error creating group:", err)
      toast.error("Could not create group.")
    } finally {
      setSavingId(null)
    }
  }

  const handleUpdateGroup = async (groupId: number, levelId: number) => {
    if (!editingGroupName.trim()) return
    setSavingId(`group-${groupId}`)
    try {
      const res = await fetch("/api/groups", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: groupId, name: editingGroupName.trim() }),
      })
      if (!res.ok) throw new Error("Failed to update group")
      await refreshGroups()
      setEditingGroupId(null)
    } catch (err) {
      console.error("Error updating group:", err)
      toast.error("Could not update group.")
    } finally {
      setSavingId(null)
    }
  }

  const handleDeleteGroup = async (groupId: number) => {
    setSavingId(`delete-group-${groupId}`)
    try {
      const res = await fetch(`/api/groups?id=${groupId}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete group")
      await refreshGroups()
    } catch (err) {
      console.error("Error deleting group:", err)
      toast.error("Could not delete group.")
    } finally {
      setSavingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col">
        <CardHeader className="text-left mb-4">
          <Skeleton className="h-8 w-52" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-3 h-full flex flex-col">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-lg border border-input bg-muted/20 h-15" />
          ))}
        </CardContent>
      </div>
    )
  }

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
    <div className="flex flex-col">
      <CardHeader className="text-left">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-2xl font-semibold">Academy Structure</CardTitle>
            <CardDescription className="text-sm -mt-1">
              Specify your levels and group names!
            </CardDescription>
          </div>
          {disabled && (
            <Badge variant="outline" className="text-xs gap-1.5 h-9 px-3">
              <IconEye className="h-4 w-4" />
              View Only
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-2 h-full flex flex-col">
        <StructureEditorRows
          levels={levels as StructureLevel<number>[]}
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
          disabled={disabled}
          canShowAddLevelCta={!disabled}
          disableAddLevelSubmit={!addingLevelName.trim() || savingId === "add-level"}
          isLevelDeleteDisabled={(levelId) => savingId === `delete-level-${levelId}`}
          isLevelUpdateDisabled={(level) =>
            !editingLevelName.trim() ||
            savingId === `level-${level.id}` ||
            (level.name === editingLevelName.trim() &&
              (level.color ?? DEFAULT_LEVEL_COLOR_ID) === editingLevelColor)
          }
          isGroupUpdateDisabled={(group) =>
            !editingGroupName.trim() ||
            group.name === editingGroupName ||
            savingId === `group-${group.id}`
          }
          isGroupDeleteDisabled={(groupId) => savingId === `delete-group-${groupId}`}
          isGroupAddDisabled={(levelId) =>
            !addingGroupName.trim() || savingId === `add-group-${levelId}`
          }
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
          onStartEditLevel={(level) => {
            setEditingLevelId(level.id)
            setEditingLevelName(level.name)
            setEditingLevelColor(level.color ?? DEFAULT_LEVEL_COLOR_ID)
            setShowAddLevel(false)
          }}
          onCancelEditLevel={() => setEditingLevelId(null)}
          onEditingLevelNameChange={setEditingLevelName}
          onEditingLevelColorChange={setEditingLevelColor}
          onUpdateLevel={handleUpdateLevel}
          onDeleteLevel={handleDeleteLevel}
          onRequestDeleteLevel={(_levelId, proceed) => {
            setDeleteConfirm({
              title: "Delete level?",
              description:
                "This will permanently delete the level and all of its groups. This action cannot be undone.",
              proceed,
            })
          }}
          onStartEditGroup={(group) => {
            setEditingGroupId(group.id)
            setEditingGroupName(group.name)
          }}
          onCancelEditGroup={() => setEditingGroupId(null)}
          onEditingGroupNameChange={setEditingGroupName}
          onUpdateGroup={(levelId, groupId) => handleUpdateGroup(groupId, levelId)}
          onDeleteGroup={(_, groupId) => handleDeleteGroup(groupId)}
          onRequestDeleteGroup={(_, __, proceed) => {
            setDeleteConfirm({
              title: "Delete group?",
              description: "This group will be permanently deleted. This action cannot be undone.",
              proceed,
            })
          }}
        />
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
