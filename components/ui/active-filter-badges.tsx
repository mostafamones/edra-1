"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { IconX } from "@tabler/icons-react"

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface ActiveFilter {
  id: string
  label: string
  value: string
}

export interface ActiveFilterBadgesProps {
  filters: ActiveFilter[]
  onRemove: (id: string) => void
  onClearAll: () => void
  clearAllLabel?: string
  showClearAll?: boolean
}

// ─────────────────────────────────────────────────────────────────────────────
// ActiveFilterBadges Component
// ─────────────────────────────────────────────────────────────────────────────

export function ActiveFilterBadges({
  filters,
  onRemove,
  onClearAll,
  clearAllLabel = "Clear filters",
  showClearAll = true,
}: ActiveFilterBadgesProps) {
  if (filters.length === 0) return null

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {filters.map((filter) => (
        <Badge key={filter.id} variant="secondary" className="gap-1 text-xs pl-2 pr-1">
          {filter.label}: {filter.value}
          <button
            onClick={() => onRemove(filter.id)}
            className="ml-0.5 hover:text-foreground"
            aria-label={`Remove ${filter.label} filter`}
          >
            <IconX className="size-3" />
          </button>
        </Badge>
      ))}
      {showClearAll && (
        <button
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          onClick={onClearAll}
        >
          {clearAllLabel}
        </button>
      )}
    </div>
  )
}
