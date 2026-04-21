"use client"

import type React from "react"
import { useEffect, useMemo } from "react"
import { useForm, useFieldArray, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { format } from "date-fns"
import { IconCalendarEvent, IconPlus, IconTrash } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { cn } from "@/lib/utils"

import type { Group, Level, ScheduleTimeSlot, ScheduleWithRelations } from "@/lib/types"
import { useGroups, useLevels, invalidateSchedules } from "@/lib/hooks/use-data"
import { api } from "@/lib/api/client"
import { getErrorMessage } from "@/lib/get-error-message"

const DAYS_OF_WEEK = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
]

// ─── Schema ───────────────────────────────────────────────────────
// Form-level schema that validates recurring slots vs one-off instances.
// The server schema (`createScheduleSchema`) only sees the flattened
// `time_slots` payload derived from these.

const recurringSlotSchema = z.object({
  day_of_week: z.number().int().min(0).max(6),
  start_time: z.string().min(1),
  end_time: z.string(),
})

const oneOffInstanceSchema = z.object({
  instance_date: z.string(),
  start_time: z.string().min(1),
  end_time: z.string(),
})

const scheduleFormSchema = z
  .object({
    name: z.string().trim().min(1, "Schedule name is required"),
    level_id: z.string(),
    group_id: z.string(),
    schedule_type: z.enum(["recurring", "one_off"]),
    auto_assign: z.boolean(),
    show_on_form: z.boolean(),
    recurring_slots: z.array(recurringSlotSchema),
    one_off_instances: z.array(oneOffInstanceSchema),
  })
  .superRefine((values, ctx) => {
    if (values.schedule_type === "recurring" && values.recurring_slots.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["recurring_slots"],
        message: "Add at least one time slot",
      })
    }
    if (values.schedule_type === "one_off" && values.one_off_instances.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["one_off_instances"],
        message: "Add at least one instance",
      })
    }
    if (values.schedule_type === "one_off") {
      values.one_off_instances.forEach((instance, index) => {
        if (!instance.instance_date) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["one_off_instances", index, "instance_date"],
            message: "Date is required",
          })
        }
      })
    }
  })

type ScheduleFormValues = z.infer<typeof scheduleFormSchema>

export interface ScheduleFormProps {
  academyId: string
  initialSchedule?: ScheduleWithRelations | null
  onSuccess?: () => void
  onCancel?: () => void
}

const makeDefaultValues = (
  initialSchedule?: ScheduleWithRelations | null
): ScheduleFormValues => {
  if (!initialSchedule) {
    return {
      name: "",
      level_id: "",
      group_id: "",
      schedule_type: "recurring",
      auto_assign: false,
      show_on_form: true,
      recurring_slots: [{ day_of_week: 0, start_time: "08:00", end_time: "" }],
      one_off_instances: [{ instance_date: "", start_time: "08:00", end_time: "" }],
    }
  }

  const isOneOff = initialSchedule.schedule_type === "one_off"
  const slots = initialSchedule.time_slots || []

  return {
    name: initialSchedule.name,
    level_id: initialSchedule.level_id?.toString() || "",
    group_id: initialSchedule.group_id?.toString() || "",
    schedule_type: (initialSchedule.schedule_type as "recurring" | "one_off") || "recurring",
    auto_assign: initialSchedule.auto_assign,
    show_on_form: initialSchedule.show_on_form,
    recurring_slots: !isOneOff && slots.length > 0
      ? slots.map((ts: ScheduleTimeSlot) => ({
          day_of_week: ts.day_of_week ?? 0,
          start_time: ts.start_time?.slice(0, 5) || "08:00",
          end_time: ts.end_time?.slice(0, 5) || "",
        }))
      : [{ day_of_week: 0, start_time: "08:00", end_time: "" }],
    one_off_instances: isOneOff && slots.length > 0
      ? slots.map((ts: ScheduleTimeSlot) => ({
          instance_date: ts.instance_date || initialSchedule.one_off_date || "",
          start_time: ts.start_time?.slice(0, 5) || "08:00",
          end_time: ts.end_time?.slice(0, 5) || "",
        }))
      : [{ instance_date: "", start_time: "08:00", end_time: "" }],
  }
}

export function ScheduleForm({
  academyId,
  initialSchedule,
  onSuccess,
  onCancel,
}: ScheduleFormProps) {
  const isEdit = !!initialSchedule

  const { data: levels = [], loading: levelsLoading } = useLevels(academyId)
  const { data: groups = [], loading: groupsLoading } = useGroups(academyId)

  const levelOptions = useMemo(() => (Array.isArray(levels) ? (levels as Level[]) : []), [levels])
  const groupOptions = useMemo(() => (Array.isArray(groups) ? (groups as Group[]) : []), [groups])

  const defaultValues = useMemo(() => makeDefaultValues(initialSchedule), [initialSchedule])

  const form = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleFormSchema) as Resolver<ScheduleFormValues>,
    defaultValues,
  })

  useEffect(() => {
    form.reset(defaultValues)
  }, [defaultValues, form])

  const recurring = useFieldArray({ control: form.control, name: "recurring_slots" })
  const oneOff = useFieldArray({ control: form.control, name: "one_off_instances" })

  const scheduleType = form.watch("schedule_type")
  const autoAssign = form.watch("auto_assign")
  const selectedLevelId = form.watch("level_id")
  const selectedGroupId = form.watch("group_id")
  const isOneOff = scheduleType === "one_off"
  const isSubmitting = form.formState.isSubmitting
  const filteredGroupOptions = useMemo(
    () => groupOptions.filter((group) => group.level_id?.toString() === selectedLevelId),
    [groupOptions, selectedLevelId]
  )
  const groupSelectDisabled =
    groupsLoading || !selectedLevelId || filteredGroupOptions.length === 0

  useEffect(() => {
    if (!selectedLevelId) {
      if (selectedGroupId) {
        form.setValue("group_id", "")
      }
      return
    }

    const hasSelectedGroup = filteredGroupOptions.some(
      (group) => group.id.toString() === selectedGroupId
    )

    if (!hasSelectedGroup && selectedGroupId) {
      form.setValue("group_id", "")
    }
  }, [filteredGroupOptions, form, selectedGroupId, selectedLevelId])

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const timeSlotPayload = values.schedule_type === "one_off"
        ? values.one_off_instances.map((inst) => ({
            instance_date: inst.instance_date,
            start_time: inst.start_time,
            end_time: inst.end_time || null,
            day_of_week: null,
          }))
        : values.recurring_slots.map((ts) => ({
            day_of_week: ts.day_of_week,
            start_time: ts.start_time,
            end_time: ts.end_time || null,
            instance_date: null,
          }))

      const payload = {
        name: values.name.trim(),
        level_id: values.level_id ? parseInt(values.level_id) : null,
        group_id: values.group_id ? parseInt(values.group_id) : null,
        schedule_type: values.schedule_type,
        one_off_date: null,
        auto_assign: values.auto_assign,
        show_on_form: values.show_on_form,
        academy_id: academyId,
        time_slots: timeSlotPayload,
      }

      if (isEdit && initialSchedule) {
        await api.put(`/api/schedules/${initialSchedule.id}`, payload)
        toast.success("Schedule updated")
      } else {
        await api.post("/api/schedules", payload)
        toast.success("Schedule created")
      }
      invalidateSchedules()

      if (!isEdit) {
        form.reset(makeDefaultValues(null))
      }
      onSuccess?.()
    } catch (err) {
      console.error(err)
      toast.error(
        getErrorMessage(err) ||
          (isEdit ? "Could not update schedule" : "Could not create schedule")
      )
    }
  })

  return (
    <Form {...form}>
      <div className="w-full flex justify-center">
        <form onSubmit={onSubmit} className="space-y-4 w-full max-w-xl">
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase">Details</h3>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Schedule Name <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Morning Class A"
                      className="h-10"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Separator />

          <FormField
            control={form.control}
            name="schedule_type"
            render={({ field }) => (
              <FormItem className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground uppercase">Type</h3>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    className={`flex flex-col items-center gap-1 p-3 rounded-lg border text-sm transition-colors ${
                      field.value === "recurring"
                        ? "border-primary/40 bg-primary/5 text-primary"
                        : "border-input hover:bg-muted/30"
                    }`}
                    onClick={() => field.onChange("recurring")}
                  >
                    <span className="font-medium">Recurring</span>
                    <span className="text-[11px] text-muted-foreground">Repeats weekly</span>
                  </button>
                  <button
                    type="button"
                    className={`flex flex-col items-center gap-1 p-3 rounded-lg border text-sm transition-colors ${
                      field.value === "one_off"
                        ? "border-primary/40 bg-primary/5 text-primary"
                        : "border-input hover:bg-muted/30"
                    }`}
                    onClick={() => field.onChange("one_off")}
                  >
                    <span className="font-medium">One-off</span>
                    <span className="text-[11px] text-muted-foreground">Specific dates</span>
                  </button>
                </div>
              </FormItem>
            )}
          />

          <Separator />

          {!isOneOff && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-muted-foreground uppercase">Time Slots</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={() =>
                    recurring.append({ day_of_week: 0, start_time: "08:00", end_time: "" })
                  }
                >
                  <IconPlus className="size-3" />
                  Add Slot
                </Button>
              </div>

              <div className="space-y-3">
                {recurring.fields.map((slot, index) => (
                  <div
                    key={slot.id}
                    className="flex items-end gap-2 p-3 rounded-lg border border-input bg-muted/20"
                  >
                    <div className="grid grid-cols-3 items-start gap-2 w-full">
                      <FormField
                        control={form.control}
                        name={`recurring_slots.${index}.day_of_week`}
                        render={({ field }) => (
                          <FormItem className="col-span-1 space-y-1.5">
                            <Label className="text-[11px] text-muted-foreground">Day</Label>
                            <Select
                              value={field.value.toString()}
                              onValueChange={(val) => field.onChange(parseInt(val))}
                            >
                              <FormControl>
                                <SelectTrigger className="w-full !h-10 text-sm">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="p-1">
                                {DAYS_OF_WEEK.map((d) => (
                                  <SelectItem
                                    key={d.value}
                                    value={d.value.toString()}
                                    className="h-9"
                                  >
                                    {d.label}
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
                        name={`recurring_slots.${index}.start_time`}
                        render={({ field }) => (
                          <FormItem className="space-y-1.5">
                            <Label className="text-[11px] text-muted-foreground">Start</Label>
                            <FormControl>
                              <Input type="time" className="h-10 text-xs" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`recurring_slots.${index}.end_time`}
                        render={({ field }) => (
                          <FormItem className="space-y-1.5">
                            <Label className="text-[11px] text-muted-foreground">End</Label>
                            <FormControl>
                              <Input
                                type="time"
                                className="h-10 text-xs"
                                placeholder="Optional"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    {recurring.fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-10 w-10 mb-[1px] text-muted-foreground hover:text-destructive shrink-0"
                        onClick={() => recurring.remove(index)}
                      >
                        <IconTrash className="size-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              {form.formState.errors.recurring_slots?.message && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.recurring_slots.message}
                </p>
              )}
            </div>
          )}

          {isOneOff && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-muted-foreground uppercase">Instances</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={() =>
                    oneOff.append({ instance_date: "", start_time: "08:00", end_time: "" })
                  }
                >
                  <IconPlus className="size-3" />
                  Add Instance
                </Button>
              </div>

              <p className="text-[11px] text-muted-foreground -mt-2">
                Each instance is a specific date and time this schedule occurs.
              </p>

              <div className="space-y-3">
                {oneOff.fields.map((inst, index) => (
                  <div
                    key={inst.id}
                    className="flex items-end gap-2 p-3 rounded-lg border border-input bg-muted/20"
                  >
                    <div className="grid grid-cols-3 items-start gap-2 w-full">
                      <FormField
                        control={form.control}
                        name={`one_off_instances.${index}.instance_date`}
                        render={({ field }) => (
                          <FormItem className="col-span-1 space-y-1.5 flex flex-col justify-end">
                            <Label className="text-[11px] text-muted-foreground">Date *</Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full !h-10 justify-start text-left font-normal px-3 text-xs",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(new Date(field.value), "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <IconCalendarEvent className="ml-auto h-3.5 w-3.5 opacity-50" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value ? new Date(field.value) : undefined}
                                  onSelect={(date) =>
                                    field.onChange(date ? format(date, "yyyy-MM-dd") : "")
                                  }
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`one_off_instances.${index}.start_time`}
                        render={({ field }) => (
                          <FormItem className="space-y-1.5">
                            <Label className="text-[11px] text-muted-foreground">Start</Label>
                            <FormControl>
                              <Input type="time" className="h-10 text-xs" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`one_off_instances.${index}.end_time`}
                        render={({ field }) => (
                          <FormItem className="space-y-1.5">
                            <Label className="text-[11px] text-muted-foreground">End</Label>
                            <FormControl>
                              <Input
                                type="time"
                                className="h-10 text-xs"
                                placeholder="Optional"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    {oneOff.fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-10 w-10 mb-[1px] text-muted-foreground hover:text-destructive shrink-0"
                        onClick={() => oneOff.remove(index)}
                      >
                        <IconTrash className="size-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              {form.formState.errors.one_off_instances?.message && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.one_off_instances.message}
                </p>
              )}
            </div>
          )}

          <Separator />

          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase">Targeting</h3>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="level_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Level</FormLabel>
                    <Select
                      value={field.value || "__none__"}
                      onValueChange={(val) => {
                        const nextValue = val === "__none__" ? "" : val
                        field.onChange(nextValue)
                        form.setValue("group_id", "")
                      }}
                      disabled={levelsLoading}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full !h-10">
                          <SelectValue placeholder="All Levels" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="p-1">
                        <SelectItem value="__none__" className="h-9">
                          All Levels
                        </SelectItem>
                        {levelOptions.map((l) => (
                          <SelectItem key={l.id} value={l.id.toString()} className="h-9">
                            {l.name}
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
                name="group_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Group</FormLabel>
                    <Select
                      value={field.value || "__none__"}
                      onValueChange={(val) => field.onChange(val === "__none__" ? "" : val)}
                      disabled={groupSelectDisabled}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full !h-10">
                          <SelectValue
                            placeholder={
                              !selectedLevelId
                                ? "Choose a level first"
                                : filteredGroupOptions.length === 0
                                  ? "No groups available"
                                  : "All Groups in this level"
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="p-1">
                        <SelectItem value="__none__" className="h-9">
                          All Groups in this level
                        </SelectItem>
                        {filteredGroupOptions.map((g) => (
                          <SelectItem key={g.id} value={g.id.toString()} className="h-9">
                            {g.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <p className="text-[11px] text-muted-foreground -mt-2">
              Choose a level first, then optionally narrow the schedule to one of that
              level&apos;s groups.
            </p>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase">Behavior</h3>

            <FormField
              control={form.control}
              name="auto_assign"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between rounded-lg border border-input p-3 gap-3">
                    <div>
                      <p className="text-sm font-medium">Auto-assign</p>
                      <p className="text-[11px] text-muted-foreground">
                        Auto-assign matching students to this schedule
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          field.onChange(checked)
                          if (checked) form.setValue("show_on_form", false)
                        }}
                      />
                    </FormControl>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="show_on_form"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between rounded-lg border border-input p-3 gap-3">
                    <div>
                      <p className="text-sm font-medium">Show on Form</p>
                      <p className="text-[11px] text-muted-foreground">
                        Students can see and choose this during enrollment
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={autoAssign}
                      />
                    </FormControl>
                  </div>
                </FormItem>
              )}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : isEdit ? "Save Changes" : "Create Schedule"}
            </Button>
          </div>
        </form>
      </div>
    </Form>
  )
}
