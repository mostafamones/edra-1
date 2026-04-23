import React from "react"
import { IconAbc } from "@tabler/icons-react"

// ═══════════════════════════════════════════════════════════════════════════
// CONTEXT — lets all sub-components access field type registry
// ═══════════════════════════════════════════════════════════════════════════

import type { FieldTypeDef } from "./types"

interface FieldEditorContextValue {
  fieldTypes: Record<string, FieldTypeDef>
}

export const FieldEditorContext = React.createContext<FieldEditorContextValue | null>(null)

export function useFieldTypes() {
  const ctx = React.useContext(FieldEditorContext)
  if (!ctx) throw new Error("FieldEditor components must be wrapped in <FieldEditor>")
  return ctx.fieldTypes
}

export function resolveFieldType(types: Record<string, FieldTypeDef>, type: string): FieldTypeDef {
  return types[type] ?? { label: type, icon: IconAbc }
}