"use client"

import { useEffect, useState } from "react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  FieldAddButton,
  FieldAddSection,
  FieldEditor,
  makeOptionId,
  type AddFieldHandlers,
  type AddFieldState,
  type CustomField,
  type EditFieldHandlers,
  type EditFieldState,
  type SelectOption,
} from "@/feat/academy"

import { DEFAULT_FIELDS } from "../context"
import type { AcademyDraftField, AcademyFieldType } from "../types"
import { createDraftId } from "../utils"

interface FieldsStepProps {
  initialData: {
    fields: AcademyDraftField[]
  }
  onUpdate: (data: { fields: AcademyDraftField[] }) => void
}

export function FieldsStep({ initialData, onUpdate }: FieldsStepProps) {
  const [fields, setFields] = useState<AcademyDraftField[]>(
    initialData.fields.length > 0 ? initialData.fields : DEFAULT_FIELDS
  )

  const [editingFieldId, setEditingFieldId] = useState<string | null>(null)
  const [editingFieldName, setEditingFieldName] = useState("")
  const [editingFieldType, setEditingFieldType] = useState<AcademyFieldType>("text")
  const [editingFieldRequired, setEditingFieldRequired] = useState(false)
  const [editingOptions, setEditingOptions] = useState<SelectOption[]>([])

  const [showAddField, setShowAddField] = useState(false)
  const [addingFieldName, setAddingFieldName] = useState("")
  const [addingFieldType, setAddingFieldType] = useState<AcademyFieldType>("text")
  const [addingFieldRequired, setAddingFieldRequired] = useState(false)
  const [addingOptions, setAddingOptions] = useState<SelectOption[]>([])

  const [expandedFields, setExpandedFields] = useState<Set<string>>(new Set())
  const [deleteTarget, setDeleteTarget] = useState<CustomField<string> | null>(null)

  useEffect(() => {
    if (initialData.fields.length === 0) {
      onUpdate({ fields: DEFAULT_FIELDS })
    }
  }, [])

  const updateFields = (nextFields: AcademyDraftField[]) => {
    setFields(nextFields)
    onUpdate({ fields: nextFields })
  }

  const toggleExpanded = (fieldId: string) => {
    setExpandedFields((previous) => {
      const next = new Set(previous)
      next.has(fieldId) ? next.delete(fieldId) : next.add(fieldId)
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

  const startEditing = (field: CustomField<string>) => {
    setShowAddField(false)
    setEditingFieldId(field.id)
    setEditingFieldName(field.name)
    setEditingFieldType(field.field_type as AcademyFieldType)
    setEditingFieldRequired(field.is_required === true)
    setEditingOptions((field.options ?? []).map((label) => ({ id: makeOptionId(), label })))
  }

  const handleAddField = () => {
    if (!addingFieldName.trim()) return
    if (addingFieldType === "select" && addingOptions.length < 2) return

    updateFields([
      ...fields,
      {
        id: createDraftId("field"),
        name: addingFieldName.trim(),
        field_type: addingFieldType,
        is_required: addingFieldRequired,
        options: addingFieldType === "select" ? addingOptions.map((option) => option.label) : undefined,
      },
    ])

    setShowAddField(false)
    setAddingOptions([])
  }

  const handleUpdateField = (fieldId: string) => {
    if (!editingFieldName.trim()) return
    if (editingFieldType === "select" && editingOptions.length < 2) return

    updateFields(
      fields.map((field) =>
        field.id === fieldId
          ? {
              ...field,
              name: editingFieldName.trim(),
              field_type: editingFieldType,
              is_required: editingFieldRequired,
              options:
                editingFieldType === "select"
                  ? editingOptions.map((option) => option.label)
                  : undefined,
            }
          : field
      )
    )

    setEditingFieldId(null)
  }

  const handleDeleteField = () => {
    if (!deleteTarget) return

    updateFields(fields.filter((field) => field.id !== deleteTarget.id))
    setDeleteTarget(null)
  }

  const addConfirmDisabled =
    !addingFieldName.trim() || (addingFieldType === "select" && addingOptions.length < 2)

  const editConfirmDisabled =
    !editingFieldName.trim() || (editingFieldType === "select" && editingOptions.length < 2)

  const addState: AddFieldState = {
    name: addingFieldName,
    fieldType: addingFieldType,
    isRequired: addingFieldRequired,
    options: addingOptions,
    isOpen: showAddField,
  }

  const addHandlers: AddFieldHandlers = {
    onNameChange: setAddingFieldName,
    onTypeChange: (value) => setAddingFieldType(value as AcademyFieldType),
    onRequiredChange: setAddingFieldRequired,
    onOptionsChange: setAddingOptions,
    onOpen: openAddRow,
    onClose: () => setShowAddField(false),
    onConfirm: handleAddField,
  }

  const editState: EditFieldState<string> = {
    fieldId: editingFieldId,
    name: editingFieldName,
    fieldType: editingFieldType,
    isRequired: editingFieldRequired,
    options: editingOptions,
  }

  const editHandlers: EditFieldHandlers<string> = {
    onStart: startEditing,
    onCancel: () => setEditingFieldId(null),
    onConfirm: handleUpdateField,
    onNameChange: setEditingFieldName,
    onTypeChange: (value) => setEditingFieldType(value as AcademyFieldType),
    onRequiredChange: setEditingFieldRequired,
    onOptionsChange: setEditingOptions,
  }

  return (
    <div className="flex flex-col gap-4">
      <CardHeader className="text-left">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-2xl font-semibold">Custom Fields</CardTitle>
            <CardDescription className="text-sm -mt-1">
              Add the extra student details you want to collect.
            </CardDescription>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <FieldAddButton onClick={openAddRow} />
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex h-full flex-col space-y-3">
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
          canShowAddFieldCta={false}
          hideAddSection
        />

        {showAddField && (
          <FieldAddSection
            state={addState}
            handlers={addHandlers}
            confirmDisabled={addConfirmDisabled}
            canShowCta={false}
          />
        )}

        <AlertDialog
          open={!!deleteTarget}
          onOpenChange={(open: boolean) => {
            if (!open) setDeleteTarget(null)
          }}
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

            <div className="flex justify-end gap-2">
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
