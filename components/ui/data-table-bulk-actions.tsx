"use client"

import { forwardRef, type ComponentType } from "react"
import { Button, buttonVariants } from "@/components/ui/button"
import type { VariantProps } from "class-variance-authority"

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface BulkAction {
  label: string
  icon?: ComponentType<{ className?: string }>
  onClick: () => void
  variant?: VariantProps<typeof buttonVariants>["variant"]
  disabled?: boolean
  loading?: boolean
}

export interface DataTableBulkActionsProps {
  selectedCount: number
  onClear: () => void
  actions: BulkAction[]
  label?: string
  className?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// DataTableBulkActions Component
// ─────────────────────────────────────────────────────────────────────────────

export const DataTableBulkActions = forwardRef<HTMLDivElement, DataTableBulkActionsProps>(
  ({ selectedCount, onClear, actions, label, className = "" }, ref) => {
    if (selectedCount === 0) return null

    const defaultLabel = `${selectedCount} selected`
    const displayLabel = label || defaultLabel

    return (
      <div
        ref={ref}
        className={`flex items-center gap-3 px-4 py-2.5 rounded-lg border bg-muted/30 animate-in fade-in slide-in-from-top-1 ${className}`}
      >
        <span className="text-sm font-medium">{displayLabel}</span>
        <div className="flex-1" />
        {actions.map((action, index) => {
          const Icon = action.icon
          return (
            <Button
              key={index}
              variant={action.variant || "outline"}
              size="sm"
              onClick={action.onClick}
              disabled={action.disabled || action.loading}
              className={`text-xs gap-1.5 ${action.variant === "destructive" ? "h-6.5 border-destructive bg-destructive/20 border-1 hover:bg-destructive/30" : "h-7"}`}
            >
              {Icon && <Icon className="size-3.5" />}
              {action.loading ? "Processing..." : action.label}
            </Button>
          )
        })}
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs"
          onClick={onClear}
        >
          Clear
        </Button>
      </div>
    )
  }
)

DataTableBulkActions.displayName = "DataTableBulkActions"
