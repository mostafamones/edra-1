"use client"

import {
  PageToolbarGroup,
} from "@/components/shell"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { DataTableFilterPopover } from "@/components/ui/data-table-filter-popover"
import { DraggableColumnDropdown } from "@/components/ui/draggable-column-dropdown"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { ColumnDef, ColumnOrderState, VisibilityState } from "@tanstack/react-table"

import type { StudentField, StudentWithLevelRating } from "@/lib/types"

interface StudentViewFiltersProps<TRow extends StudentWithLevelRating> {
  activeFilterCount: number
  availableGroups: Array<{ id: number; name: string }>
  availableLevels: Array<{ id: number; name: string }>
  availableSchedules: Array<{ id: number; name: string }>
  columnOrder: ColumnOrderState
  columnVisibility: VisibilityState
  columns: ColumnDef<TRow>[]
  fields: StudentField[]
  groupFilter: string
  levelFilter: string
  onClearFilters: () => void
  onColumnOrderChange: (order: ColumnOrderState) => void
  onToggleColumnVisibility: (columnId: string, visible: boolean) => void
  scheduleFilter: string
  setGroupFilter: (value: string) => void
  setLevelFilter: (value: string) => void
  setScheduleFilter: (value: string) => void
  setShowArchived: (value: boolean) => void
  showArchived: boolean
}

export function StudentViewFilters<TRow extends StudentWithLevelRating>({
  activeFilterCount,
  availableGroups,
  availableLevels,
  availableSchedules,
  columnOrder,
  columnVisibility,
  columns,
  fields,
  groupFilter,
  levelFilter,
  onClearFilters,
  onColumnOrderChange,
  onToggleColumnVisibility,
  scheduleFilter,
  setGroupFilter,
  setLevelFilter,
  setScheduleFilter,
  setShowArchived,
  showArchived,
}: StudentViewFiltersProps<TRow>) {
  return (
    <PageToolbarGroup>
      <DataTableFilterPopover
        activeFilterCount={activeFilterCount}
        onClear={onClearFilters}
        iconOnly
        tooltip="Filters"
        triggerSize="icon"
      >
        <Select
          value={levelFilter}
          onValueChange={(value) => {
            setLevelFilter(value)
            setGroupFilter("all")
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            {availableLevels.map((level) => (
              <SelectItem key={level.id} value={level.id.toString()}>
                {level.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="w-full">
                <Select
                  value={groupFilter}
                  onValueChange={setGroupFilter}
                  disabled={levelFilter === "all" || availableGroups.length === 0}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Group" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Groups</SelectItem>
                    {availableGroups.map((group) => (
                      <SelectItem key={group.id} value={group.id.toString()}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </TooltipTrigger>
            {levelFilter === "all" && (
              <TooltipContent>
                <p>Select a level first</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="w-full">
                <Select
                  value={scheduleFilter}
                  onValueChange={setScheduleFilter}
                  disabled={levelFilter === "all"}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Schedule" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Schedules</SelectItem>
                    {availableSchedules.map((schedule) => (
                      <SelectItem key={schedule.id} value={schedule.id.toString()}>
                        {schedule.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </TooltipTrigger>
            {levelFilter === "all" && (
              <TooltipContent>
                <p>Select a level first</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>

        <div className="flex items-center justify-between py-1">
          <Label htmlFor="students-show-archived" className="cursor-pointer text-sm">
            Show Archived
          </Label>
          <Switch
            id="students-show-archived"
            checked={showArchived}
            onCheckedChange={setShowArchived}
            size="sm"
          />
        </div>
      </DataTableFilterPopover>

      <DraggableColumnDropdown
        columns={columns}
        columnVisibility={columnVisibility}
        onToggleColumn={(columnId, visible) => onToggleColumnVisibility(columnId, visible)}
        columnOrder={columnOrder}
        onColumnOrderChange={onColumnOrderChange}
        fixedStartColumns={["select", "full_name"]}
        fixedEndColumns={["actions"]}
        getColumnName={(id) => {
          const field = fields.find((item) => `field_${item.id}` === id)
          return field ? field.name : id.replace(/_/g, " ")
        }}
        iconOnly
        tooltip="Columns"
        triggerSize="icon"
      />
    </PageToolbarGroup>
  )
}
