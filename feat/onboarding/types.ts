export type AcademyFieldType =
  | "text"
  | "number"
  | "date"
  | "boolean"
  | "phone"
  | "select"

export interface AcademyDraftGroup {
  id: string
  name: string
}

export interface AcademyDraftLevel {
  id: string
  name: string
  color?: string | null
  groups: AcademyDraftGroup[]
}

export interface AcademyDraftField {
  id: string
  name: string
  field_type: AcademyFieldType
  is_required: boolean
  options?: string[]
}

export interface AcademyCreateDraft {
  name: string
  slug: string
  icon: string
  subject: string
  levels: AcademyDraftLevel[]
  fields: AcademyDraftField[]
}
