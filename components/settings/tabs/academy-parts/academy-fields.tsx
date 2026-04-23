"use client"

import { useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { IconEye } from "@tabler/icons-react"
import {
  CardContent,
  CardHeader,
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
  FieldEditor,
  FieldAddButton,
  FieldAddSection,
  FieldEditorContext,
  defaultFieldTypes,
  makeOptionId,
  type CustomField,
  type SelectOption,
  type AddFieldState,
  type AddFieldHandlers,
  type EditFieldState,
  type EditFieldHandlers,
} from "@/feat/academy"
import * as mutations from "@/lib/hooks/mutations"
import { getErrorMessage } from "@/lib/get-error-message"

function toOptions(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((v) => (typeof v === "string" ? v : String(v)))
      .filter((v) => v.trim().length > 0)
  }
  return []
}

function AcademyFieldsSkeleton() {
  return (
    <div className="flex flex-col gap-3 px-6 py-4">
      <Skeleton className="h-15 w-full" />
      <Skeleton className="h-15 w-full" />
      <Skeleton className="h-15 w-full" />
    </div>
  )
}

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

  const fields: CustomField<number>[] = useMemo(() => {
    return (fieldsData ?? []).map((f) => ({
      id: f.id,
      name: f.name,
      field_type: typeof f.field_type === "string" && f.field_type.length > 0 ? f.field_type : "text",
      is_required: f.is_required === true,
      options: toOptions(f.options),
    }))
  }, [fieldsData])

  const [editingFieldId, setEditingFieldId] = useState<number | null>(null)
  const [editingFieldName, setEditingFieldName] = useState("")
  const [editingFieldType, setEditingFieldType] = useState<string>("text")
  const [editingFieldRequired, setEditingFieldRequired] = useState(false)
  const [editingOptions, setEditingOptions] = useState<SelectOption[]>([])

  const [showAddField, setShowAddField] = useState(false)
  const [addingFieldName, setAddingFieldName] = useState("")
  const [addingFieldType, setAddingFieldType] = useState<string>("text")
  const [addingFieldRequired, setAddingFieldRequired] = useState(false)
  const [addingOptions, setAddingOptions] = useState<SelectOption[]>([])

  const [expandedFields, setExpandedFields] = useState<Set<number>>(new Set())

  const [deleteTarget, setDeleteTarget] = useState<CustomField<number> | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)

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

  const handleAddField = async () => {
    if (!academyId || !addingFieldName.trim()) return
    if (addingFieldType === "select" && addingOptions.length < 2) return
    setSavingId("add-field")
    try {
      await mutations.createField(academyId, {
        name: addingFieldName.trim(),
        field_type: addingFieldType,
        is_required: addingFieldRequired,
        options:
          addingFieldType === "select" ? addingOptions.map((o) => o.label) : null,
      })
      await refresh()
      setShowAddField(false)
      setAddingOptions([])
    } catch (err) {
      console.error("Error creating field:", err)
      toast.error(getErrorMessage(err) || "Could not create field.")
    } finally {
      setSavingId(null)
    }
  }

  const handleUpdateField = async (fieldId: number) => {
    if (!editingFieldName.trim()) return
    if (editingFieldType === "select" && editingOptions.length < 2) return
    setSavingId(`field-${fieldId}`)
    try {
      await mutations.updateField(fieldId, {
        name: editingFieldName.trim(),
        field_type: editingFieldType,
        is_required: editingFieldRequired,
        options:
          editingFieldType === "select" ? editingOptions.map((o) => o.label) : null,
      })
      await refresh()
      setEditingFieldId(null)
    } catch (err) {
      console.error("Error updating field:", err)
      toast.error(getErrorMessage(err) || "Could not update field.")
    } finally {
      setSavingId(null)
    }
  }

  const handleDeleteField = async () => {
    if (!deleteTarget) return
    setSavingId(`delete-${deleteTarget.id}`)
    try {
      await mutations.deleteField(deleteTarget.id)
      await refresh()
      setDeleteTarget(null)
    } catch (err) {
      console.error("Error deleting field:", err)
      toast.error(getErrorMessage(err) || "Could not delete field.")
    } finally {
      setSavingId(null)
    }
  }

  const addConfirmDisabled =
    !addingFieldName.trim() ||
    (addingFieldType === "select" && addingOptions.length < 2) ||
    savingId === "add-field"

  const editConfirmDisabled =
    !editingFieldName.trim() ||
    (editingFieldType === "select" && editingOptions.length < 2) ||
    (editingFieldId !== null && savingId === `field-${editingFieldId}`)

  const addState: AddFieldState = {
    name: addingFieldName,
    fieldType: addingFieldType,
    isRequired: addingFieldRequired,
    options: addingOptions,
    isOpen: showAddField,
  }

  const addHandlers: AddFieldHandlers = {
    onNameChange: setAddingFieldName,
    onTypeChange: setAddingFieldType,
    onRequiredChange: setAddingFieldRequired,
    onOptionsChange: setAddingOptions,
    onOpen: openAddRow,
    onClose: () => setShowAddField(false),
    onConfirm: handleAddField,
  }

  const editState: EditFieldState<number> = {
    fieldId: editingFieldId,
    name: editingFieldName,
    fieldType: editingFieldType,
    isRequired: editingFieldRequired,
    options: editingOptions,
  }

  const editHandlers: EditFieldHandlers<number> = {
    onStart: startEditing,
    onCancel: () => setEditingFieldId(null),
    onConfirm: handleUpdateField,
    onNameChange: setEditingFieldName,
    onTypeChange: setEditingFieldType,
    onRequiredChange: setEditingFieldRequired,
    onOptionsChange: setEditingOptions,
  }

  const fieldEditorCtx = useMemo(() => ({ fieldTypes: defaultFieldTypes }), [])

  if (loading) return <AcademyFieldsSkeleton />

  return (
    <div className="flex flex-col gap-4">
      <CardHeader className="text-left">
        <div className="flex items-center justify-between gap-3">
          {title}
          <div className="flex items-center gap-2 shrink-0">
            {!disabled && <FieldAddButton onClick={openAddRow} />}
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
        <FieldEditorContext.Provider value={fieldEditorCtx}>
          <FieldEditor
            fields={fields}
            expandedFields={expandedFields}
            onToggleExpandField={toggleExpanded}
            onRequestDeleteField={setDeleteTarget}
            addState={addState}
            addHandlers={addHandlers}
            addConfirmDisabled={addConfirmDisabled}
            editState={editState}
            editHandlers={editHandlers}
            editConfirmDisabled={editConfirmDisabled}
            disabled={disabled}
            canShowAddFieldCta={false}
            hideAddSection
            kebabMenu
          />

          {showAddField && (
            <FieldAddSection
              state={addState}
              handlers={addHandlers}
              confirmDisabled={addConfirmDisabled}
              canShowCta={false}
            />
          )}
        </FieldEditorContext.Provider>

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
