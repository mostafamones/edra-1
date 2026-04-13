"use client"

import type React from "react"
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { format } from "date-fns"
import { IconCalendarEvent, IconPlus, IconTrash } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

import type { Group, Level, ScheduleTimeSlot, ScheduleWithRelations } from "@/lib/types"
import { useGroups, useLevels } from "@/lib/hooks/use-data"

const DAYS_OF_WEEK = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
]

interface RecurringSlotEntry {
  key: string
  day_of_week: number
  start_time: string
  end_time: string
}

interface OneOffInstanceEntry {
  key: string
  instance_date: string
  start_time: string
  end_time: string
}

export interface ScheduleFormProps {
  academyId: string
  initialSchedule?: ScheduleWithRelations | null
  onSuccess?: () => void
  onCancel?: () => void
}

function generateId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).substring(2, 9)
}

export function ScheduleForm({
  academyId,
  initialSchedule,
  onSuccess,
  onCancel,
}: ScheduleFormProps) {
  const isEdit = !!initialSchedule
  const [saving, setSaving] = useState(false)

  const { data: levels = [], loading: levelsLoading } = useLevels(academyId)
  const { data: groups = [], loading: groupsLoading } = useGroups(academyId)

  const [formData, setFormData] = useState({
    name: "",
    level_id: "",
    group_id: "",
    schedule_type: "recurring" as "recurring" | "one_off",
    auto_assign: false,
    show_on_form: true,
  })

  const [recurringSlots, setRecurringSlots] = useState<RecurringSlotEntry[]>([
    { key: generateId(), day_of_week: 0, start_time: "08:00", end_time: "" },
  ])

  const [oneOffInstances, setOneOffInstances] = useState<OneOffInstanceEntry[]>([
    { key: generateId(), instance_date: "", start_time: "08:00", end_time: "" },
  ])

  useEffect(() => {
    if (!initialSchedule) return

    const schedule = initialSchedule
    const isOneOff = schedule.schedule_type === "one_off"

    setFormData({
      name: schedule.name,
      level_id: schedule.level_id?.toString() || "",
      group_id: schedule.group_id?.toString() || "",
      schedule_type: (schedule.schedule_type as "recurring" | "one_off") || "recurring",
      auto_assign: schedule.auto_assign,
      show_on_form: schedule.show_on_form,
    })

    if (schedule.time_slots && schedule.time_slots.length > 0) {
      if (isOneOff) {
        setOneOffInstances(
          schedule.time_slots.map((ts: ScheduleTimeSlot) => ({
            key: generateId(),
            instance_date: ts.instance_date || schedule.one_off_date || "",
            start_time: ts.start_time?.slice(0, 5) || "08:00",
            end_time: ts.end_time?.slice(0, 5) || "",
          }))
        )
        setRecurringSlots([{ key: generateId(), day_of_week: 0, start_time: "08:00", end_time: "" }])
      } else {
        setRecurringSlots(
          schedule.time_slots.map((ts: ScheduleTimeSlot) => ({
            key: generateId(),
            day_of_week: ts.day_of_week ?? 0,
            start_time: ts.start_time?.slice(0, 5) || "08:00",
            end_time: ts.end_time?.slice(0, 5) || "",
          }))
        )
        setOneOffInstances([{ key: generateId(), instance_date: "", start_time: "08:00", end_time: "" }])
      }
    }
  }, [initialSchedule])

  const isOneOff = formData.schedule_type === "one_off"

  const levelOptions = useMemo(() => (Array.isArray(levels) ? (levels as Level[]) : []), [levels])
  const groupOptions = useMemo(() => (Array.isArray(groups) ? (groups as Group[]) : []), [groups])

  const addRecurringSlot = () => {
    setRecurringSlots((prev) => [
      ...prev,
      { key: generateId(), day_of_week: 0, start_time: "08:00", end_time: "" },
    ])
  }

  const removeRecurringSlot = (key: string) => {
    setRecurringSlots((prev) => prev.filter((s) => s.key !== key))
  }

  const updateRecurringSlot = (
    key: string,
    field: keyof RecurringSlotEntry,
    value: RecurringSlotEntry[keyof RecurringSlotEntry]
  ) => {
    setRecurringSlots((prev) => prev.map((s) => (s.key === key ? { ...s, [field]: value } : s)))
  }

  const addOneOffInstance = () => {
    setOneOffInstances((prev) => [
      ...prev,
      { key: generateId(), instance_date: "", start_time: "08:00", end_time: "" },
    ])
  }

  const removeOneOffInstance = (key: string) => {
    setOneOffInstances((prev) => prev.filter((s) => s.key !== key))
  }

  const updateOneOffInstance = (
    key: string,
    field: keyof OneOffInstanceEntry,
    value: OneOffInstanceEntry[keyof OneOffInstanceEntry]
  ) => {
    setOneOffInstances((prev) => prev.map((s) => (s.key === key ? { ...s, [field]: value } : s)))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast.error("Schedule name is required")
      return
    }

    if (!isOneOff && recurringSlots.length === 0) {
      toast.error("Add at least one time slot")
      return
    }

    if (isOneOff && oneOffInstances.length === 0) {
      toast.error("Add at least one instance")
      return
    }

    if (isOneOff) {
      const missingDate = oneOffInstances.some((inst) => !inst.instance_date)
      if (missingDate) {
        toast.error("All one-off instances must have a date")
        return
      }
    }

    setSaving(true)
    try {
      const timeSlotPayload = isOneOff
        ? oneOffInstances.map((inst) => ({
            instance_date: inst.instance_date,
            start_time: inst.start_time,
            end_time: inst.end_time || null,
            day_of_week: null,
          }))
        : recurringSlots.map((ts) => ({
            day_of_week: ts.day_of_week,
            start_time: ts.start_time,
            end_time: ts.end_time || null,
            instance_date: null,
          }))

      const payload = {
        name: formData.name.trim(),
        level_id: formData.level_id ? parseInt(formData.level_id) : null,
        group_id: formData.group_id ? parseInt(formData.group_id) : null,
        schedule_type: formData.schedule_type,
        one_off_date: null,
        auto_assign: formData.auto_assign,
        show_on_form: formData.show_on_form,
        academy_id: academyId,
        time_slots: timeSlotPayload,
      }

      if (isEdit && initialSchedule) {
        const res = await fetch(`/api/schedules/${initialSchedule.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        if (!res.ok) {
          const errBody = await res.json().catch(() => null)
          throw new Error(errBody?.details || "Failed to update")
        }
        toast.success("Schedule updated")
      } else {
        const res = await fetch("/api/schedules", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        if (!res.ok) {
          const errBody = await res.json().catch(() => null)
          throw new Error(errBody?.details || "Failed to create")
        }
        toast.success("Schedule created")
      }

      onSuccess?.()
    } catch (err: any) {
      console.error(err)
      toast.error(err?.message || (isEdit ? "Could not update schedule" : "Could not create schedule"))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="w-full p-4 lg:p-6">
      <div className="mx-auto w-full max-w-3xl rounded-xl border bg-card">
        <ScrollArea className="max-h-[calc(100vh-11rem)]">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="schedule-name">
                Schedule Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="schedule-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Morning Class A"
                required
              />
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Type</h3>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  className={`flex flex-col items-center gap-1 p-3 rounded-lg border text-sm transition-colors ${
                    formData.schedule_type === "recurring"
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-input hover:bg-muted/30"
                  }`}
                  onClick={() => setFormData({ ...formData, schedule_type: "recurring" })}
                >
                  <span className="font-medium">Recurring</span>
                  <span className="text-[11px] text-muted-foreground">Repeats weekly</span>
                </button>
                <button
                  type="button"
                  className={`flex flex-col items-center gap-1 p-3 rounded-lg border text-sm transition-colors ${
                    formData.schedule_type === "one_off"
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-input hover:bg-muted/30"
                  }`}
                  onClick={() => setFormData({ ...formData, schedule_type: "one_off" })}
                >
                  <span className="font-medium">One-off</span>
                  <span className="text-[11px] text-muted-foreground">Specific dates</span>
                </button>
              </div>
            </div>

            <Separator />

            {!isOneOff && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Time Slots</h3>
                  <Button type="button" variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={addRecurringSlot}>
                    <IconPlus className="size-3" />
                    Add Slot
                  </Button>
                </div>

                <div className="space-y-3">
                  {recurringSlots.map((slot) => (
                    <div key={slot.key} className="flex items-end gap-2 p-3 rounded-lg border border-input bg-muted/20">
                      <div className="grid grid-cols-3 items-start gap-2 w-full">
                        <div className="col-span-1 space-y-1.5">
                          <Label className="text-[11px] text-muted-foreground">Day</Label>
                          <Select
                            value={slot.day_of_week.toString()}
                            onValueChange={(val) => updateRecurringSlot(slot.key, "day_of_week", parseInt(val))}
                          >
                            <SelectTrigger className="h-9 w-full text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {DAYS_OF_WEEK.map((d) => (
                                <SelectItem key={d.value} value={d.value.toString()}>
                                  {d.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[11px] text-muted-foreground">Start</Label>
                          <Input
                            type="time"
                            value={slot.start_time}
                            onChange={(e) => updateRecurringSlot(slot.key, "start_time", e.target.value)}
                            className="h-9 text-xs"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[11px] text-muted-foreground">End</Label>
                          <Input
                            type="time"
                            value={slot.end_time}
                            onChange={(e) => updateRecurringSlot(slot.key, "end_time", e.target.value)}
                            className="h-9 text-xs"
                            placeholder="Optional"
                          />
                        </div>
                      </div>
                      {recurringSlots.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-9 w-9 mb-1.5 text-muted-foreground hover:text-destructive shrink-0"
                          onClick={() => removeRecurringSlot(slot.key)}
                        >
                          <IconTrash className="size-3.5" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isOneOff && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Instances</h3>
                  <Button type="button" variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={addOneOffInstance}>
                    <IconPlus className="size-3" />
                    Add Instance
                  </Button>
                </div>

                <p className="text-[11px] text-muted-foreground -mt-2">
                  Each instance is a specific date and time this schedule occurs.
                </p>

                <div className="space-y-3">
                  {oneOffInstances.map((inst) => (
                    <div key={inst.key} className="flex items-end gap-2 p-3 rounded-lg border border-input bg-muted/20">
                      <div className="grid grid-cols-3 items-start gap-2 w-full">
                        <div className="col-span-1 space-y-1.5 flex flex-col justify-end">
                          <Label className="text-[11px] text-muted-foreground">Date *</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full h-9 justify-start text-left font-normal px-3 text-xs",
                                  !inst.instance_date && "text-muted-foreground"
                                )}
                              >
                                {inst.instance_date ? format(new Date(inst.instance_date), "PPP") : <span>Pick a date</span>}
                                <IconCalendarEvent className="ml-auto h-3.5 w-3.5 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={inst.instance_date ? new Date(inst.instance_date) : undefined}
                                onSelect={(date) => updateOneOffInstance(inst.key, "instance_date", date ? format(date, "yyyy-MM-dd") : "")}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[11px] text-muted-foreground">Start</Label>
                          <Input
                            type="time"
                            value={inst.start_time}
                            onChange={(e) => updateOneOffInstance(inst.key, "start_time", e.target.value)}
                            className="h-9 text-xs"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[11px] text-muted-foreground">End</Label>
                          <Input
                            type="time"
                            value={inst.end_time}
                            onChange={(e) => updateOneOffInstance(inst.key, "end_time", e.target.value)}
                            className="h-9 text-xs"
                            placeholder="Optional"
                          />
                        </div>
                      </div>
                      {oneOffInstances.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-9 w-9 mb-1.5 text-muted-foreground hover:text-destructive shrink-0"
                          onClick={() => removeOneOffInstance(inst.key)}
                        >
                          <IconTrash className="size-3.5" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Targeting</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="level">Level</Label>
                  <Select
                    value={formData.level_id}
                    onValueChange={(val) => setFormData({ ...formData, level_id: val === "__none__" ? "" : val })}
                    disabled={levelsLoading}
                  >
                    <SelectTrigger id="level">
                      <SelectValue placeholder="All Levels" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">All Levels</SelectItem>
                      {levelOptions.map((l) => (
                        <SelectItem key={l.id} value={l.id.toString()}>
                          {l.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="group">Group</Label>
                  <Select
                    value={formData.group_id}
                    onValueChange={(val) => setFormData({ ...formData, group_id: val === "__none__" ? "" : val })}
                    disabled={groupsLoading || groupOptions.length === 0}
                  >
                    <SelectTrigger id="group">
                      <SelectValue placeholder="All Groups" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">All Groups</SelectItem>
                      {groupOptions.map((g) => (
                        <SelectItem key={g.id} value={g.id.toString()}>
                          {g.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Optionally restrict this schedule to a specific level and/or group.
              </p>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Behavior</h3>

              <div className="flex items-center justify-between rounded-lg border border-input p-3">
                <div>
                  <p className="text-sm font-medium">Auto-assign</p>
                  <p className="text-[11px] text-muted-foreground">Auto-assign matching students to this schedule</p>
                </div>
                <Switch
                  checked={formData.auto_assign}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      auto_assign: checked,
                      show_on_form: checked ? false : formData.show_on_form,
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border border-input p-3">
                <div>
                  <p className="text-sm font-medium">Show on Form</p>
                  <p className="text-[11px] text-muted-foreground">Students can see and choose this during enrollment</p>
                </div>
                <Switch checked={formData.show_on_form} onCheckedChange={(checked) => setFormData({ ...formData, show_on_form: checked })} />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={saving}>
                {saving ? "Saving..." : isEdit ? "Save Changes" : "Create Schedule"}
              </Button>
            </div>
          </form>
        </ScrollArea>
      </div>
    </div>
  )
}

