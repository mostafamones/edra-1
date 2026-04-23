export function createDraftId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function reorderByIds<T extends { id: string }>(items: T[], orderedIds: string[]) {
  const itemMap = new Map(items.map((item) => [item.id, item]))
  const orderedItems = orderedIds
    .map((id) => itemMap.get(id))
    .filter((item): item is T => item !== undefined)
  const includedIds = new Set(orderedIds)
  const remainingItems = items.filter((item) => !includedIds.has(item.id))

  return [...orderedItems, ...remainingItems]
}
