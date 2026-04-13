export const LEVEL_COLOR_PRESETS = [
  { id: "rose", swatchClass: "bg-rose-500" },
  { id: "orange", swatchClass: "bg-orange-500" },
  { id: "amber", swatchClass: "bg-amber-500" },
  { id: "lime", swatchClass: "bg-lime-500" },
  { id: "emerald", swatchClass: "bg-emerald-500" },
  { id: "sky", swatchClass: "bg-sky-500" },
  { id: "blue", swatchClass: "bg-blue-500" },
  { id: "violet", swatchClass: "bg-violet-500" },
  { id: "fuchsia", swatchClass: "bg-fuchsia-500" },
] as const

export const DEFAULT_LEVEL_COLOR_ID = LEVEL_COLOR_PRESETS[5].id
export const MAX_EXPANDED_LEVELS = 2
