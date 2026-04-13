"use client"

import { useState } from "react"
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
import {
  FieldEditorRows,
  FieldAddButton,
  FieldAddSection,
  FieldEmptyState,
  makeOptionId,
  type CustomField,
  type FieldType,
  type SelectOption,
} from "@/components/shared/academy/field-rows"

// ── Default demo fields ───────────────────────────────────────────────────────

const DEFAULT_FIELDS: CustomField<string>[] = [
  { id: "field-default-birthday", name: "Birthday", field_type: "date", is_required: false },
  { id: "field-default-parent-contact", name: "Parent Contact", field_type: "phone", is_required: false },
]

// ── Props ─────────────────────────────────────────────────────────────────────

interface StepThreeFieldsProps {
  initialData: { fields: CustomField<string>[] }
  onUpdate: (data: { fields: CustomField<string>[] }) => void
}

// ── Component ─────────────────────────────────────────────────────────────────

export function StepThreeFields({ initialData, onUpdate }: StepThreeFieldsProps) {
  const [fields, setFields] = useState<CustomField<string>[]>(
    initialData.fields.length > 0 ? initialData.fields : DEFAULT_FIELDS
  )

  // Inline editing state
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null)
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
  const [expandedFields, setExpandedFields] = useState<Set<string>>(new Set())

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<CustomField<string> | null>(null)

  // ── Helpers ─────────────────────────────────────────────────────────────────

  const updateFields = (next: CustomField<string>[]) => {
    setFields(next)
    onUpdate({ fields: next })
  }

  const toggleExpanded = (id: string) => {
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

  // ── CRUD ────────────────────────────────────────────────────────────────────

  const handleAddField = () => {
    if (!addingFieldName.trim()) return
    if (addingFieldType === "select" && addingOptions.length < 2) return
    updateFields([
      ...fields,
      {
        id: `field-${Date.now()}`,
        name: addingFieldName.trim(),
        field_type: addingFieldType,
        is_required: addingFieldRequired,
        options: addingFieldType === "select" ? addingOptions.map((o) => o.label) : undefined,
      },
    ])
    setShowAddField(false)
    setAddingOptions([])
  }

  const handleUpdateField = (fieldId: string) => {
    if (!editingFieldName.trim()) return
    if (editingFieldType === "select" && editingOptions.length < 2) return
    updateFields(
      fields.map((f) =>
        f.id === fieldId
          ? {
            ...f,
            name: editingFieldName.trim(),
            field_type: editingFieldType,
            is_required: editingFieldRequired,
            options: editingFieldType === "select" ? editingOptions.map((o) => o.label) : undefined,
          }
          : f
      )
    )
    setEditingFieldId(null)
  }

  const handleDeleteField = () => {
    if (!deleteTarget) return
    updateFields(fields.filter((f) => f.id !== deleteTarget.id))
    setDeleteTarget(null)
  }

  const startEditing = (field: CustomField<string>) => {
    setShowAddField(false)
    setEditingFieldId(field.id)
    setEditingFieldName(field.name)
    setEditingFieldType(field.field_type)
    setEditingFieldRequired(field.is_required)
    setEditingOptions((field.options ?? []).map((label) => ({ id: makeOptionId(), label })))
  }

  // ── Disabled states ─────────────────────────────────────────────────────────

  const addConfirmDisabled =
    !addingFieldName.trim() ||
    (addingFieldType === "select" && addingOptions.length < 2)

  const editConfirmDisabled =
    !editingFieldName.trim() ||
    (editingFieldType === "select" && editingOptions.length < 2)

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col">
      <CardHeader className="text-left mb-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-2xl font-semibold">Custom Fields</CardTitle>
            <CardDescription className="text-sm -mt-1">
              Add extra information fields collected from each student.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <FieldAddButton onOpenAddField={openAddRow} />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 h-full flex flex-col">
        {/* Inline add form — appears at top when active */}
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
        />

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
              <AlertDialogAction onClick={handleDeleteField} variant="destructive">
                Delete
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </div>
  )
}
