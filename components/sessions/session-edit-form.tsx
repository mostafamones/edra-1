"use client"

import { useEffect, useMemo } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Checkbox } from "@/components/ui/checkbox"

import type { SessionWithSchedule, ScheduleWithRelations } from "@/lib/types"
import { useSchedules, invalidateSessions } from "@/lib/hooks/use-data"
import { api } from "@/lib/api/client"
import { getErrorMessage } from "@/lib/get-error-message"

/**
 * Form-shape schema derived from the shared `updateSessionSchema`. We keep the
 * status/schedule_id/date fields required at the form layer even though the
 * server treats them as optional on a PATCH — the UI always submits all fields
 * together.
 */
const sessionEditFormSchema = z.object({
  session_date: z.string().min(1, "Date is required"),
  schedule_id: z.string().min(1, "Schedule is required"),
  status: z.enum(["live", "ended", "archived"]),
  is_cancelled: z.boolean(),
  name: z.string(),
})

type SessionEditFormValues = z.infer<typeof sessionEditFormSchema>

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
  const schedules = useMemo(
    () => (schedulesData || []) as ScheduleWithRelations[],
    [schedulesData]
  )

  const defaultValues = useMemo<SessionEditFormValues>(
    () => ({
      session_date: session.session_date?.split("T")[0] || "",
      schedule_id: session.schedule_id?.toString() || "",
      is_cancelled: !!session.is_cancelled,
      status: (session.status as SessionEditFormValues["status"]) || "live",
      name: session.name || "",
    }),
    [session]
  )

  const form = useForm<SessionEditFormValues>({
    resolver: zodResolver(sessionEditFormSchema),
    defaultValues,
  })

  useEffect(() => {
    form.reset(defaultValues)
  }, [defaultValues, form])

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await api.put(`/api/sessions/${session.id}`, {
        session_date: values.session_date,
        schedule_id: Number(values.schedule_id),
        is_cancelled: values.is_cancelled,
        status: values.status,
        name: values.name || null,
      })
      toast.success("Session updated")
      invalidateSessions()
      form.reset(defaultValues)
      onSuccess?.()
    } catch (err) {
      toast.error(getErrorMessage(err) || "Could not update session")
    }
  })

  const isSubmitting = form.formState.isSubmitting

  return (
    <div className="p-4 lg:p-6 w-full">
      <div className="mx-auto w-full max-w-2xl rounded-xl border bg-card p-6 space-y-6">
        <div className="space-y-1">
          <p className="text-sm font-medium">Edit session</p>
          <p className="text-xs text-muted-foreground">
            Update date, schedule, and status.
          </p>
        </div>

        <Separator />

        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Make-up session" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="session_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="schedule_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Schedule</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={schedulesLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a schedule" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {schedules.map((s) => (
                        <SelectItem key={s.id} value={s.id.toString()}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="live">Live</SelectItem>
                      <SelectItem value="ended">Ended</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_cancelled"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <FormLabel className="text-sm font-medium">Cancelled</FormLabel>
                      <p className="text-[11px] text-muted-foreground">
                        Mark this session as cancelled
                      </p>
                    </div>
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(v) => field.onChange(v === true)}
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  )
}
