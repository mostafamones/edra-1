"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  IconForms,
  IconPlus,
  IconTrash,
  IconEdit,
  IconAbc,
  IconAsterisk,
  IconChevronDown,
  IconChevronRight,
  IconList,
  IconDotsVertical,
  IconPhone,
  IconCursorText,
  IconHash,
  IconCalendar,
  IconToggleLeft,
} from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { FieldEditorContext, useFieldTypes, resolveFieldType } from "./context"
import { FieldRow } from "./field-row"          
import { OptionsPanel } from "./options-panel"
import { AddFieldState, AddFieldHandlers, EditFieldState, EditFieldHandlers, CustomField, FieldId, FieldTypeDef } from "./types"

export const defaultFieldTypes: Record<string, FieldTypeDef> = {
  text: { label: "Text", icon: IconCursorText },
  number: { label: "Number", icon: IconHash },
  date: { label: "Date", icon: IconCalendar },
  boolean: { label: "Yes / No", icon: IconToggleLeft },
  phone: { label: "Phone", icon: IconPhone },
  select: { label: "Select", icon: IconList, hasOptions: true },
}

// ═══════════════════════════════════════════════════════════════════════════
// FieldAddSection — inline add form or CTA button
// ═══════════════════════════════════════════════════════════════════════════

interface FieldAddSectionProps {
  state: AddFieldState
  handlers: AddFieldHandlers
  confirmDisabled: boolean
  canShowCta: boolean
  className?: string
}

export function FieldAddSection({
  state,
  handlers,
  confirmDisabled,
  canShowCta,
  className,
}: FieldAddSectionProps) {
  const fieldTypes = useFieldTypes()

  if (state.isOpen) {
    const typeDef = fieldTypes[state.fieldType]
    const needsOptions = typeDef?.hasOptions && state.options.length < 2

    return (
      <div
        className={cn(
          "rounded-lg border border-primary/30 bg-primary/5 overflow-hidden",
          className
        )}
      >
        <div className="px-3 h-15 flex items-center">
          <FieldRow
            name={state.name}
            onNameChange={handlers.onNameChange}
            fieldType={state.fieldType}
            onTypeChange={(t) => {
              handlers.onTypeChange(t)
              handlers.onOptionsChange([])
            }}
            isRequired={state.isRequired}
            onRequiredChange={handlers.onRequiredChange}
            onConfirm={handlers.onConfirm}
            onCancel={handlers.onClose}
            confirmDisabled={confirmDisabled}
            confirmTooltip={
              needsOptions ? "Select fields need at least 2 options" : undefined
            }
          />
        </div>
        <OptionsPanel
          options={state.options}
          onOptionsChange={handlers.onOptionsChange}
          fieldType={state.fieldType}
        />
      </div>
    )
  }

  if (!canShowCta) return null
  return (
    <div className={cn("flex items-center justify-center h-15", className)}>
      <Button
        variant="outline"
        onClick={handlers.onOpen}
        className="gap-1.5 h-10 w-full"
      >
        <IconPlus className="size-5" />
        Add Field
      </Button>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// FieldAddButton — compact toolbar variant
// ═══════════════════════════════════════════════════════════════════════════

interface FieldAddButtonProps {
  onClick: () => void
  disabled?: boolean
  className?: string
}

export function FieldAddButton({ onClick, disabled = false, className }: FieldAddButtonProps) {
  return (
    <Button
      variant="outline"
      className={cn("gap-1 h-8 px-3 text-sm", className)}
      onClick={onClick}
      disabled={disabled}
    >
      <IconPlus className="size-3.5" />
      Add Field
    </Button>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// FieldEmptyState
// ═══════════════════════════════════════════════════════════════════════════

interface FieldEmptyStateProps {
  showCta: boolean
  onOpenAddField: () => void
  className?: string
}

export function FieldEmptyState({ showCta, onOpenAddField, className }: FieldEmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 py-12 text-muted-foreground",
        className
      )}
    >
      <IconForms className="size-10 opacity-40" />
      <p className="text-sm">No custom fields yet.</p>
      {showCta && (
        <Button variant="outline" size="sm" onClick={onOpenAddField}>
          <IconPlus className="size-4 mr-1" />
          Create your first field
        </Button>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// FieldItem — single row in the list (read or edit mode)
// ═══════════════════════════════════════════════════════════════════════════

interface FieldItemProps<TId extends FieldId> {
  field: CustomField<TId>
  isEditing: boolean
  isExpanded: boolean
  editState: EditFieldState<TId>
  editHandlers: EditFieldHandlers<TId>
  editConfirmDisabled: boolean
  onToggleExpand: () => void
  onRequestDelete: () => void
  disabled: boolean
  kebabMenu: boolean
  className?: string
}

function FieldItem<TId extends FieldId>({
  field,
  isEditing,
  isExpanded,
  editState,
  editHandlers,
  editConfirmDisabled,
  onToggleExpand,
  onRequestDelete,
  disabled,
  kebabMenu,
  className,
}: FieldItemProps<TId>) {
  const fieldTypes = useFieldTypes()
  const config = resolveFieldType(fieldTypes, field.field_type)
  const TypeIcon = config.icon
  const hasOptions = !!config.hasOptions

  return (
    <Card className="p-0 gap-0 shadow-sm">
      {isEditing ? (
        <FieldItemEdit
          editState={editState}
          editHandlers={editHandlers}
          editConfirmDisabled={editConfirmDisabled}
          fieldId={field.id}
        />
      ) : (
        <FieldItemDisplay
          field={field}
          typeIcon={TypeIcon}
          typeLabel={config.label}
          hasOptions={hasOptions}
          isExpanded={isExpanded}
          onToggleExpand={onToggleExpand}
          onStartEdit={() => editHandlers.onStart(field)}
          onRequestDelete={onRequestDelete}
          disabled={disabled}
          kebabMenu={kebabMenu}
        />
      )}
    </Card>
  )
}

// ── Display mode ──────────────────────────────────────────────────────────────

interface FieldItemDisplayProps<TId extends FieldId> {
  field: CustomField<TId>
  typeIcon: typeof IconAbc
  typeLabel: string
  hasOptions: boolean
  isExpanded: boolean
  onToggleExpand: () => void
  onStartEdit: () => void
  onRequestDelete: () => void
  disabled: boolean
  kebabMenu: boolean
}

function FieldItemDisplay<TId extends FieldId>({
  field,
  typeIcon: TypeIcon,
  typeLabel,
  hasOptions,
  isExpanded,
  onToggleExpand,
  onStartEdit,
  onRequestDelete,
  disabled,
  kebabMenu,
}: FieldItemDisplayProps<TId>) {
  return (
    <CardContent className="p-0 gap-0 px-0">
      <div className="flex items-center gap-3 px-3 h-15 hover:bg-muted/30 transition-colors">
        {hasOptions ? (
          <button
            type="button"
            onClick={onToggleExpand}
            className="flex items-center justify-center size-9 rounded-md bg-muted/40 shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          >
            {isExpanded ? (
              <IconChevronDown className="size-4" />
            ) : (
              <IconChevronRight className="size-4" />
            )}
          </button>
        ) : (
          <Tooltip delayDuration={1000}>
            <TooltipTrigger asChild>
              <div className="flex items-center justify-center size-9 rounded-md bg-muted/40 shrink-0 cursor-default">
                <TypeIcon className="size-4 text-muted-foreground" />
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom">{typeLabel}</TooltipContent>
          </Tooltip>
        )}

        <div
          className={cn("flex-1 flex items-center gap-2 min-w-0", hasOptions && "cursor-pointer")}
          onClick={hasOptions ? onToggleExpand : undefined}
        >
          <p className="text-sm font-medium truncate">{field.name}</p>

          {hasOptions && (
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
                    <div key={idx}>{opt}</div>
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
              <TooltipContent side="bottom">
                This field will be required on the student form
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {!disabled && (
          <FieldItemActions
            kebabMenu={kebabMenu}
            onEdit={onStartEdit}
            onDelete={onRequestDelete}
          />
        )}
      </div>

      {hasOptions && isExpanded && (
        <div className="border-t border-input/50 bg-muted/5 p-4 gap-2 flex flex-wrap">
          {(field.options ?? []).map((opt, idx) => (
            <Badge key={idx} variant="secondary">
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
    </CardContent>
  )
}

// ── Edit mode ─────────────────────────────────────────────────────────────────

interface FieldItemEditProps<TId extends FieldId> {
  fieldId: TId
  editState: EditFieldState<TId>
  editHandlers: EditFieldHandlers<TId>
  editConfirmDisabled: boolean
}

function FieldItemEdit<TId extends FieldId>({
  fieldId,
  editState,
  editHandlers,
  editConfirmDisabled,
}: FieldItemEditProps<TId>) {
  const fieldTypes = useFieldTypes()
  const typeDef = fieldTypes[editState.fieldType]
  const needsOptions = typeDef?.hasOptions && editState.options.length < 2

  return (
    <>
      <div className="px-3 h-15 flex items-center hover:bg-muted/30">
        <FieldRow
          name={editState.name}
          onNameChange={editHandlers.onNameChange}
          fieldType={editState.fieldType}
          onTypeChange={(t) => {
            editHandlers.onTypeChange(t)
            if (!fieldTypes[t]?.hasOptions) editHandlers.onOptionsChange([])
          }}
          isRequired={editState.isRequired}
          onRequiredChange={editHandlers.onRequiredChange}
          onConfirm={() => editHandlers.onConfirm(fieldId)}
          onCancel={editHandlers.onCancel}
          confirmDisabled={editConfirmDisabled}
          confirmTooltip={
            needsOptions ? "Select fields need at least 2 options" : undefined
          }
        />
      </div>
      <OptionsPanel
        options={editState.options}
        onOptionsChange={editHandlers.onOptionsChange}
        fieldType={editState.fieldType}
      />
    </>
  )
}

// ── Item actions (edit/delete buttons or kebab menu) ──────────────────────────

interface FieldItemActionsProps {
  kebabMenu: boolean
  onEdit: () => void
  onDelete: () => void
}

function FieldItemActions({ kebabMenu, onEdit, onDelete }: FieldItemActionsProps) {
  if (kebabMenu) {
    return (
      <DropdownMenu>
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
          <DropdownMenuItem onClick={onEdit}>
            <IconEdit className="size-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onDelete} className="text-destructive">
            <IconTrash className="size-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <div className="flex items-center gap-0 shrink-0">
      <Button
        variant="ghost"
        size="sm"
        className="size-9 p-0 text-muted-foreground hover:text-foreground"
        onClick={onEdit}
        title="Edit field"
      >
        <IconEdit className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="size-9 p-0 text-muted-foreground hover:text-destructive"
        onClick={onDelete}
        title="Delete field"
      >
        <IconTrash className="size-4" />
      </Button>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// FieldEditor — the top-level component (provides context)
// ═══════════════════════════════════════════════════════════════════════════

export interface FieldEditorProps<TId extends FieldId> {
  fields: CustomField<TId>[]
  expandedFields: Set<TId>
  onToggleExpandField: (fieldId: TId) => void
  onRequestDeleteField: (field: CustomField<TId>) => void

  addState: AddFieldState
  addHandlers: AddFieldHandlers
  addConfirmDisabled: boolean

  editState: EditFieldState<TId>
  editHandlers: EditFieldHandlers<TId>
  editConfirmDisabled: boolean

  /** Override or extend the available field types. Defaults to `defaultFieldTypes`. */
  fieldTypes?: Record<string, FieldTypeDef>
  disabled?: boolean
  canShowAddFieldCta?: boolean
  /** Hide the built-in add section to render one yourself elsewhere. */
  hideAddSection?: boolean
  /** Use kebab menu instead of inline edit/delete buttons. */
  kebabMenu?: boolean

  // Style escape hatches
  className?: string
  listClassName?: string
  itemClassName?: string
  addSectionClassName?: string
  emptyStateClassName?: string
}

export function FieldEditor<TId extends FieldId>({
  fields,
  expandedFields,
  onToggleExpandField,
  onRequestDeleteField,
  addState,
  addHandlers,
  addConfirmDisabled,
  editState,
  editHandlers,
  editConfirmDisabled,
  fieldTypes = defaultFieldTypes,
  disabled = false,
  canShowAddFieldCta = true,
  hideAddSection = false,
  kebabMenu = false,
  className,
  listClassName,
  itemClassName,
  addSectionClassName,
  emptyStateClassName,
}: FieldEditorProps<TId>) {
  const ctx = React.useMemo(() => ({ fieldTypes }), [fieldTypes])
  const showEmptyState = fields.length === 0 && !addState.isOpen

  return (
    <FieldEditorContext.Provider value={ctx}>
      <div className={cn("flex flex-col gap-3", className)}>
        {!hideAddSection && (
          <FieldAddSection
            state={addState}
            handlers={addHandlers}
            confirmDisabled={addConfirmDisabled}
            canShowCta={canShowAddFieldCta && !disabled}
            className={addSectionClassName}
          />
        )}

        <div className={cn("flex flex-col gap-3", listClassName)}>
          {fields.map((field) => (
            <FieldItem
              key={String(field.id)}
              field={field}
              isEditing={editState.fieldId === field.id}
              isExpanded={expandedFields.has(field.id)}
              editState={editState}
              editHandlers={editHandlers}
              editConfirmDisabled={editConfirmDisabled}
              onToggleExpand={() => onToggleExpandField(field.id)}
              onRequestDelete={() => onRequestDeleteField(field)}
              disabled={disabled}
              kebabMenu={kebabMenu}
              className={itemClassName}
            />
          ))}

          {showEmptyState && (
            <FieldEmptyState
              showCta={canShowAddFieldCta && !disabled}
              onOpenAddField={addHandlers.onOpen}
              className={emptyStateClassName}
            />
          )}
        </div>
      </div>
    </FieldEditorContext.Provider>
  )
}