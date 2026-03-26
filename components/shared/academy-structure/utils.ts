import { DEFAULT_LEVEL_COLOR_ID, LEVEL_COLOR_PRESETS, MAX_EXPANDED_LEVELS } from "./constants"

export function swatchClassForColorId(colorId: string | undefined | null) {
  return (
    LEVEL_COLOR_PRESETS.find((p) => p.id === colorId)?.swatchClass ??
    LEVEL_COLOR_PRESETS.find((p) => p.id === DEFAULT_LEVEL_COLOR_ID)!.swatchClass
  )
}

export function expandLevelWithCap<T>(prev: Set<T>, levelId: T): Set<T> {
  const next = new Set(prev)
  if (next.has(levelId)) return next
  next.add(levelId)
  while (next.size > MAX_EXPANDED_LEVELS) {
    const oldest = next.keys().next().value
    if (oldest === undefined) break
    next.delete(oldest)
  }
  return next
}
