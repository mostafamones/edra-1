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
}: DataTableFilterPopoverProps) {
  const hasActiveFilters = activeFilterCount > 0

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn("gap-2 h-10", hasActiveFilters && "bg-primary/90 hover:bg-primary", className)}
        >
          <IconFilter className="size-4" />
          {label}
          {hasActiveFilters && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white/10 px-1.5 text-xs font-medium text-foreground">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
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
