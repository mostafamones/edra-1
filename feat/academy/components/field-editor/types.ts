import { IconAbc } from "@tabler/icons-react"


// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface SelectOption {
  id: string
  label: string
}

export type FieldId = string | number

export interface FieldTypeDef {
  label: string
  icon: typeof IconAbc
  /** Optional renderer for type-specific config (e.g. options for select) */
  hasOptions?: boolean
}

/** Generic field shape. TType lets you extend with custom field types. */
export interface CustomField<TId extends FieldId = string, TType extends string = string> {
  id: TId
  name: string
  field_type: TType
  is_required: boolean
  options?: string[]
}

/** Grouped state for adding a new field. */
export interface AddFieldState {
  name: string
  fieldType: string
  isRequired: boolean
  options: SelectOption[]
  isOpen: boolean
}

/** Grouped handlers for adding a new field. */
export interface AddFieldHandlers {
  onNameChange: (v: string) => void
  onTypeChange: (v: string) => void
  onRequiredChange: (v: boolean) => void
  onOptionsChange: (v: SelectOption[]) => void
  onOpen: () => void
  onClose: () => void
  onConfirm: () => void
}

/** Grouped state for editing an existing field. */
export interface EditFieldState<TId extends FieldId> {
  fieldId: TId | null
  name: string
  fieldType: string
  isRequired: boolean
  options: SelectOption[]
}

/** Grouped handlers for editing a field. */
export interface EditFieldHandlers<TId extends FieldId> {
  onStart: (field: CustomField<TId>) => void
  onCancel: () => void
  onConfirm: (fieldId: TId) => void
  onNameChange: (v: string) => void
  onTypeChange: (v: string) => void
  onRequiredChange: (v: boolean) => void
  onOptionsChange: (v: SelectOption[]) => void
}

// ═══════════════════════════════════════════════════════════════════════════
// OptionsPanel — for select-type fields
// ═══════════════════════════════════════════════════════════════════════════

export interface OptionsPanelProps {
  options: SelectOption[]
  onOptionsChange: (next: SelectOption[]) => void
  fieldType: string
  className?: string
}

export interface OptionRowProps {
  option: SelectOption
  isEditing: boolean
  editingValue: string
  onEditingValueChange: (v: string) => void
  onStartEdit: () => void
  onCommitEdit: () => void
  onCommitAndNext: () => void
  onCancelEdit: () => void
  onRemove: () => void
}

// ═══════════════════════════════════════════════════════════════════════════
// FieldRow — the inline add/edit form
// ═══════════════════════════════════════════════════════════════════════════

export interface FieldTypePopoverProps {
  value: string
  onChange: (v: string) => void
  className?: string
}

export interface FieldRowProps {
  name: string
  onNameChange: (v: string) => void
  fieldType: string
  onTypeChange: (v: string) => void
  isRequired: boolean
  onRequiredChange: (v: boolean) => void
  onConfirm: () => void
  onCancel: () => void
  confirmDisabled: boolean
  confirmTooltip?: string
  autoFocus?: boolean
  className?: string
}