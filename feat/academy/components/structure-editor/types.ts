// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type StructureId = string | number

export interface StructureGroup<TId extends StructureId = string> {
  id: TId
  name: string
}

export interface StructureLevel<TId extends StructureId = string> {
  id: TId
  name: string
  color?: string | null
  groups: StructureGroup<TId>[]
}

// ── Grouped state for adding a level ──────────────────────────────────────────

export interface AddLevelState {
  name: string
  color: string
  isOpen: boolean
}

export interface AddLevelHandlers {
  onNameChange: (v: string) => void
  onColorChange: (v: string) => void
  onOpen: () => void
  onClose: () => void
  onConfirm: () => void
}

// ── Grouped state for editing a level ─────────────────────────────────────────

export interface EditLevelState<TId extends StructureId> {
  levelId: TId | null
  name: string
  color: string
}

export interface EditLevelHandlers<TId extends StructureId> {
  onStart: (level: StructureLevel<TId>) => void
  onCancel: () => void
  onConfirm: (levelId: TId) => void
  onNameChange: (v: string) => void
  onColorChange: (v: string) => void
}

// ── Grouped state for adding a group ──────────────────────────────────────────

export interface AddGroupState<TId extends StructureId> {
  levelId: TId | null
  name: string
}

export interface AddGroupHandlers<TId extends StructureId> {
  onStart: (levelId: TId) => void
  onCancel: () => void
  onConfirm: (levelId: TId) => void
  onNameChange: (v: string) => void
}

// ── Grouped state for editing a group ─────────────────────────────────────────

export interface EditGroupState<TId extends StructureId> {
  groupId: TId | null
  name: string
}

export interface EditGroupHandlers<TId extends StructureId> {
  onStart: (group: StructureGroup<TId>) => void
  onCancel: () => void
  onConfirm: (levelId: TId, groupId: TId) => void
  onNameChange: (v: string) => void
}

// ── Delete handlers with optional confirmation ────────────────────────────────

export interface DeleteHandlers<TId extends StructureId> {
  onDeleteLevel: (levelId: TId) => void
  onDeleteGroup: (levelId: TId, groupId: TId) => void
  onRequestDeleteLevel?: (levelId: TId, proceed: () => void) => void
  onRequestDeleteGroup?: (levelId: TId, groupId: TId, proceed: () => void) => void
}

// ── Disabled-state predicates ─────────────────────────────────────────────────

export interface StructureDisabledPredicates<TId extends StructureId> {
  isLevelDeleteDisabled?: (levelId: TId) => boolean
  isLevelUpdateDisabled?: (level: StructureLevel<TId>) => boolean
  isGroupUpdateDisabled?: (group: StructureGroup<TId>) => boolean
  isGroupDeleteDisabled?: (groupId: TId) => boolean
  isGroupAddDisabled?: (levelId: TId) => boolean
}
