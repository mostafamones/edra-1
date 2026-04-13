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
} from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { useFields } from "@/lib/hooks/use-data"
import {
  FieldEditorRows,
  FieldAddButton,
  FieldAddSection,
  makeOptionId,
  type CustomField,
  type FieldType,
  type SelectOption,
} from "@/components/shared/academy/field-rows"
import AcademySkeleton from "@/components/shared/academy/skeleton"

// ── Local types ───────────────────────────────────────────────────────────────

type AcademyCustomField = CustomField<number> & {
  // ensures the id is number-typed (from Supabase)
}

function toOptions(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((v) => (typeof v === "string" ? v : String(v)))
      .filter((v) => v.trim().length > 0)
  }
  return []
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AcademyFields({
  disabled,
  academyId,
  title,
}: {
  disabled?: boolean
  academyId?: string
  title?: React.ReactNode
}) {
  const {
    data: fieldsData,
    loading,
    refresh,
  } = useFields(academyId ?? null)

  const fields: AcademyCustomField[] = useMemo(() => {
    return (fieldsData ?? []).map((f) => ({
      id: f.id,
      name: f.name,
      field_type: ((f.field_type as FieldType) || "text") as FieldType,
      is_required: f.is_required === true,
      options: toOptions(f.options),
    }))
  }, [fieldsData])

  // Inline editing state
  const [editingFieldId, setEditingFieldId] = useState<number | null>(null)
  const [editingFieldName, setEditingFieldName] = useState("")
  const [editingFieldType, setEditingFieldType] = useState<FieldType>("text")
  const [editingFieldRequired, setEditingFieldRequired] = useState(false)
  const [editingOptions, setEditingOptions] = useState<SelectOption[]>([])

  // Adding state
  const [showAddField, setShowAddField] = useState(false)
  const [addingFieldName, setAddingFieldName] = useState("")
  const [addingFieldType, setAddingFieldType] = useState<FieldType>("text")
  const [addingFieldRequired, setAddingFieldRequired] = useState(false)
  const [addingOptions, setAddingOptions] = useState<SelectOption[]>([])

  // Expand (select fields)
  const [expandedFields, setExpandedFields] = useState<Set<number>>(new Set())

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<AcademyCustomField | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const toggleExpanded = (id: number) => {
    setExpandedFields((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const openAddRow = () => {
    setEditingFieldId(null)
    setShowAddField(true)
    setAddingFieldName("")
    setAddingFieldType("text")
    setAddingFieldRequired(false)
    setAddingOptions([])
  }

  const startEditing = (field: CustomField<number>) => {
    setShowAddField(false)
    setEditingFieldId(field.id)
    setEditingFieldName(field.name)
    setEditingFieldType(field.field_type)
    setEditingFieldRequired(field.is_required === true)
    setEditingOptions((field.options ?? []).map((label) => ({ id: makeOptionId(), label })))
  }

  // ── CRUD ─────────────────────────────────────────────────────────────────────

  const handleAddField = async () => {
    if (!academyId || !addingFieldName.trim()) return
    if (addingFieldType === "select" && addingOptions.length < 2) return
    setSavingId("add-field")
    try {
      const res = await fetch(`/api/fields?academyId=${academyId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          academy_id: academyId,
          name: addingFieldName.trim(),
          field_type: addingFieldType,
          is_required: addingFieldRequired,
          options: addingFieldType === "select" ? addingOptions.map((o) => o.label) : null,
        }),
      })
      if (!res.ok) throw new Error("Failed to create")
      await refresh()
      setShowAddField(false)
      setAddingOptions([])
    } catch (err) {
      console.error("Error creating field:", err)
      toast.error("Could not create field.")
    } finally {
      setSavingId(null)
    }
  }

  const handleUpdateField = async (fieldId: number) => {
    if (!editingFieldName.trim()) return
    if (editingFieldType === "select" && editingOptions.length < 2) return
    setSavingId(`field-${fieldId}`)
    try {
      const res = await fetch(`/api/fields/${fieldId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editingFieldName.trim(),
          field_type: editingFieldType,
          is_required: editingFieldRequired,
          options: editingFieldType === "select" ? editingOptions.map((o) => o.label) : null,
        }),
      })
      if (!res.ok) throw new Error("Failed to update")
      await refresh()
      setEditingFieldId(null)
    } catch (err) {
      console.error("Error updating field:", err)
      toast.error("Could not update field.")
    } finally {
      setSavingId(null)
    }
  }

  const handleDeleteField = async () => {
    if (!deleteTarget) return
    setSavingId(`delete-${deleteTarget.id}`)
    try {
      const res = await fetch(`/api/fields/${deleteTarget.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete")
      await refresh()
      setDeleteTarget(null)
    } catch (err) {
      console.error("Error deleting field:", err)
      toast.error("Could not delete field.")
    } finally {
      setSavingId(null)
    }
  }

  // ── Disabled states ───────────────────────────────────────────────────────────

  const addConfirmDisabled =
    !addingFieldName.trim() ||
    (addingFieldType === "select" && addingOptions.length < 2) ||
    savingId === "add-field"

  const editConfirmDisabled =
    !editingFieldName.trim() ||
    (editingFieldType === "select" && editingOptions.length < 2) ||
    (editingFieldId !== null && savingId === `field-${editingFieldId}`)

  // ── Loading skeleton ──────────────────────────────────────────────────────────

  if (loading) return <AcademySkeleton />

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-4">
      <CardHeader className="text-left">
        <div className="flex items-center justify-between gap-3">
          {title}
          <div className="flex items-center gap-2 shrink-0">
            {!disabled && (
              <FieldAddButton onOpenAddField={openAddRow} />
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

      <CardContent className="space-y-2 h-full flex flex-col">
        <FieldEditorRows
          fields={fields}
          expandedFields={expandedFields}
          showAddField={showAddField}
          addingFieldName={addingFieldName}
          addingFieldType={addingFieldType}
          addingFieldRequired={addingFieldRequired}
          addingOptions={addingOptions}
          editingFieldId={editingFieldId}
          editingFieldName={editingFieldName}
          editingFieldType={editingFieldType}
          editingFieldRequired={editingFieldRequired}
          editingOptions={editingOptions}
          disabled={disabled}
          canShowAddFieldCta={false}
          hideAddFieldSection
          addConfirmDisabled={addConfirmDisabled}
          editConfirmDisabled={editConfirmDisabled}
          onOpenAddField={openAddRow}
          onCloseAddField={() => setShowAddField(false)}
          onAddField={handleAddField}
          onAddingFieldNameChange={setAddingFieldName}
          onAddingFieldTypeChange={setAddingFieldType}
          onAddingFieldRequiredChange={setAddingFieldRequired}
          onAddingOptionsChange={setAddingOptions}
          onStartEditField={startEditing}
          onCancelEditField={() => setEditingFieldId(null)}
          onConfirmEditField={handleUpdateField}
          onEditingFieldNameChange={setEditingFieldName}
          onEditingFieldTypeChange={setEditingFieldType}
          onEditingFieldRequiredChange={setEditingFieldRequired}
          onEditingOptionsChange={setEditingOptions}
          onRequestDeleteField={setDeleteTarget}
          onToggleExpandField={toggleExpanded}
          kebabMenu
        />

        {/* Add form — appears at BOTTOM of list when active (settings pattern) */}
        {showAddField && (
          <FieldAddSection
            showAddField
            canShowAddFieldCta={false}
            addingFieldName={addingFieldName}
            addingFieldType={addingFieldType}
            addingFieldRequired={addingFieldRequired}
            addingOptions={addingOptions}
            addConfirmDisabled={addConfirmDisabled}
            onAddingFieldNameChange={setAddingFieldName}
            onAddingFieldTypeChange={setAddingFieldType}
            onAddingFieldRequiredChange={setAddingFieldRequired}
            onAddingOptionsChange={setAddingOptions}
            onOpenAddField={openAddRow}
            onCloseAddField={() => setShowAddField(false)}
            onAddField={handleAddField}
          />
        )}

        {/* Delete confirmation */}
        <AlertDialog
          open={!!deleteTarget}
          onOpenChange={(open: boolean) => !open && setDeleteTarget(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Field</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete{" "}
                <span className="font-medium text-foreground">{deleteTarget?.name}</span>? This action
                cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex gap-2 justify-end">
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteField}
                variant="destructive"
                disabled={!!deleteTarget && savingId === `delete-${deleteTarget.id}`}
              >
                Delete
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </div>
  )
}
