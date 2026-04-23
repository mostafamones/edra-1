import * as React from "react"

interface StructureEditorContextValue {
  disabled: boolean
  kebabMenu: boolean
  showColorDot: boolean
  alwaysExpanded: boolean
}

const StructureEditorContext = React.createContext<StructureEditorContextValue | null>(null)

export function useStructureEditorContext() {
  const ctx = React.useContext(StructureEditorContext)
  if (!ctx) {
    throw new Error("Structure components must be wrapped in <StructureEditor>")
  }
  return ctx
}

export const StructureEditorProvider = StructureEditorContext.Provider
