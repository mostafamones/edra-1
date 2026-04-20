"use client"

import { useEffect, useMemo, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { toast } from "sonner"
import { format } from "date-fns"
import { IconCalendar } from "@tabler/icons-react"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import type { ScheduleWithRelations } from "@/lib/types"
import { useSchedules, invalidateSessions } from "@/lib/hooks/use-data"
import { encodeSessionId } from "@/lib/hashid"
import { withAcademyPath } from "@/components/helpers/sidebar"
import { api } from "@/lib/api/client"
import { getErrorMessage } from "@/lib/get-error-message"

export interface StartSessionFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  academyId: string
  onSuccess?: () => void
}

export function StartSessionForm({
  open,
  onOpenChange,
  academyId,
  onSuccess,
}: StartSessionFormProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { data: schedulesData, loading: schedulesLoading } = useSchedules(academyId)
  const schedules = useMemo(() => (schedulesData || []) as ScheduleWithRelations[], [schedulesData])

  const [isLoading, setIsLoading] = useState(false)
  const [isCancelled, setIsCancelled] = useState(false)
  const [formData, setFormData] = useState({
    schedule_id: "",
    session_date: new Date().toISOString().split("T")[0],
  })

  useEffect(() => {
    if (!open) {
      setFormData({
        schedule_id: "",
        session_date: new Date().toISOString().split("T")[0],
      })
      setIsCancelled(false)
      setIsLoading(false)
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.schedule_id) {
      toast.error("Please select a schedule")
      return
    }

    setIsLoading(true)
    try {
      const session = await api.post<{ id: number }>("/api/sessions", {
        schedule_id: Number(formData.schedule_id),
        session_date: formData.session_date,
        academy_id: academyId,
        is_cancelled: isCancelled,
      })

      toast.success(
        isCancelled ? "Cancelled session logged successfully" : "Session started successfully"
      )

      invalidateSessions()
      onOpenChange(false)
      onSuccess?.()

      router.refresh()
      router.push(withAcademyPath(pathname, `/sessions/${encodeSessionId(session.id)}`))
    } catch (err) {
      toast.error(getErrorMessage(err) || "Could not start session")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isCancelled ? "Log a Cancelled Session" : "Start a Session"}</DialogTitle>
          <DialogDescription>
            Select a schedule and date to {isCancelled ? "log a cancelled" : "start a new"} session.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="schedule_id">Schedule</Label>
            <Select
              value={formData.schedule_id}
              onValueChange={(value) => setFormData({ ...formData, schedule_id: value })}
              required
              disabled={schedulesLoading}
            >
              <SelectTrigger className="text-left py-7 w-full" id="schedule_id">
                <SelectValue placeholder={schedulesLoading ? "Loading schedules..." : "Select a schedule"} />
              </SelectTrigger>
              <SelectContent>
                {schedules.map((schedule) => (
                  <SelectItem key={schedule.id} value={schedule.id.toString()}>
                    <div className="flex flex-col">
                      <span>{schedule.name}</span>
                      {(schedule.level || schedule.group) && (
                        <span className="text-xs text-muted-foreground">
                          {schedule.level?.name}
                          {schedule.level?.name && schedule.group?.name && " · "}
                          {schedule.group?.name}
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="session_date">Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start px-2.5 font-normal"
                  id="session_date"
                  type="button"
                >
                  <IconCalendar className="size-4" />
                  {formData.session_date ? format(new Date(formData.session_date), "MMM d, yyyy") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.session_date ? new Date(formData.session_date) : undefined}
                  onSelect={(date) =>
                    setFormData({
                      ...formData,
                      session_date: date ? date.toISOString().split("T")[0] : "",
                    })
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_cancelled"
              checked={isCancelled}
              onCheckedChange={(checked) => setIsCancelled(checked === true)}
            />
            <Label htmlFor="is_cancelled" className="text-sm font-normal">
              Log as Cancelled Session
            </Label>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (isCancelled ? "Logging..." : "Starting...") : (isCancelled ? "Log Cancelled Session" : "Start Session")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

