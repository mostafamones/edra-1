"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { IconAlertTriangle } from "@tabler/icons-react"
import type { AttendanceWithStudent, SessionWithSchedule } from "@/lib/types"
import { updateStudentRaw } from "@/feat/students/mutations"
import { endSession } from "@/lib/hooks/mutations"
import { getErrorMessage } from "@/lib/get-error-message"

interface AnomalyResolutionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  session: SessionWithSchedule
  anomalies: AttendanceWithStudent[]
  onSuccess?: () => void
}

export function AnomalyResolutionDialog({
  open,
  onOpenChange,
  session,
  anomalies,
  onSuccess,
}: AnomalyResolutionDialogProps) {
  const [isEnding, setIsEnding] = useState(false)

  const handleResolutionChange = async (studentId: number, note: string) => {
    try {
      await updateStudentRaw(studentId, {
        note,
      })
      onSuccess?.()
    } catch (err) {
      toast.error(getErrorMessage(err) || "Could not update attendance")
    }
  }

  const handleEndSession = async () => {
    setIsEnding(true)
    try {
      const migrations = anomalies
        .filter((a) => a.note === "Migrating")
        .map((a) => a.student_id)

      await endSession(session.id, {
        academyId: session.academy_id,
        migrations,
        notes: [],
      })

      toast.success("Session ended successfully")
      onSuccess?.()
      onOpenChange(false)
    } catch (err) {
      toast.error(getErrorMessage(err) || "Could not end session")
    } finally {
      setIsEnding(false)
    }
  }

  const unresolvedCount = anomalies.filter((a) => !a.note).length
  const canEndSession = unresolvedCount === 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] lg:max-w-[1000px] max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center size-10 rounded-lg bg-orange-500/10">
              <IconAlertTriangle className="size-5 text-orange-500" />
            </div>
            <div>
              <DialogTitle>Resolve Attendance Anomalies</DialogTitle>
              <DialogDescription>
                The following students checked into this session but belong to a different schedule.
                Please choose how to handle their attendance before ending the session.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto border rounded-xl my-4">
          <table className="w-full text-sm whitespace-nowrap">
            <thead className="sticky top-0 bg-background border-b z-10">
              <tr>
                <th className="p-3 text-left font-medium">Student Name</th>
                <th className="p-3 text-left font-medium">Original Schedule</th>
                <th className="p-3 text-left font-medium">Resolution Action</th>
              </tr>
            </thead>
            <tbody>
              {anomalies.map((record) => {
                const firstEnrollment = record.student?.schedule_enrollments?.[0] as any
                const scheduleName = firstEnrollment?.schedule_id
                  ? `Schedule #${firstEnrollment.schedule_id}`
                  : "Not Enrolled"

                return (
                  <tr key={record.student_id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="p-3">{record.student?.full_name}</td>
                    <td className="p-3 text-muted-foreground">{scheduleName}</td>
                    <td className="p-3">
                      <Select
                        value={record.note || undefined}
                        onValueChange={(val) => handleResolutionChange(record.student_id, val)}
                      >
                        <SelectTrigger className="h-8 w-[220px]">
                          <SelectValue placeholder="Select an action..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Making up missed session">Making up missed session</SelectItem>
                          <SelectItem value="Warning">Warning</SelectItem>
                          <SelectItem value="Migrating">Migrate here (Moves student)</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                  </tr>
                )
              })}
              {anomalies.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-6 text-center text-muted-foreground">
                    No anomalies detected.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <DialogFooter className="flex items-center sm:justify-between w-full">
          <div className="text-sm font-medium">
            {unresolvedCount > 0 ? (
              <span className="text-destructive">{unresolvedCount} case(s) requiring resolution.</span>
            ) : (
              <span className="text-green-600">All cases documented. Ready to end session.</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleEndSession} disabled={!canEndSession || isEnding}>
              {isEnding ? "Ending..." : "End Session"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
