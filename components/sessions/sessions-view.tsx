"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { format } from "date-fns"
import type { DateRange } from "react-day-picker"
import { toast } from "sonner"
import type { ColumnOrderState, RowSelectionState, VisibilityState } from "@tanstack/react-table"
import { IconCalendar, IconPlus } from "@tabler/icons-react"

import { SiteHeader } from "@/components/site-header"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { DataTableBulkActions } from "@/components/ui/data-table-bulk-actions"
import { ActiveFilterBadges, type ActiveFilter } from "@/components/ui/active-filter-badges"
import { DataTableFilterPopover } from "@/components/ui/data-table-filter-popover"
import { DraggableColumnDropdown } from "@/components/ui/draggable-column-dropdown"
import { Refresh } from "@/components/ui/refresh"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { withAcademyPath } from "@/components/helpers/sidebar"
import { useSessionFilters } from "@/lib/store"
import { encodeSessionId } from "@/lib/hashid"
import type { Group, Level, ScheduleWithRelations, SessionWithSchedule } from "@/lib/types"
import { useGroups, useLevels, useSchedules, useSessions } from "@/lib/hooks/use-data"

import { buildSessionColumns } from "./session-columns"
import { SessionDataTable } from "./session-data-table"
import { StartSessionForm } from "./start-session-form"

const COLUMN_VISIBILITY_KEY = "edra-sessions-column-visibility"
const COLUMN_ORDER_KEY = "edra-sessions-column-order"

const DEFAULT_HIDDEN: VisibilityState = {}

export interface SessionsViewProps {
  academyId: string
}

function toDateParam(d: Date) {
  return format(d, "yyyy-MM-dd")
}

export function SessionsView({ academyId }: SessionsViewProps) {
  const router = useRouter()
  const pathname = usePathname()

  const {
    levelFilter,
    groupFilter,
    scheduleFilter,
    dateRange,
    searchQuery,
    showArchived,
    setLevelFilter,
    setGroupFilter,
    setScheduleFilter,
    setDateRange,
    setSearchQuery,
    setShowArchived,
    resetFilters,
  } = useSessionFilters()

  const startDate = dateRange?.from ? toDateParam(dateRange.from) : undefined
  const endDate = dateRange?.to ? toDateParam(dateRange.to) : undefined

  const { data: rawSessions, loading: sessionsLoading, refresh: refreshSessions } = useSessions(academyId, { startDate, endDate })
  const { data: rawSchedules, loading: schedulesLoading } = useSchedules(academyId)
  const { data: rawGroups, loading: groupsLoading } = useGroups(academyId)
  const { data: rawLevels, loading: levelsLoading } = useLevels(academyId)

  const loading = sessionsLoading || schedulesLoading || groupsLoading || levelsLoading

  const schedules = (rawSchedules || []) as ScheduleWithRelations[]
  const groups = (rawGroups || []) as Group[]
  const levels = (rawLevels || []) as Level[]

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => {
    if (typeof window === "undefined") return DEFAULT_HIDDEN
    try {
      const saved = localStorage.getItem(COLUMN_VISIBILITY_KEY)
      return saved ? JSON.parse(saved) : DEFAULT_HIDDEN
    } catch {
      return DEFAULT_HIDDEN
    }
  })

  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>(() => {
    if (typeof window === "undefined") return []
    try {
      const saved = localStorage.getItem(COLUMN_ORDER_KEY)
      if (saved) {
        const parsed = JSON.parse(saved) as string[]
        const withoutFixed = parsed.filter((id) => id !== "actions" && id !== "select")
        return ["select", ...withoutFixed, "actions"]
      }
      return []
    } catch {
      return []
    }
  })

  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      localStorage.setItem(COLUMN_VISIBILITY_KEY, JSON.stringify(columnVisibility))
    } catch {
      // ignore
    }
  }, [columnVisibility])

  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      localStorage.setItem(COLUMN_ORDER_KEY, JSON.stringify(columnOrder))
    } catch {
      // ignore
    }
  }, [columnOrder])

  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})

  const sessions = useMemo(() => {
    const all = (rawSessions || []) as SessionWithSchedule[]
    const filteredByArchive = all.filter((s) => (showArchived ? true : s.status !== "archived"))

    return filteredByArchive
      .filter((s) => {
        if (levelFilter !== "all" && String(s.schedule?.level?.id ?? s.schedule?.level_id ?? "") !== levelFilter) return false
        if (groupFilter !== "all" && String(s.schedule?.group?.id ?? s.schedule?.group_id ?? "") !== groupFilter) return false
        if (scheduleFilter !== "all" && String(s.schedule_id) !== scheduleFilter) return false
        return true
      })
      .filter((s) => {
        if (!searchQuery.trim()) return true
        const q = searchQuery.toLowerCase()
        return (
          (s.name || "").toLowerCase().includes(q) ||
          (s.schedule?.name || "").toLowerCase().includes(q)
        )
      })
  }, [rawSessions, showArchived, levelFilter, groupFilter, scheduleFilter, searchQuery])

  const selectedSessionIds = useMemo(() => {
    return Object.keys(rowSelection)
      .filter((k) => rowSelection[k])
      .map((k) => sessions[Number(k)]?.id)
      .filter((id): id is number => typeof id === "number")
  }, [rowSelection, sessions])

  const availableLevels = useMemo(() => levels, [levels])
  const availableGroups = useMemo(() => {
    if (levelFilter === "all") return groups
    const levelId = Number(levelFilter)
    return groups.filter((g) => (g as any).level_id ? (g as any).level_id === levelId : true)
  }, [groups, levelFilter])
  const availableSchedules = useMemo(() => {
    if (levelFilter === "all") return schedules
    const levelId = Number(levelFilter)
    return schedules.filter((s) => s.level_id === levelId)
  }, [schedules, levelFilter])

  const activeFilters = useMemo<ActiveFilter[]>(() => {
    const items: ActiveFilter[] = []
    if (levelFilter !== "all") {
      items.push({
        id: "level",
        label: "Level",
        value: levels.find((l) => String(l.id) === levelFilter)?.name || levelFilter,
      })
    }
    if (groupFilter !== "all") {
      items.push({
        id: "group",
        label: "Group",
        value: groups.find((g) => String(g.id) === groupFilter)?.name || groupFilter,
      })
    }
    if (scheduleFilter !== "all") {
      items.push({
        id: "schedule",
        label: "Schedule",
        value: schedules.find((s) => String(s.id) === scheduleFilter)?.name || scheduleFilter,
      })
    }
    if (dateRange?.from || dateRange?.to) {
      items.push({
        id: "date",
        label: "Date",
        value: `${dateRange?.from ? format(dateRange.from, "MMM d") : "…"} - ${dateRange?.to ? format(dateRange.to, "MMM d") : "…"}`
      })
    }
    if (showArchived) {
      items.push({ id: "archived", label: "Archived", value: "Shown" })
    }
    return items
  }, [levelFilter, groupFilter, scheduleFilter, dateRange, showArchived, levels, groups, schedules])

  const activeFilterCount = activeFilters.length

  const [deleteTarget, setDeleteTarget] = useState<SessionWithSchedule | null>(null)
  const [archiveTarget, setArchiveTarget] = useState<SessionWithSchedule | null>(null)
  const [bulkArchiveOpen, setBulkArchiveOpen] = useState(false)
  const [isActioning, setIsActioning] = useState(false)
  const [startOpen, setStartOpen] = useState(false)

  const openStartSession = useCallback(() => {
    setStartOpen(true)
  }, [])

  const goToDetails = useCallback((s: SessionWithSchedule) => {
    router.push(withAcademyPath(pathname, `/sessions/${encodeSessionId(s.id)}`))
  }, [router, pathname])

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return
    setIsActioning(true)
    try {
      const res = await fetch(`/api/sessions/${deleteTarget.id}`, { method: "DELETE" })
      if (!res.ok) {
        const errBody = await res.json().catch(() => null)
        throw new Error(errBody?.error || errBody?.details || "Failed to delete session")
      }
      toast.success("Session deleted")
      setDeleteTarget(null)
      refreshSessions()
    } catch (err: any) {
      toast.error(err?.message || "Could not delete session")
    } finally {
      setIsActioning(false)
    }
  }, [deleteTarget, refreshSessions])

  const handleArchiveToggle = useCallback(async () => {
    if (!archiveTarget) return
    setIsActioning(true)
    try {
      const isArchived = archiveTarget.status === "archived"
      const res = await fetch(`/api/sessions/${archiveTarget.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: isArchived ? "live" : "archived" }),
      })
      if (!res.ok) {
        const errBody = await res.json().catch(() => null)
        throw new Error(errBody?.error || errBody?.details || "Failed to update session")
      }
      toast.success(isArchived ? "Unarchived" : "Archived")
      setArchiveTarget(null)
      refreshSessions()
    } catch (err: any) {
      toast.error(err?.message || "Could not update session")
    } finally {
      setIsActioning(false)
    }
  }, [archiveTarget, refreshSessions])

  const handleBulkArchive = useCallback(async () => {
    if (selectedSessionIds.length === 0) return
    setIsActioning(true)
    try {
      await Promise.all(
        selectedSessionIds.map((id) =>
          fetch(`/api/sessions/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "archived" }),
          })
        )
      )
      toast.success(`Archived ${selectedSessionIds.length} session(s)`)
      setBulkArchiveOpen(false)
      setRowSelection({})
      refreshSessions()
    } catch (err: any) {
      toast.error(err?.message || "Failed to archive sessions")
    } finally {
      setIsActioning(false)
    }
  }, [selectedSessionIds, refreshSessions])

  const columns = useMemo(
    () =>
      buildSessionColumns({
        onView: goToDetails,
        onDelete: setDeleteTarget,
        onArchive: setArchiveTarget,
      }),
    [goToDetails]
  )

  const headerActions = (
    <div className="flex items-center gap-2">
      <Refresh func={refreshSessions} variant="ghost" />
      <Button variant="ghost" className="gap-1.5" onClick={openStartSession}>
        <IconPlus className="size-4" />
        Start Session
      </Button>
    </div>
  )

  return (
    <>
      <SiteHeader
        title="Sessions"
        subtitle="Track attendance and session history"
        actions={headerActions}
      />

      <div className="p-4 lg:p-6 space-y-4">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search sessions..."
                disabled={loading}
                className="max-w-lg"
              />
            </div>
            <div className="flex items-center gap-2 justify-end">
              <DataTableFilterPopover activeFilterCount={activeFilterCount} onClear={resetFilters}>
                <Select
                  value={levelFilter}
                  onValueChange={(v) => {
                    setLevelFilter(v)
                    setGroupFilter("all")
                    setScheduleFilter("all")
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

                <Select
                  value={groupFilter}
                  onValueChange={setGroupFilter}
                  disabled={availableGroups.length === 0}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Group" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Groups</SelectItem>
                    {availableGroups.map((g) => (
                      <SelectItem key={g.id} value={g.id.toString()}>
                        {g.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={scheduleFilter}
                  onValueChange={setScheduleFilter}
                  disabled={availableSchedules.length === 0}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Schedule" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Schedules</SelectItem>
                    {availableSchedules.map((s) => (
                      <SelectItem key={s.id} value={s.id.toString()}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start gap-2">
                      <IconCalendar className="size-4" />
                      {dateRange?.from ? (
                        dateRange.to ? (
                          `${format(dateRange.from, "MMM d")} - ${format(dateRange.to, "MMM d")}`
                        ) : (
                          format(dateRange.from, "MMM d, yyyy")
                        )
                      ) : (
                        "Date range"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      mode="range"
                      selected={dateRange}
                      onSelect={(r) => setDateRange(r as DateRange | undefined)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">Show archived</Label>
                    <p className="text-[11px] text-muted-foreground">Include archived sessions in results</p>
                  </div>
                  <Switch checked={showArchived} onCheckedChange={setShowArchived} />
                </div>
              </DataTableFilterPopover>

              <DraggableColumnDropdown
                columns={columns}
                columnVisibility={columnVisibility}
                onToggleColumn={(colId, visible) =>
                  setColumnVisibility((prev) => ({ ...prev, [colId]: visible }))
                }
                columnOrder={columnOrder}
                onColumnOrderChange={setColumnOrder}
                fixedStartColumns={["select"]}
                fixedEndColumns={["actions"]}
              />
            </div>
          </div>

          <ActiveFilterBadges
            filters={activeFilters}
            onRemove={(id) => {
              if (id === "level") {
                setLevelFilter("all")
                setGroupFilter("all")
                setScheduleFilter("all")
              } else if (id === "group") setGroupFilter("all")
              else if (id === "schedule") setScheduleFilter("all")
              else if (id === "date") setDateRange(undefined)
              else if (id === "archived") setShowArchived(false)
            }}
            onClearAll={resetFilters}
          />
        </div>

        <DataTableBulkActions
          selectedCount={selectedSessionIds.length}
          onClear={() => setRowSelection({})}
          actions={[
            {
              label: "Archive",
              onClick: () => setBulkArchiveOpen(true),
              variant: "outline",
              disabled: selectedSessionIds.length === 0,
              loading: isActioning,
            },
          ]}
        />

        <SessionDataTable
          data={sessions}
          columns={columns}
          selectable
          paginated
          defaultPageSize={10}
          columnVisibility={columnVisibility}
          onColumnVisibilityChange={setColumnVisibility}
          columnOrder={columnOrder}
          onColumnOrderChange={setColumnOrder}
          rowSelection={rowSelection}
          onRowSelectionChange={setRowSelection}
          onRowClick={goToDetails}
          emptyMessage={activeFilterCount > 0 ? "No sessions match your filters" : "No sessions yet"}
        />
      </div>

      <ConfirmDialog
        variant="delete"
        entity="session"
        targetIdentifier={deleteTarget?.name || deleteTarget?.schedule?.name || ""}
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={isActioning}
      />

      <ConfirmDialog
        variant="archive"
        entity="session"
        targetIdentifier={archiveTarget?.name || archiveTarget?.schedule?.name || ""}
        title={archiveTarget?.status === "archived" ? "Unarchive session?" : "Archive session?"}
        description={archiveTarget?.status === "archived" ? "This session will be visible again." : "This session will be hidden unless archived sessions are shown."}
        confirmLabel={archiveTarget?.status === "archived" ? "Unarchive" : "Archive"}
        open={!!archiveTarget}
        onOpenChange={(open) => !open && setArchiveTarget(null)}
        onConfirm={handleArchiveToggle}
        loading={isActioning}
      />

      <ConfirmDialog
        variant="archive"
        entity="session"
        title={`Archive ${selectedSessionIds.length} session(s)?`}
        description="These sessions will be hidden unless archived sessions are shown."
        confirmLabel="Archive"
        open={bulkArchiveOpen}
        onOpenChange={setBulkArchiveOpen}
        onConfirm={handleBulkArchive}
        loading={isActioning}
        disabled={selectedSessionIds.length === 0}
      />

      <StartSessionForm
        open={startOpen}
        onOpenChange={setStartOpen}
        academyId={academyId}
        onSuccess={refreshSessions}
      />
    </>
  )
}

