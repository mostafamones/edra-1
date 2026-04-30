"use client"

import { useMemo } from "react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { IconFilter } from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "./badge"

// ─── Types ──────────────────────────────────────────────

export interface DataTableFilterPopoverProps {
  /** The active filter count displayed on the badge */
  activeFilterCount: number
  /** Optional custom label for the filter button (default: "Filter") */
  label?: string
  /** Filter controls rendered inside the popover content */
  children: React.ReactNode
  /** Handler for clearing all filters */
  onClear: () => void
  /** Optional custom class name */
  className?: string
  /** Whether to show the clear button (default: true) */
  showClear?: boolean
  /** Render a compact icon-only trigger */
  iconOnly?: boolean
  /** Tooltip label used for compact triggers */
  tooltip?: string
  /** Optional trigger size */
  triggerSize?: "sm" | "default" | "icon" | "icon-sm"
}

// ─── Component ──────────────────────────────────────────

/**
 * DataTableFilterPopover — Generic filter popover component for DataTables.
 *
 * @example
 * ```tsx
 * <DataTableFilterPopover
 *   activeFilterCount={getActiveFilterCount()}
 *   onClear={() => clearAllFilters()}
 * >
 *   <div className="space-y-3">
 *     <Select value={levelFilter} onValueChange={setLevelFilter}>
 *       <SelectTrigger><SelectValue placeholder="Level" /></SelectTrigger>
 *       <SelectContent>
 *         <SelectItem value="all">All Levels</SelectItem>
 *         {levels.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
 *       </SelectContent>
 *     </Select>
 *     <DatePicker />
 *   </div>
 * </DataTableFilterPopover>
 * ```
 */
export function DataTableFilterPopover({
  activeFilterCount,
  label = "Filter",
  children,
  onClear,
  className,
  showClear = true,
  iconOnly = false,
  tooltip,
  triggerSize = "default",
}: DataTableFilterPopoverProps) {
  const hasActiveFilters = activeFilterCount > 0
  const resolvedTriggerSize =
    iconOnly && hasActiveFilters
      ? "default"
      : iconOnly
        ? triggerSize
        : triggerSize === "icon-sm" || triggerSize === "icon"
          ? "default"
          : triggerSize

  const trigger = (
    <Button
      variant="outline"
      size={resolvedTriggerSize}
      className={cn(
        "shrink-0 gap-1.5",
        !iconOnly && "h-10",
        iconOnly && hasActiveFilters && "px-2",
        className
      )}
    >
      <IconFilter className="size-4" />
      {!iconOnly && label}
      {hasActiveFilters && (
        <Badge className="flex size-4 items-center justify-center rounded-full bg-white/10 px-1.5 text-[11px] font-medium text-foreground">
          {activeFilterCount}
        </Badge>
      )}
      {iconOnly && <span className="sr-only">{tooltip ?? label}</span>}
    </Button>
  )

  return (
    <Popover>
      {iconOnly && tooltip ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              {trigger}
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent>{tooltip}</TooltipContent>
        </Tooltip>
      ) : (
        <PopoverTrigger asChild>
          {trigger}
        </PopoverTrigger>
      )}
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Filters</span>
            {showClear && hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClear}
                className="h-7 text-xs"
              >
                Clear all
              </Button>
            )}
          </div>
          <div className="space-y-3">
            {children}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
