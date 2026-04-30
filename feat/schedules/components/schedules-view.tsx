"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { IconCalendarWeek, IconList, IconPlus, IconRefresh } from "@tabler/icons-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { withAcademyPath } from "@/components/helpers/sidebar";
import {
  PageToolbar,
  PageToolbarActions,
  PageToolbarGroup,
  PageToolbarSearch,
} from "@/components/shell";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Refresh } from "@/components/ui/refresh";
import { getErrorMessage } from "@/lib/get-error-message";
import type { ScheduleWithRelations } from "@/lib/types";

import { DEFAULT_SCHEDULE_VIEW_MODE, SCHEDULE_VIEW_STORAGE_KEY } from "../constants";
import { useSchedules } from "../hooks/use-schedules";
import { deleteSchedule } from "../mutations";
import type { ScheduleViewMode } from "../types";
import { buildScheduleRows, getScheduleSearchString } from "../utils/derive-schedules";
import { ScheduleCalendarView } from "./schedule-calendar-view";
import { ScheduleEditSheet } from "./schedule-edit-sheet";
import { ScheduleListView } from "./schedule-list-view";
import { SchedulesViewSkeleton } from "./schedules-view-skeleton";

export interface SchedulesViewProps {
  academyId: string;
}

function getStoredViewMode(): ScheduleViewMode {
  if (typeof window === "undefined") return DEFAULT_SCHEDULE_VIEW_MODE;

  try {
    const stored = localStorage.getItem(SCHEDULE_VIEW_STORAGE_KEY);
    return stored === "calendar" || stored === "list"
      ? stored
      : DEFAULT_SCHEDULE_VIEW_MODE;
  } catch {
    return DEFAULT_SCHEDULE_VIEW_MODE;
  }
}

function setStoredViewMode(mode: ScheduleViewMode) {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(SCHEDULE_VIEW_STORAGE_KEY, mode);
  } catch (error) {
    console.error("Failed to save view mode:", error);
  }
}

export function SchedulesView({ academyId }: SchedulesViewProps) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const { data: schedules = [], isLoading, refetch } = useSchedules(academyId);

  const [viewMode, setViewMode] = useState<ScheduleViewMode>(() => getStoredViewMode());
  const [searchQuery, setSearchQuery] = useState("");
  const [editingSchedule, setEditingSchedule] = useState<ScheduleWithRelations | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ScheduleWithRelations | null>(null);

  useEffect(() => {
    setStoredViewMode(viewMode);
  }, [viewMode]);

  const filteredSchedules = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return schedules;
    return schedules.filter((schedule) => getScheduleSearchString(schedule).includes(query));
  }, [schedules, searchQuery]);

  const matchedScheduleIds = useMemo(
    () => new Set(filteredSchedules.map((schedule) => schedule.id)),
    [filteredSchedules]
  );

  const { oneOffRows, unscheduledRows, activeDays, recurringRows } = useMemo(
    () => buildScheduleRows(filteredSchedules),
    [filteredSchedules]
  );

  const allRows = useMemo(() => [...recurringRows, ...oneOffRows], [oneOffRows, recurringRows]);
  const allScheduleRows = useMemo(() => {
    const { recurringRows: allRecurringRows, oneOffRows: allOneOffRows } = buildScheduleRows(schedules);
    return [...allRecurringRows, ...allOneOffRows];
  }, [schedules]);

  const openCreatePage = useCallback(() => {
    router.push(withAcademyPath(pathname, "/schedules/create"));
  }, [pathname, router]);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;

    try {
      await deleteSchedule(deleteTarget.id, academyId, queryClient);
      toast.success("Schedule deleted");
      setDeleteTarget(null);
    } catch (error) {
      toast.error(getErrorMessage(error) || "Could not delete schedule");
    }
  }, [academyId, deleteTarget, queryClient]);

  const emptyTitle = searchQuery.trim()
    ? "No schedules match your search"
    : "No schedules yet";
  const emptyDescription = searchQuery.trim()
    ? "Try a different search term."
    : "Create a schedule to start organizing sessions.";

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden">
      <SiteHeader title="Schedules" />

      <main
        className={`flex-1 overflow-y-auto px-4 py-4 lg:px-6 ${
          viewMode === "calendar" ? "flex min-h-0 flex-col" : ""
        }`}
      >
        <div className={`space-y-6 ${viewMode === "calendar" ? "flex min-h-0 flex-1 flex-col" : ""}`}>
          <PageToolbar>
            <PageToolbarSearch
              value={searchQuery}
              onValueChange={setSearchQuery}
              placeholder="Search schedules..."
              disabled={isLoading}
            />
            <PageToolbarActions>
              <PageToolbarGroup>
                <ButtonGroup>
                  <Button
                    type="button"
                    onClick={() => setViewMode("list")}
                    variant={viewMode === "list" ? "default" : "outline"}
                    size="icon"
                  >
                    <IconList className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setViewMode("calendar")}
                    variant={viewMode === "calendar" ? "default" : "outline"}
                    size="icon"
                  >
                    <IconCalendarWeek className="size-4" />
                  </Button>
                </ButtonGroup>
              </PageToolbarGroup>
              <PageToolbarGroup>
                <Refresh func={refetch} variant="outline" />
                <Button className="gap-1.5" variant="outline" onClick={openCreatePage}>
                  <IconPlus className="size-4" />
                  Add Schedule
                </Button>
              </PageToolbarGroup>
            </PageToolbarActions>
          </PageToolbar>

          {isLoading ? (
            <div className={viewMode === "calendar" ? "flex min-h-0 flex-1 flex-col" : ""}>
              <SchedulesViewSkeleton viewMode={viewMode} />
            </div>
          ) : filteredSchedules.length === 0 && viewMode === "list" ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <IconRefresh className="size-4" />
                </EmptyMedia>
                <EmptyTitle>{emptyTitle}</EmptyTitle>
                <EmptyDescription>{emptyDescription}</EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                {searchQuery.trim() ? (
                  <Button variant="outline" onClick={() => setSearchQuery("")}>
                    Clear Search
                  </Button>
                ) : (
                  <Button onClick={openCreatePage} className="gap-1.5">
                    <IconPlus className="size-4" />
                    Add Schedule
                  </Button>
                )}
              </EmptyContent>
            </Empty>
          ) : viewMode === "list" ? (
            <ScheduleListView
              activeDays={activeDays}
              unscheduledRows={unscheduledRows}
              oneOffRows={oneOffRows}
              onEdit={setEditingSchedule}
              onDelete={setDeleteTarget}
            />
          ) : (
            <ScheduleCalendarView
              rows={searchQuery.trim() ? allScheduleRows : allRows}
              matchedScheduleIds={searchQuery.trim() ? matchedScheduleIds : undefined}
              onSelectSchedule={(schedule) => setEditingSchedule(schedule)}
            />
          )}
        </div>
      </main>

      <ScheduleEditSheet
        open={!!editingSchedule}
        onOpenChange={(open) => {
          if (!open) {
            setEditingSchedule(null);
          }
        }}
        schedule={editingSchedule}
        academyId={academyId}
        onSuccess={() => setEditingSchedule(null)}
      />

      <ConfirmDialog
        variant="delete"
        entity="schedule"
        targetIdentifier={deleteTarget?.name || ""}
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
