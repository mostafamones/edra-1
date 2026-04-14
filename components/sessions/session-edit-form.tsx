"use client"

import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"

import type { SessionUpdate, SessionWithSchedule, ScheduleWithRelations } from "@/lib/types"
import { useSchedules } from "@/lib/hooks/use-data"

export interface SessionEditFormProps {
  academyId: string
  session: SessionWithSchedule
  onSuccess?: () => void
  onCancel?: () => void
}

export function SessionEditForm({
  academyId,
  session,
  onSuccess,
  onCancel,
}: SessionEditFormProps) {
  const { data: schedulesData, loading: schedulesLoading } = useSchedules(academyId)
  const schedules = useMemo(() => (schedulesData || []) as ScheduleWithRelations[], [schedulesData])

  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    session_date: session.session_date?.split("T")[0] || "",
    schedule_id: session.schedule_id?.toString() || "",
    is_cancelled: !!session.is_cancelled,
    status: session.status || "live",
    name: session.name || "",
  })

  useEffect(() => {
    setFormData({
      session_date: session.session_date?.split("T")[0] || "",
      schedule_id: session.schedule_id?.toString() || "",
      is_cancelled: !!session.is_cancelled,
      status: session.status || "live",
      name: session.name || "",
    })
  }, [session])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.session_date || !formData.schedule_id) {
      toast.error("Date and schedule are required")
      return
    }

    setIsLoading(true)
    try {
      const updateData: SessionUpdate = {
        session_date: formData.session_date,
        schedule_id: Number(formData.schedule_id),
        is_cancelled: formData.is_cancelled,
        status: formData.status as any,
        name: formData.name || null,
      }

      const res = await fetch(`/api/sessions/${session.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => null)
        throw new Error(err?.details || "Failed to update session")
      }

      onSuccess?.()
    } catch (error: any) {
      toast.error(error?.message || "Could not update session")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-4 lg:p-6 w-full">
      <div className="mx-auto w-full max-w-2xl rounded-xl border bg-card p-6 space-y-6">
        <div className="space-y-1">
          <p className="text-sm font-medium">Edit session</p>
          <p className="text-xs text-muted-foreground">Update date, schedule, and status.</p>
        </div>

        <Separator />

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name (optional)</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Make-up session"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="session_date">Date</Label>
            <Input
              id="session_date"
              type="date"
              value={formData.session_date}
              onChange={(e) => setFormData({ ...formData, session_date: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="schedule_id">Schedule</Label>
            <Select
              value={formData.schedule_id}
              onValueChange={(value) => setFormData({ ...formData, schedule_id: value })}
              required
              disabled={schedulesLoading}
            >
              <SelectTrigger id="schedule_id">
                <SelectValue placeholder="Select a schedule" />
              </SelectTrigger>
              <SelectContent>
                {schedules.map((s) => (
                  <SelectItem key={s.id} value={s.id.toString()}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="live">Live</SelectItem>
                <SelectItem value="ended">Ended</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">Cancelled</p>
              <p className="text-[11px] text-muted-foreground">Mark this session as cancelled</p>
            </div>
            <input
              type="checkbox"
              checked={formData.is_cancelled}
              onChange={(e) => setFormData({ ...formData, is_cancelled: e.target.checked })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

