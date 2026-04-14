"use client"

import { useMemo, useState } from "react"
import { format } from "date-fns"
import { toast } from "sonner"
import {
  IconArchive,
  IconCalendar,
  IconClock,
  IconPlayerStop,
  IconTrash,
} from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

import type { AttendanceWithStudent, SessionWithSchedule } from "@/lib/types"
import { AnomalyResolutionDialog } from "./anomaly-resolution-dialog"

interface SessionSummaryProps {
  session: SessionWithSchedule
  attendanceData: AttendanceWithStudent[]
  onRefresh: () => void
}

export function SessionSummary({ session, attendanceData, onRefresh }: SessionSummaryProps) {
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [archiveOpen, setArchiveOpen] = useState(false)
  const [anomalyOpen, setAnomalyOpen] = useState(false)
  const [isActioning, setIsActioning] = useState(false)

  const timeSlot = session.schedule?.time_slots?.[0]
  const timeString = timeSlot
    ? `${timeSlot.start_time}${timeSlot.end_time ? ` - ${timeSlot.end_time}` : ""}`
    : "No time specified"

  const anomalies = useMemo(() => {
    return attendanceData.filter((record) => {
      const hasMatchingSchedule = record.student?.schedule_enrollments?.some(
        (e) => e.schedule_id === session.schedule_id
      )
      return !hasMatchingSchedule
    })
  }, [attendanceData, session.schedule_id])

  const unresolvedCount = useMemo(
    () => anomalies.filter((a) => !a.note).length,
    [anomalies]
  )

  const handleDelete = async () => {
    setIsActioning(true)
    try {
      const res = await fetch(`/api/sessions/${session.id}`, { method: "DELETE" })
      if (!res.ok) {
        const err = await res.json().catch(() => null)
        throw new Error(err?.error || err?.details || "Failed to delete session")
      }
      toast.success("Session deleted")
      // Parent should navigate away; we just refresh.
      onRefresh()
    } catch (e: any) {
      toast.error(e?.message || "Could not delete session")
    } finally {
      setIsActioning(false)
      setDeleteOpen(false)
    }
  }

  const handleArchiveToggle = async () => {
    setIsActioning(true)
    try {
      const isArchived = session.status === "archived"
      const res = await fetch(`/api/sessions/${session.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: isArchived ? "live" : "archived" }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => null)
        throw new Error(err?.error || err?.details || "Failed to update session")
      }
      toast.success(isArchived ? "Unarchived" : "Archived")
      onRefresh()
    } catch (e: any) {
      toast.error(e?.message || "Could not update session")
    } finally {
      setIsActioning(false)
      setArchiveOpen(false)
    }
  }

  const handleEndSession = async () => {
    if (anomalies.length > 0) {
      setAnomalyOpen(true)
      return
    }

    setIsActioning(true)
    try {
      const res = await fetch(`/api/sessions/${session.id}/end`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ academyId: session.academy_id, migrations: [], notes: [] }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => null)
        throw new Error(err?.error || "Failed to end session")
      }
      toast.success("Session ended")
      onRefresh()
    } catch (e: any) {
      toast.error(e?.message || "Could not end session")
    } finally {
      setIsActioning(false)
    }
  }

  return (
    <div className="px-4 lg:px-6 mt-6">
      <div className="p-6 bg-card border rounded-xl space-y-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-lg font-semibold">
                {session.name || session.schedule?.name || "Session"}
              </p>
              {session.is_cancelled && (
                <Badge variant="destructive" className="capitalize">
                  Cancelled
                </Badge>
              )}
              {session.status && !session.is_cancelled && (
                <Badge variant={session.status === "live" ? "outline" : "secondary"} className="capitalize">
                  {session.status}
                </Badge>
              )}
              {unresolvedCount > 0 && (
                <Badge variant="secondary">
                  {unresolvedCount} anomaly{unresolvedCount !== 1 ? "ies" : "y"}
                </Badge>
              )}
            </div>

            <div className="text-sm text-muted-foreground flex flex-col gap-1">
              <span className="flex items-center gap-2">
                <IconCalendar className="size-4" />
                {format(new Date(session.session_date), "MMM d, yyyy")}
              </span>
              <span className="flex items-center gap-2">
                <IconClock className="size-4" />
                {timeString}
              </span>
              <span>
                {session.schedule?.level?.name}
                {session.schedule?.group?.name ? ` · ${session.schedule.group.name}` : ""}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 justify-end">
            {session.status === "live" && !session.is_cancelled && (
              <Button
                variant="outline"
                className="gap-1.5"
                onClick={handleEndSession}
                disabled={isActioning}
              >
                <IconPlayerStop className="size-4" />
                End session
              </Button>
            )}
            <Button
              variant="outline"
              className="gap-1.5"
              onClick={() => setArchiveOpen(true)}
              disabled={isActioning}
            >
              <IconArchive className="size-4" />
              {session.status === "archived" ? "Unarchive" : "Archive"}
            </Button>
            <Button
              variant="outline"
              className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10"
              onClick={() => setDeleteOpen(true)}
              disabled={isActioning}
            >
              <IconTrash className="size-4" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        variant="delete"
        entity="session"
        targetIdentifier={session.name || session.schedule?.name || ""}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleDelete}
        loading={isActioning}
      />

      <ConfirmDialog
        variant="archive"
        entity="session"
        targetIdentifier={session.name || session.schedule?.name || ""}
        title={session.status === "archived" ? "Unarchive session?" : "Archive session?"}
        description={session.status === "archived" ? "This session will be visible again." : "This session will be hidden unless archived sessions are shown."}
        confirmLabel={session.status === "archived" ? "Unarchive" : "Archive"}
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
        onConfirm={handleArchiveToggle}
        loading={isActioning}
      />

      <AnomalyResolutionDialog
        open={anomalyOpen}
        onOpenChange={setAnomalyOpen}
        session={session}
        anomalies={anomalies}
        onSuccess={onRefresh}
      />
    </div>
  )
}

