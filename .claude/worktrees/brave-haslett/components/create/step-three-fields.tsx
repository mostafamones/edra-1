"use client"

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Toggle } from "@/components/ui/toggle"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import {
  IconForms,
  IconCheck,
  IconPlus,
  IconTrash,
  IconX,
  IconEdit,
  IconAbc,
  IconHash,
  IconCalendar,
  IconToggleLeft,
  IconAsterisk,
  IconCursorText,
  IconPhone,
  IconChevronDown,
  IconChevronRight,
  IconList,
} from "@tabler/icons-react"
import { cn } from "@/lib/utils"

// ── Types ─────────────────────────────────────────────────────────────────────

type FieldType = "text" | "number" | "date" | "boolean" | "phone" | "select"

interface SelectOption {
  id: string
  label: string
}

export interface CustomField {
  id: string
  name: string
  field_type: FieldType
  is_required: boolean
  options?: string[] // only for "select" type
}

// ── Field type config ─────────────────────────────────────────────────────────

const fieldTypeConfig: Record<FieldType, { label: string; icon: typeof IconAbc }> = {
  text: { label: "Text", icon: IconCursorText },
  number: { label: "Number", icon: IconHash },
  date: { label: "Date", icon: IconCalendar },
  boolean: { label: "Yes / No", icon: IconToggleLeft },
  phone: { label: "Phone", icon: IconPhone },
  select: { label: "Select", icon: IconList },
}

// ── Default demo fields ───────────────────────────────────────────────────────

const DEFAULT_FIELDS: CustomField[] = [
  { id: "field-default-birthday", name: "Birthday", field_type: "date", is_required: false },
  { id: "field-default-parent-contact", name: "Parent Contact", field_type: "phone", is_required: false },
]

// ── Props ─────────────────────────────────────────────────────────────────────

interface StepThreeFieldsProps {
  initialData: { fields: CustomField[] }
  onUpdate: (data: { fields: CustomField[] }) => void
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeOptionId() {
  return `opt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

/** Auto-generate a label like "Option A", "Option B", ... */
function nextOptionLabel(existing: SelectOption[]): string {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
  for (let i = 0; i < letters.length; i++) {
    const candidate = `Option ${letters[i]}`
    if (!existing.some((o) => o.label === candidate)) return candidate
  }
  return `Option ${existing.length + 1}`
}

// ── Popover type picker ───────────────────────────────────────────────────────

function FieldTypePopover({
  value,
  onChange,
}: {
  value: FieldType
  onChange: (v: FieldType) => void
}) {
  const [open, setOpen] = useState(false)
  const CurrentIcon = fieldTypeConfig[value].icon

  return (
    <Tooltip delayDuration={1000}>
      <Popover open={open} onOpenChange={setOpen}>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon-lg"
              className="shrink-0 size-9 rounded-lg bg-muted/20 border-input"
              aria-label={`Field type: ${fieldTypeConfig[value].label}`}
            >
              <CurrentIcon className="size-4 text-muted-foreground" />
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>

        <PopoverContent className="w-[175px] p-1" align="start" sideOffset={6}>
          <div className="flex flex-col gap-0.5">
            {(Object.entries(fieldTypeConfig) as [FieldType, typeof fieldTypeConfig.text][]).map(
              ([type, config]) => {
                const TypeIcon = config.icon
                const isSelected = value === type
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      onChange(type)
                      setOpen(false)
                    }}
                    className={cn(
                      "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors text-left w-full",
                      isSelected
                        ? "bg-white/10 text-primary-foreground"
                        : "hover:bg-muted text-foreground"
                    )}
                  >
                    <TypeIcon className="size-4 shrink-0" />
                    <span>{config.label}</span>
                    {isSelected && <IconCheck className="size-3.5 ml-auto" />}
                  </button>
                )
              }
            )}
          </div>
        </PopoverContent>
      </Popover>
      <TooltipContent side="bottom">{fieldTypeConfig[value].label}</TooltipContent>
    </Tooltip>
  )
}

// ── Shared row: type popover + input-group + confirm/cancel ───────────────────

function FieldRow({
  name,
  onNameChange,
  fieldType,
  onTypeChange,
  isRequired,
  onRequiredChange,
  onConfirm,
  onCancel,
  confirmDisabled,
  confirmTooltip,
  autoFocus = true,
}: {
  name: string
  onNameChange: (v: string) => void
  fieldType: FieldType
  onTypeChange: (v: FieldType) => void
  isRequired: boolean
  onRequiredChange: (v: boolean) => void
  onConfirm: () => void
  onCancel: () => void
  confirmDisabled: boolean
  confirmTooltip?: string
  autoFocus?: boolean
}) {
  const confirmBtn = (
    <Button size="icon-lg" onClick={onConfirm} disabled={confirmDisabled}>
      <IconCheck className="size-4" />
    </Button>
  )

  return (
    <div className="flex items-center gap-2 w-full">
      <FieldTypePopover value={fieldType} onChange={onTypeChange} />

      <InputGroup className="h-9 w-full flex-1">
        <InputGroupInput
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Field name..."
          className="h-9 text-base"
          autoFocus={autoFocus}
          onKeyDown={(e) => {
            if (e.key === "Enter") onConfirm()
            if (e.key === "Escape") onCancel()
          }}
        />
        <InputGroupAddon align="inline-end">
          <Toggle
            pressed={isRequired}
            onPressedChange={onRequiredChange}
            className={cn("size-5 p-0 transition-all")}
            aria-label="Toggle required"
          >
            <IconAsterisk className="size-3.5 group-data-[state=on]/toggle:text-destructive" />
          </Toggle>
        </InputGroupAddon>
      </InputGroup>

      <div className="flex gap-0.5 shrink-0">
        {confirmDisabled && confirmTooltip ? (
          <Tooltip delayDuration={600}>
            <TooltipTrigger asChild>
              {/* span needed so tooltip fires on disabled button */}
              <span tabIndex={0}>{confirmBtn}</span>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-[200px] text-center">
              {confirmTooltip}
            </TooltipContent>
          </Tooltip>
        ) : confirmBtn}
        <Button variant="ghost" size="icon-lg" onClick={onCancel}>
          <IconX className="size-4" />
        </Button>
      </div>
    </div>
  )
}

// ── Google-Forms-style Options Panel ─────────────────────────────────────────

function OptionsPanel({
  options,
  onOptionsChange,
  fieldType,
}: {
  options: SelectOption[]
  onOptionsChange: (next: SelectOption[]) => void
  fieldType: FieldType
}) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingValue, setEditingValue] = useState("")
  // Tracks ids that were just spawned by Enter (pressing Esc removes them)
  const pendingRef = useRef<Set<string>>(new Set())

  if (fieldType !== "select") return null

  // Commit the currently-editing option
  const commitEdit = (id: string) => {
    const trimmed = editingValue.trim()
    if (!trimmed) {
      // empty → remove it if it was a pending new one
      if (pendingRef.current.has(id)) {
        pendingRef.current.delete(id)
        onOptionsChange(options.filter((o) => o.id !== id))
      }
      setEditingId(null)
      return
    }
    pendingRef.current.delete(id)
    onOptionsChange(options.map((o) => (o.id === id ? { ...o, label: trimmed } : o)))
    setEditingId(null)
  }

  // Enter: save current + spawn new option below
  const commitAndSpawnNext = (id: string) => {
    const trimmed = editingValue.trim()
    // Save current option (even if empty, keep old label in that case)
    pendingRef.current.delete(id)
    const savedOptions = trimmed
      ? options.map((o) => (o.id === id ? { ...o, label: trimmed } : o))
      : options.filter((o) => o.id !== id) // drop if blank

    // Spawn new
    const newId = makeOptionId()
    const newLabel = nextOptionLabel(savedOptions)
    const newOption: SelectOption = { id: newId, label: newLabel }
    pendingRef.current.add(newId)

    onOptionsChange([...savedOptions, newOption])
    setEditingId(newId)
    setEditingValue(newLabel)
  }

  // Esc: cancel edit
  const cancelEdit = (id: string) => {
    if (pendingRef.current.has(id)) {
      // Was a brand-new option spawned by Enter → remove it
      pendingRef.current.delete(id)
      onOptionsChange(options.filter((o) => o.id !== id))
    }
    setEditingId(null)
  }

  // Click "Add option" button
  const addOption = () => {
    // commit any in-progress edit first
    if (editingId) {
      commitEdit(editingId)
    }
    const newId = makeOptionId()
    const newLabel = nextOptionLabel(options)
    const newOption: SelectOption = { id: newId, label: newLabel }
    pendingRef.current.add(newId)
    onOptionsChange([...options, newOption])
    setEditingId(newId)
    setEditingValue(newLabel)
  }

  const removeOption = (id: string) => {
    pendingRef.current.delete(id)
    if (editingId === id) setEditingId(null)
    onOptionsChange(options.filter((o) => o.id !== id))
  }

  const BulletPoint = () => <div className="size-2 rounded-full bg-muted-foreground/60 shrink-0" />

  return (
    <div className="border-t border-input/50 bg-muted/10">
      {options.map((opt) => {
        const isEditingThis = editingId === opt.id

        return (
          <div
            key={opt.id}
            className="flex items-center gap-4 px-3 pl-10 h-12 border-t border-input/30 first:border-t-0 group hover:bg-muted/20 transition-colors"
          >
            <BulletPoint />

            {isEditingThis ? (
              /* ── Inline edit input ── */
              <input
                className="flex-1 bg-transparent text-sm outline-none border-b border-primary/50 focus:border-primary py-0.5 transition-colors"
                value={editingValue}
                onChange={(e) => setEditingValue(e.target.value)}
                autoFocus
                onFocus={(e) => e.currentTarget.select()}
                onBlur={() => commitEdit(opt.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    commitAndSpawnNext(opt.id)
                  }
                  if (e.key === "Escape") {
                    e.preventDefault()
                    cancelEdit(opt.id)
                  }
                }}
              />
            ) : (
              /* ── Display label (click to edit) ── */
              <div className="hover:border-b border-b-white/10 w-full h-6 flex items-center">
                <p
                  className="flex-1 text-sm cursor-text"
                  onClick={() => {
                    setEditingId(opt.id)
                    setEditingValue(opt.label)
                  }}
                >
                  {opt.label}
                </p>
              </div>
            )}

            <Button
              variant="ghost"
              size="sm"
              className="size-7 p-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all shrink-0"
              onClick={() => removeOption(opt.id)}
            >
              <IconX className="size-3.5" />
            </Button>
          </div>
        )
      })}

      {/* Add option button */}
      <div className="flex items-center gap-4 px-3 pl-10 h-12 border-t border-input/30 first:border-t-0 group hover:bg-muted/20 transition-colors">
        <BulletPoint />
        <Button
          variant="link"
          onClick={addOption}
          className="text-muted-foreground hover:text-foreground justify-start px-0 font-normal"
        >
          Add option
        </Button>
        <p className="text-sm text-muted-foreground -mx-1">or</p>
        <Button
          variant="link"
          onClick={addOption}
          className="text-primary hover:text-primary/80 justify-start px-0 font-normal"
        >
          Add "Other"
        </Button>
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export function StepThreeFields({ initialData, onUpdate }: StepThreeFieldsProps) {
  const [fields, setFields] = useState<CustomField[]>(
    initialData.fields.length > 0 ? initialData.fields : DEFAULT_FIELDS
  )

  // Inline editing
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null)
  const [editingFieldName, setEditingFieldName] = useState("")
  const [editingFieldType, setEditingFieldType] = useState<FieldType>("text")
  const [editingFieldRequired, setEditingFieldRequired] = useState(false)
  const [editingOptions, setEditingOptions] = useState<SelectOption[]>([])

  // Adding new
  const [showAddField, setShowAddField] = useState(false)
  const [addingFieldName, setAddingFieldName] = useState("")
  const [addingFieldType, setAddingFieldType] = useState<FieldType>("text")
  const [addingFieldRequired, setAddingFieldRequired] = useState(false)
  const [addingOptions, setAddingOptions] = useState<SelectOption[]>([])

  // Expanded select fields (display mode)
  const [expandedFields, setExpandedFields] = useState<Set<string>>(new Set())

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<CustomField | null>(null)

  // ── Helpers ───────────────────────────────────────────────────────────────

  const updateFields = (next: CustomField[]) => {
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

  // ── CRUD ──────────────────────────────────────────────────────────────────

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

  const startEditing = (field: CustomField) => {
    setShowAddField(false)
    setEditingFieldId(field.id)
    setEditingFieldName(field.name)
    setEditingFieldType(field.field_type)
    setEditingFieldRequired(field.is_required)
    setEditingOptions(
      (field.options ?? []).map((label) => ({ id: makeOptionId(), label }))
    )
  }

  // ── Computed disabled states ──────────────────────────────────────────────

  const addConfirmDisabled =
    !addingFieldName.trim() ||
    (addingFieldType === "select" && addingOptions.length < 2)

  const editConfirmDisabled =
    !editingFieldName.trim() ||
    (editingFieldType === "select" && editingOptions.length < 2)

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col">
      <CardHeader className="text-left mb-4">
        <CardTitle className="text-2xl font-semibold">Custom Fields</CardTitle>
        <CardDescription className="text-sm -mt-1">
          Add extra information fields collected from each student.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3 h-full flex flex-col">

        {/* Add Row or Add Button */}
        {showAddField ? (
          <div className="rounded-lg border border-primary/30 bg-primary/5 overflow-hidden">
            <div className="px-3 h-15 flex items-center">
              <FieldRow
                name={addingFieldName}
                onNameChange={setAddingFieldName}
                fieldType={addingFieldType}
                onTypeChange={(t) => {
                  setAddingFieldType(t)
                  setAddingOptions([])
                }}
                isRequired={addingFieldRequired}
                onRequiredChange={setAddingFieldRequired}
                onConfirm={handleAddField}
                onCancel={() => setShowAddField(false)}
                confirmDisabled={addConfirmDisabled}
                confirmTooltip={
                  addingFieldType === "select" && addingOptions.length < 2
                    ? "Select fields need at least 2 options"
                    : undefined
                }
              />
            </div>
            <OptionsPanel
              options={addingOptions}
              onOptionsChange={setAddingOptions}
              fieldType={addingFieldType}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-15">
            <Button
              variant="outline"
              onClick={openAddRow}
              className="gap-1.5 h-10 w-full"
            >
              <IconPlus className="size-5" />
              Add Field
            </Button>
          </div>
        )}

        {/* Fields List */}
        <div className="flex flex-col gap-3">
          {fields.map((field) => {
            const config = fieldTypeConfig[field.field_type] ?? fieldTypeConfig.text
            const TypeIcon = config.icon
            const isEditing = editingFieldId === field.id
            const isExpanded = expandedFields.has(field.id)
            const isSelect = field.field_type === "select"

            return (
              <div
                key={field.id}
                className="rounded-lg border border-input bg-muted/20 overflow-hidden transition-colors"
              >
                {isEditing ? (
                  /* ── Edit Mode ── */
                  <>
                    <div className="px-3 h-15 flex items-center hover:bg-muted/30">
                      <FieldRow
                        name={editingFieldName}
                        onNameChange={setEditingFieldName}
                        fieldType={editingFieldType}
                        onTypeChange={(t) => {
                          setEditingFieldType(t)
                          if (t !== "select") setEditingOptions([])
                        }}
                        isRequired={editingFieldRequired}
                        onRequiredChange={setEditingFieldRequired}
                        onConfirm={() => handleUpdateField(field.id)}
                        onCancel={() => setEditingFieldId(null)}
                        confirmDisabled={editConfirmDisabled}
                        confirmTooltip={
                          editingFieldType === "select" && editingOptions.length < 2
                            ? "Select fields need at least 2 options"
                            : undefined
                        }
                      />
                    </div>
                    <OptionsPanel
                      options={editingOptions}
                      onOptionsChange={setEditingOptions}
                      fieldType={editingFieldType}
                    />
                  </>
                ) : (
                  /* ── Display Mode ── */
                  <>
                    <div className="flex items-center gap-3 px-3 h-15 hover:bg-muted/30 transition-colors">
                      {isSelect ? (
                        <button
                          type="button"
                          onClick={() => toggleExpanded(field.id)}
                          className="flex items-center justify-center size-9 rounded-md bg-muted/40 shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {isExpanded
                            ? <IconChevronDown className="size-4" />
                            : <IconChevronRight className="size-4" />}
                        </button>
                      ) : (
                        <Tooltip delayDuration={1000}>
                          <TooltipTrigger asChild>
                            <div className="flex items-center justify-center size-9 rounded-md bg-muted/40 shrink-0 cursor-default">
                              <TypeIcon className="size-4 text-muted-foreground" />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="bottom">{config.label}</TooltipContent>
                        </Tooltip>
                      )}

                      <div
                        className={cn("flex-1 flex items-center gap-2 min-w-0", isSelect && "cursor-pointer")}
                        onClick={isSelect ? () => toggleExpanded(field.id) : undefined}
                      >
                        <p className="text-sm font-medium truncate">{field.name}</p>

                        {isSelect && (
                          <Tooltip delayDuration={600}>
                            <TooltipTrigger className="flex items-center shrink-0">
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 gap-1">
                                <IconList className="size-2.5" />
                                {field.options?.length ?? 0}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">
                              {field.options?.length ?? 0} option{(field.options?.length ?? 0) !== 1 ? "s" : ""}
                            </TooltipContent>
                          </Tooltip>
                        )}

                        {field.is_required && (
                          <Tooltip delayDuration={600}>
                            <TooltipTrigger className="flex items-center shrink-0">
                              <Badge variant="destructive" className="px-1 py-0 gap-0.5">
                                <IconAsterisk className="size-2.5" />
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">This field will be required on the student form</TooltipContent>
                          </Tooltip>
                        )}
                      </div>

                      <div className="flex items-center gap-0 shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="size-9 p-0 text-muted-foreground hover:text-foreground"
                          onClick={() => startEditing(field)}
                          title="Edit field"
                        >
                          <IconEdit className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="size-9 p-0 text-muted-foreground hover:text-destructive"
                          onClick={() => setDeleteTarget(field)}
                          title="Delete field"
                        >
                          <IconTrash className="size-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Expanded read-only options */}
                    {isSelect && isExpanded && (
                      <div className="border-t border-input/50 bg-muted/10">
                        {(field.options ?? []).map((opt, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 px-3 pl-[52px] h-10 border-t border-input/30 first:border-t-0 text-sm text-muted-foreground"
                          >
                            <div className="size-1.5 rounded-full bg-muted-foreground/40 shrink-0" />
                            {opt}
                          </div>
                        ))}
                        {(field.options?.length ?? 0) === 0 && (
                          <div className="flex items-center h-10 px-3 pl-[52px] text-xs text-muted-foreground">
                            No options
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            )
          })}

          {/* Empty state */}
          {fields.length === 0 && !showAddField && (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-muted-foreground">
              <IconForms className="size-10 opacity-40" />
              <p className="text-sm">No custom fields yet.</p>
              <Button variant="outline" size="sm" onClick={openAddRow}>
                <IconPlus className="size-4 mr-1" />
                Create your first field
              </Button>
            </div>
          )}
        </div>

        {/* Delete Confirmation */}
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
