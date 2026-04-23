import {
  IconBlocks,
  IconBuilding,
  IconForms,
  IconSparkles,
  IconUsers,
} from "@tabler/icons-react"

import type { AcademyCreateDraft, AcademyDraftField, AcademyDraftLevel } from "./types"

export const DRAFT_STORAGE_KEY = "edra_academy_draft_v1"

export const WIZARD_STEPS = [
  { id: 1, title: "Basics" },
  { id: 2, title: "Structure" },
  { id: 3, title: "Fields" },
  { id: 4, title: "Finalize" },
] as const

// Backwards-compatible alias while callers migrate.
export const STEPS = WIZARD_STEPS

export const CREATION_STEPS = [
  {
    id: "academy",
    label: "Creating your academy workspace",
    icon: IconBuilding,
    durationMs: 600,
  },
  {
    id: "structure",
    label: "Building level structure",
    icon: IconBlocks,
    durationMs: 700,
  },
  {
    id: "groups",
    label: "Setting up groups",
    icon: IconUsers,
    durationMs: 500,
  },
  {
    id: "fields",
    label: "Configuring custom fields",
    icon: IconForms,
    durationMs: 600,
  },
  {
    id: "done",
    label: "Finalizing everything",
    icon: IconSparkles,
    durationMs: 400,
  },
] as const

export const DEFAULT_STRUCTURE_LEVELS: AcademyDraftLevel[] = [
  { id: "level-ref-1", name: "Level 1", color: "sky", groups: [] },
  {
    id: "level-ref-2",
    name: "Level 2",
    color: "violet",
    groups: [
      { id: "group-ref-a", name: "Section A" },
      { id: "group-ref-b", name: "Section B" },
    ],
  },
]

export const DEFAULT_FIELDS: AcademyDraftField[] = [
  {
    id: "field-default-birthday",
    name: "Birthday",
    field_type: "date",
    is_required: false,
  },
  {
    id: "field-default-parent-contact",
    name: "Parent Contact",
    field_type: "phone",
    is_required: false,
  },
]

export const DEFAULT_ACADEMY_DRAFT: AcademyCreateDraft = {
  name: "",
  slug: "",
  icon: "school",
  subject: "",
  levels: DEFAULT_STRUCTURE_LEVELS,
  fields: DEFAULT_FIELDS,
}