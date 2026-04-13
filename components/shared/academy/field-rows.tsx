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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
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
  IconDotsVertical,
} from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

// ── Types ─────────────────────────────────────────────────────────────────────

export type FieldType = "text" | "number" | "date" | "boolean" | "phone" | "select"

export interface SelectOption {
  id: string
  label: string
}

/**
 * Generic field shape. TId is either `string` (wizard / local state)
 * or `number` (settings / Supabase-backed).
 */
export interface CustomField<TId = string> {
  id: TId
  name: string
  field_type: FieldType
  is_required: boolean
  options?: string[]
}

// ── Constants & helpers ───────────────────────────────────────────────────────

export const fieldTypeConfig: Record<FieldType, { label: string; icon: typeof IconAbc }> = {
  text: { label: "Text", icon: IconCursorText },
  number: { label: "Number", icon: IconHash },
  date: { label: "Date", icon: IconCalendar },
  boolean: { label: "Yes / No", icon: IconToggleLeft },
  phone: { label: "Phone", icon: IconPhone },
  select: { label: "Select", icon: IconList },
}

export function makeOptionId() {
  return `opt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

export function nextOptionLabel(existing: SelectOption[]): string {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
  for (let i = 0; i < letters.length; i++) {
    const candidate = `Option ${letters[i]}`
    if (!existing.some((o) => o.label === candidate)) return candidate
  }
  return `Option ${existing.length + 1}`
}

// ── FieldTypePopover ──────────────────────────────────────────────────────────

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

// ── FieldRow ──────────────────────────────────────────────────────────────────

export function FieldRow({
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

// ── OptionsPanel ──────────────────────────────────────────────────────────────

export function OptionsPanel({
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
  const pendingRef = useRef<Set<string>>(new Set())

  if (fieldType !== "select") return null

  const commitEdit = (id: string) => {
    const trimmed = editingValue.trim()
    if (!trimmed) {
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

  const commitAndSpawnNext = (id: string) => {
    const trimmed = editingValue.trim()
    pendingRef.current.delete(id)
    const savedOptions = trimmed
      ? options.map((o) => (o.id === id ? { ...o, label: trimmed } : o))
      : options.filter((o) => o.id !== id)
    const newId = makeOptionId()
    const newLabel = nextOptionLabel(savedOptions)
    const newOption: SelectOption = { id: newId, label: newLabel }
    pendingRef.current.add(newId)
    onOptionsChange([...savedOptions, newOption])
    setEditingId(newId)
    setEditingValue(newLabel)
  }

  const cancelEdit = (id: string) => {
    if (pendingRef.current.has(id)) {
      pendingRef.current.delete(id)
      onOptionsChange(options.filter((o) => o.id !== id))
    }
    setEditingId(null)
  }

  const addOption = () => {
    if (editingId) commitEdit(editingId)
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
          Add &quot;Other&quot;
        </Button>
      </div>
    </div>
  )
}

// ── FieldEmptyState ───────────────────────────────────────────────────────────

interface FieldEmptyStateProps {
  fieldsCount: number
  showAddField: boolean
  canShowAddFieldCta: boolean
  onOpenAddField: () => void
}

export function FieldEmptyState({
  fieldsCount,
  showAddField,
  canShowAddFieldCta,
  onOpenAddField,
}: FieldEmptyStateProps) {
  if (fieldsCount > 0 || showAddField) return null
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-muted-foreground">
      <IconForms className="size-10 opacity-40" />
      <p className="text-sm">No custom fields yet.</p>
      {canShowAddFieldCta && (
        <Button variant="outline" size="sm" onClick={onOpenAddField}>
          <IconPlus className="size-4 mr-1" />
          Create your first field
        </Button>
      )}
    </div>
  )
}

// ── FieldAddSection ───────────────────────────────────────────────────────────
// Renders either the inline add form (when showAddField=true) or the full-width
// button CTA (when showAddField=false and canShowAddFieldCta=true).

interface FieldAddSectionProps {
  showAddField: boolean
  canShowAddFieldCta: boolean
  addingFieldName: string
  addingFieldType: FieldType
  addingFieldRequired: boolean
  addingOptions: SelectOption[]
  addConfirmDisabled: boolean
  onAddingFieldNameChange: (v: string) => void
  onAddingFieldTypeChange: (v: FieldType) => void
  onAddingFieldRequiredChange: (v: boolean) => void
  onAddingOptionsChange: (v: SelectOption[]) => void
  onOpenAddField: () => void
  onCloseAddField: () => void
  onAddField: () => void
}

export function FieldAddSection({
  showAddField,
  canShowAddFieldCta,
  addingFieldName,
  addingFieldType,
  addingFieldRequired,
  addingOptions,
  addConfirmDisabled,
  onAddingFieldNameChange,
  onAddingFieldTypeChange,
  onAddingOptionsChange,
  onAddingFieldRequiredChange,
  onOpenAddField,
  onCloseAddField,
  onAddField,
}: FieldAddSectionProps) {
  if (showAddField) {
    return (
      <div className="rounded-lg border border-primary/30 bg-primary/5 overflow-hidden">
        <div className="px-3 h-15 flex items-center">
          <FieldRow
            name={addingFieldName}
            onNameChange={onAddingFieldNameChange}
            fieldType={addingFieldType}
            onTypeChange={(t) => {
              onAddingFieldTypeChange(t)
              onAddingOptionsChange([])
            }}
            isRequired={addingFieldRequired}
            onRequiredChange={onAddingFieldRequiredChange}
            onConfirm={onAddField}
            onCancel={onCloseAddField}
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
          onOptionsChange={onAddingOptionsChange}
          fieldType={addingFieldType}
        />
      </div>
    )
  }

  if (!canShowAddFieldCta) return null
  return (
    <div className="flex items-center justify-center h-15">
      <Button variant="outline" onClick={onOpenAddField} className="gap-1.5 h-10 w-full">
        <IconPlus className="size-5" />
        Add Field
      </Button>
    </div>
  )
}

// ── FieldAddButton ────────────────────────────────────────────────────────────
// Compact header/toolbar button. Always renders as a small button — the inline
// form is NOT embedded here; render FieldAddSection separately at the desired
// location in the layout.

interface FieldAddButtonProps {
  onOpenAddField: () => void
  disabled?: boolean
}

export function FieldAddButton({ onOpenAddField, disabled = false }: FieldAddButtonProps) {
  return (
    <Button
      variant="outline"
      className="gap-1 h-8 px-3 text-sm"
      onClick={onOpenAddField}
      disabled={disabled}
    >
      <IconPlus className="size-3.5" />
      Add Field
    </Button>
  )
}

// ── FieldEditorRows ───────────────────────────────────────────────────────────

type FieldId = string | number

interface FieldEditorRowsProps<TId extends FieldId> {
  fields: CustomField<TId>[]
  expandedFields: Set<TId>
  showAddField: boolean
  addingFieldName: string
  addingFieldType: FieldType
  addingFieldRequired: boolean
  addingOptions: SelectOption[]
  editingFieldId: TId | null
  editingFieldName: string
  editingFieldType: FieldType
  editingFieldRequired: boolean
  editingOptions: SelectOption[]
  disabled?: boolean
  canShowAddFieldCta?: boolean
  /**
   * When true, the built-in FieldAddSection is NOT rendered at the top.
   * Use this when you want to place the add trigger elsewhere (e.g. header button
   * + bottom-of-list form). Render <FieldAddSection> yourself at the desired position.
   */
  hideAddFieldSection?: boolean
  addConfirmDisabled: boolean
  editConfirmDisabled: boolean
  kebabMenu?: boolean
  onOpenAddField: () => void
  onCloseAddField: () => void
  onAddField: () => void
  onAddingFieldNameChange: (v: string) => void
  onAddingFieldTypeChange: (v: FieldType) => void
  onAddingFieldRequiredChange: (v: boolean) => void
  onAddingOptionsChange: (v: SelectOption[]) => void
  onStartEditField: (field: CustomField<TId>) => void
  onCancelEditField: () => void
  onConfirmEditField: (fieldId: TId) => void
  onEditingFieldNameChange: (v: string) => void
  onEditingFieldTypeChange: (v: FieldType) => void
  onEditingFieldRequiredChange: (v: boolean) => void
  onEditingOptionsChange: (v: SelectOption[]) => void
  onRequestDeleteField: (field: CustomField<TId>) => void
  onToggleExpandField: (fieldId: TId) => void
}

export function FieldEditorRows<TId extends FieldId>({
  fields,
  expandedFields,
  showAddField,
  addingFieldName,
  addingFieldType,
  addingFieldRequired,
  addingOptions,
  editingFieldId,
  editingFieldName,
  editingFieldType,
  editingFieldRequired,
  editingOptions,
  disabled = false,
  canShowAddFieldCta = true,
  hideAddFieldSection = false,
  addConfirmDisabled,
  editConfirmDisabled,
  kebabMenu = false,
  onOpenAddField,
  onCloseAddField,
  onAddField,
  onAddingFieldNameChange,
  onAddingFieldTypeChange,
  onAddingFieldRequiredChange,
  onAddingOptionsChange,
  onStartEditField,
  onCancelEditField,
  onConfirmEditField,
  onEditingFieldNameChange,
  onEditingFieldTypeChange,
  onEditingFieldRequiredChange,
  onEditingOptionsChange,
  onRequestDeleteField,
  onToggleExpandField,
}: FieldEditorRowsProps<TId>) {
  return (
    <div className="flex flex-col gap-3">
      {/* Built-in add section (suppressed when hideAddFieldSection=true) */}
      {!hideAddFieldSection && (
        <FieldAddSection
          showAddField={showAddField}
          canShowAddFieldCta={canShowAddFieldCta && !disabled}
          addingFieldName={addingFieldName}
          addingFieldType={addingFieldType}
          addingFieldRequired={addingFieldRequired}
          addingOptions={addingOptions}
          addConfirmDisabled={addConfirmDisabled}
          onAddingFieldNameChange={onAddingFieldNameChange}
          onAddingFieldTypeChange={onAddingFieldTypeChange}
          onAddingFieldRequiredChange={onAddingFieldRequiredChange}
          onAddingOptionsChange={onAddingOptionsChange}
          onOpenAddField={onOpenAddField}
          onCloseAddField={onCloseAddField}
          onAddField={onAddField}
        />
      )}

      {/* Fields list */}
      <div className="flex flex-col gap-3">
        {fields.map((field) => {
          const config = fieldTypeConfig[field.field_type] ?? fieldTypeConfig.text
          const TypeIcon = config.icon
          const isEditing = editingFieldId === field.id
          const isExpanded = expandedFields.has(field.id)
          const isSelect = field.field_type === "select"

          return (
            <div
              key={String(field.id)}
              className="rounded-lg bg-muted/20 overflow-hidden transition-colors shadow-lg"
            >
              {isEditing ? (
                <>
                  <div className="px-3 h-15 flex items-center hover:bg-muted/30">
                    <FieldRow
                      name={editingFieldName}
                      onNameChange={onEditingFieldNameChange}
                      fieldType={editingFieldType}
                      onTypeChange={(t) => {
                        onEditingFieldTypeChange(t)
                        if (t !== "select") onEditingOptionsChange([])
                      }}
                      isRequired={editingFieldRequired}
                      onRequiredChange={onEditingFieldRequiredChange}
                      onConfirm={() => onConfirmEditField(field.id)}
                      onCancel={onCancelEditField}
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
                    onOptionsChange={onEditingOptionsChange}
                    fieldType={editingFieldType}
                  />
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3 px-3 h-15 hover:bg-muted/30 transition-colors">
                    {isSelect ? (
                      <button
                        type="button"
                        onClick={() => onToggleExpandField(field.id)}
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
                      onClick={isSelect ? () => onToggleExpandField(field.id) : undefined}
                    >
                      <p className="text-sm font-medium truncate">{field.name}</p>

                      {isSelect && (
                        <Tooltip delayDuration={1000}>
                          <TooltipTrigger className="flex items-center shrink-0">
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 gap-1">
                              <IconList className="size-2.5" />
                              {field.options?.length ?? 0}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent side="bottom">
                            <div className="flex flex-col text-left">
                              {field.options?.map((opt, idx) => (
                                <div key={idx}>
                                  {opt}
                                </div>
                              ))}
                            </div>
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

                    {!disabled && (
                      <div className="flex items-center gap-0 shrink-0">
                        {kebabMenu ? (<DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="size-9 p-0 text-muted-foreground hover:text-foreground"
                              title="More options"
                            >
                              <IconDotsVertical className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => onStartEditField(field)}>
                              <IconEdit className="size-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onRequestDeleteField(field)} className="text-destructive">
                              <IconTrash className="size-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>) : (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="size-9 p-0 text-muted-foreground hover:text-foreground"
                              onClick={() => onStartEditField(field)}
                              title="Edit field"
                            >
                              <IconEdit className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="size-9 p-0 text-muted-foreground hover:text-destructive"
                              onClick={() => onRequestDeleteField(field)}
                              title="Delete field"
                            >
                              <IconTrash className="size-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Expanded read-only options */}
                  {isSelect && isExpanded && (
                    <div className="border-t border-input/50 bg-muted/5 p-4 gap-2 flex flex-wrap">
                      {(field.options ?? []).map((opt, idx) => (
                        <Badge key={idx} variant={"secondary"}>
                          {opt}
                        </Badge>
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

        <FieldEmptyState
          fieldsCount={fields.length}
          showAddField={showAddField}
          canShowAddFieldCta={canShowAddFieldCta && !disabled}
          onOpenAddField={onOpenAddField}
        />
      </div>
    </div>
  )
}
