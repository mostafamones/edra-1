"use client"

import { useEffect, useMemo, memo, useCallback } from "react"
import { useForm, useWatch, type FieldPath, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import type { StudentWithLevelRating, StudentField, Level, Group, Schedule } from "@/lib/types"
import {
  useLevels,
  useGroups,
  useFields,
  useSchedules,
} from "@/lib/hooks/use-data"
import { DataSkeleton } from "@/components/ui/data-skeleton"
import { DateInput, NumberInput, PhoneInput, TextInput } from "@/components/ui/app-input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { cn } from "@/lib/utils"
import { swatchClassForColorId } from "@/components/helpers/academy-utils"
import { IconCalendarEvent } from "@tabler/icons-react"
import { Toggle } from "../ui/toggle"
import { api, ApiError } from "@/lib/api/client"
import { getErrorMessage } from "@/lib/get-error-message"

// ─── Types ─────────────────────────────────────────────────────

export interface StudentFormProps {
  academyId: string
  initialStudent?: StudentWithLevelRating | null
  onSuccess?: () => void
  onCancel?: () => void
}

const baseStudentFormSchema = z.object({
  full_name: z.string().min(1, "Student name is required"),
  level_id: z.string().min(1, "Level is required"),
  group_id: z.string().optional().default(""),
  enrolledScheduleIds: z.array(z.number()).default([]),
  fields: z.record(z.string(), z.any()).default({}),
})

export type StudentFormValues = z.infer<typeof baseStudentFormSchema>

// ─── Helpers ───────────────────────────────────────────────────

function formatTime(timeStr?: string) {
  if (!timeStr) return null
  const [h, m] = timeStr.split(":")
  if (!h || !m) return null
  const date = new Date()
  date.setHours(parseInt(h, 10), parseInt(m, 10), 0)
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
}

function formatDay(day: 0 | 1 | 2 | 3 | 4 | 5 | 6) {
  const days: Record<number, string> = {
    0: "Sunday", 1: "Monday", 2: "Tuesday", 3: "Wednesday",
    4: "Thursday", 5: "Friday", 6: "Saturday",
  }
  return days[day] ?? null
}

type ScheduleRow = Schedule & {
  auto_assign?: boolean
  is_mandatory?: boolean
  time_slots?: Array<{
    day_of_week: 0 | 1 | 2 | 3 | 4 | 5 | 6
    start_time: string
    end_time?: string
  }>
}

function scheduleMatchesStudent(
  s: ScheduleRow,
  levelId: string,
  groupId: string
): boolean {
  if (s.is_active === false) return false
  if (levelId && s.level_id && s.level_id.toString() !== levelId) return false
  // If a schedule is tied to a specific group, don't show/auto-assign it until a group is chosen.
  if (!groupId && s.group_id != null) return false
  if (groupId && s.group_id && s.group_id.toString() !== groupId) return false
  return true
}

function buildStudentFormSchema(fields: StudentField[]) {
  return baseStudentFormSchema.superRefine((data, ctx) => {
    for (const field of fields.filter((f) => f.is_required)) {
      if (field.field_type === "boolean") continue
      const v = data.fields?.[String(field.id)]
      const empty =
        v === "" ||
        v === null ||
        v === undefined ||
        (typeof v === "number" && Number.isNaN(v))
      if (empty) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${field.name} is required`,
          path: ["fields", String(field.id)],
        })
      }
    }
  })
}

function buildDefaultValues(
  initialStudent: StudentWithLevelRating | null | undefined,
  fieldsList: StudentField[]
): StudentFormValues {
  const fv: Record<string, string | number | boolean | Date | undefined> = {}
  if (initialStudent?.student_field_values) {
    for (const raw of initialStudent.student_field_values) {
      const field = fieldsList.find((f) => f.id === raw.field_id)
      const fieldType = field?.field_type || "text"
      let value: unknown = (raw.value as unknown) ?? ""
      if (fieldType === "boolean") {
        if (value === "true" || value === "1" || value === "Yes") value = true
        else if (value === "false" || value === "0" || value === "No") value = false
        else value = !!value
      }
      fv[String(raw.field_id)] = value as string | number | boolean | Date | undefined
    }
  }

  const scheduleIds = (initialStudent?.schedule_enrollments || [])
    .map((ss) => ss.schedule?.id)
    .filter(Boolean) as number[]

  return {
    full_name: initialStudent?.full_name ?? "",
    level_id: initialStudent?.level_id?.toString() ?? "",
    group_id: initialStudent?.group_id?.toString() ?? "",
    enrolledScheduleIds: scheduleIds,
    fields: fv,
  }
}

// ─── Inner form (remounts when field definitions / student identity change) ─

type StudentFormFieldsProps = StudentFormProps & {
  fields: StudentField[]
  levels: Level[]
  groups: Group[]
  schedules: Schedule[]
}

const StudentFormFields = memo(function StudentFormFields({
  academyId,
  initialStudent,
  onSuccess,
  onCancel,
  fields,
  levels,
  groups,
  schedules,
}: StudentFormFieldsProps) {
  const schema = useMemo(() => buildStudentFormSchema(fields), [fields])
  const defaultValues = useMemo(
    () => buildDefaultValues(initialStudent, fields),
    [initialStudent, fields]
  )

  const form = useForm<StudentFormValues>({
    resolver: zodResolver(schema) as Resolver<StudentFormValues>,
    defaultValues,
  })

  useEffect(() => {
    form.reset(defaultValues)
  }, [defaultValues, form])

  const levelId = useWatch({ control: form.control, name: "level_id" })
  const groupId = useWatch({ control: form.control, name: "group_id" })

  const selectedLevelId = parseInt(levelId || "0", 10)
  const availableGroups = groups.filter((g) => g.level_id === selectedLevelId)

  const scheduleRows = schedules as ScheduleRow[]

  // All active schedules for the selected level — shown regardless of group selection
  const levelSchedules = useMemo(() => {
    if (!levelId) return []
    return scheduleRows.filter((s) => {
      if (s.is_active === false) return false
      if (s.level_id && s.level_id.toString() !== levelId) return false
      return true
    })
  }, [scheduleRows, levelId])

  // Auto-assign schedules: must fully match (level + group) before being enrolled automatically
  const autoAssignSchedules = useMemo(
    () =>
      levelSchedules.filter(
        (s) => s.auto_assign === true && scheduleMatchesStudent(s, levelId, groupId)
      ),
    [levelSchedules, levelId, groupId]
  )

  // Every other level schedule the user can manually enroll in.
  // When a group is selected, hide auto-assign schedules tied to a different group —
  // they won't auto-enroll and showing them would be confusing.
  const otherSchedules = useMemo(() => {
    const autoIds = new Set(autoAssignSchedules.map((s) => s.id))
    return levelSchedules.filter((s) => {
      if (autoIds.has(s.id)) return false
      if (s.is_mandatory === true) return false
      if (groupId && s.auto_assign === true && s.group_id && s.group_id.toString() !== groupId)
        return false
      return true
    })
  }, [levelSchedules, autoAssignSchedules, groupId])

  /** Keep the 3+1 layout whenever the academy has schedules; empty states explain what to do next. */
  const hasScheduleSidebar = scheduleRows.length > 0
  const canPickSchedules = !!levelId
  const hasScheduleCards = canPickSchedules && levelSchedules.length > 0

  const requiredFields = fields.filter((f) => f.is_required)
  const optionalFields = fields.filter((f) => !f.is_required)

  const allowedScheduleIdsKey = useMemo(() => {
    if (!levelId) return ""
    return levelSchedules
      .map((s) => s.id)
      .sort((a, b) => a - b)
      .join(",")
  }, [levelSchedules, levelId])

  const autoAssignIdsKey = useMemo(() => {
    if (!levelId) return ""
    return autoAssignSchedules
      .map((s) => s.id)
      .sort((a, b) => a - b)
      .join(",")
  }, [autoAssignSchedules, levelId])

  // Auto-assign schedules are toggled on by default once level is chosen.
  useEffect(() => {
    if (!levelId) return
    // NOTE: Guard heavily to avoid update loops.
    const allowedIds = new Set<number>(levelSchedules.map((s) => s.id))
    const autoAssignIds = new Set<number>(autoAssignSchedules.map((s) => s.id))
    // All auto-assign IDs for this level, regardless of group match
    const allLevelAutoAssignIds = new Set<number>(
      levelSchedules.filter((s) => s.auto_assign === true).map((s) => s.id)
    )

    const cur = (form.getValues("enrolledScheduleIds") ?? []).filter((id) => allowedIds.has(id))
    const desiredSet = new Set<number>(cur)
    // Remove stale auto-assigns (e.g. group changed, old auto-assign no longer matches)
    for (const id of allLevelAutoAssignIds) {
      if (!autoAssignIds.has(id)) desiredSet.delete(id)
    }
    // Add currently matching auto-assigns
    for (const id of autoAssignIds) desiredSet.add(id)

    const next = [...desiredSet].sort((a, b) => a - b)
    const curSorted = [...cur].sort((a, b) => a - b)

    let changed = next.length !== curSorted.length
    if (!changed) {
      for (let i = 0; i < next.length; i++) {
        if (next[i] !== curSorted[i]) {
          changed = true
          break
        }
      }
    }

    if (changed) {
      form.setValue("enrolledScheduleIds", next, { shouldDirty: true })
    }
  }, [levelId, allowedScheduleIdsKey, autoAssignIdsKey, form, groupId])

  const toggleScheduleEnrollment = useCallback(
    (scheduleId: number, checked: boolean) => {
      const cur = form.getValues("enrolledScheduleIds") ?? []
      if (checked) {
        form.setValue(
          "enrolledScheduleIds",
          [...new Set([...cur, scheduleId])],
          { shouldDirty: true }
        )
      } else {
        form.setValue(
          "enrolledScheduleIds",
          cur.filter((id) => id !== scheduleId),
          { shouldDirty: true }
        )
      }
    },
    [form]
  )

  const onSubmit = form.handleSubmit(async (values) => {
    const fieldValuesPayload = Object.entries(values.fields || {})
      .filter(([, v]) => v !== "" && v !== null && v !== undefined)
      .map(([fieldIdStr, value]) => {
        const fieldId = parseInt(fieldIdStr, 10)
        const fieldMeta = fields.find((f) => f.id === fieldId)
        return {
          field_id: fieldId,
          field_type: fieldMeta?.field_type ?? "text",
          value: String(value),
        }
      })

    const studentPayload = {
      full_name: values.full_name.trim(),
      level_id: parseInt(values.level_id, 10),
      group_id: values.group_id ? parseInt(values.group_id, 10) : null,
      academy_id: academyId,
      fieldValues: fieldValuesPayload,
    }

    try {
      const allowedScheduleIds = new Set<number>(levelSchedules.map((s) => s.id))
      const desiredIds = new Set(
        (values.enrolledScheduleIds ?? []).filter((id) => allowedScheduleIds.has(id))
      )

      let savedStudentId: number

      if (initialStudent) {
        await api.put(`/api/students/${initialStudent.id}`, studentPayload)
        savedStudentId = initialStudent.id
        toast.success("Student updated")
      } else {
        const created = await api.post<{ id: number }>(`/api/students`, studentPayload)
        savedStudentId = created.id
        toast.success("Student created")
      }

      if (initialStudent) {
        const currentIds = new Set(
          (initialStudent.schedule_enrollments || [])
            .map((ss) => ss.schedule?.id)
            .filter(Boolean) as number[]
        )

        for (const id of desiredIds) {
          if (!currentIds.has(id)) {
            await api.post(`/api/students/${savedStudentId}/groups`, {
              scheduleId: id,
              academyId,
            })
          }
        }

        for (const id of currentIds) {
          if (!desiredIds.has(id)) {
            await api.delete(`/api/students/${savedStudentId}/groups`, {
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ scheduleId: id }),
            })
          }
        }
      } else {
        for (const scheduleId of desiredIds) {
          await api.post(`/api/students/${savedStudentId}/groups`, {
            scheduleId,
            academyId,
          })
        }
      }

      if (!initialStudent) {
        form.reset(defaultValues)
      }
      onSuccess?.()
    } catch (err: unknown) {
      console.error(err)
      const message = err instanceof Error ? err.message : "Request failed"
      toast.error(
        message || (initialStudent ? "Could not update student" : "Could not create student")
      )
    }
  })

  const renderCustomField = (field: StudentField) => {
    const name = `fields.${field.id}` as FieldPath<StudentFormValues>

    switch (field.field_type) {
      case "boolean":
        return (
          <FormField
            key={field.id}
            control={form.control}
            name={name}
            render={({ field: formField }) => (
              <FormItem>
                <div className="flex flex-row items-center justify-between rounded-lg border border-input p-3 gap-3">
                  <FormLabel>
                    <p>{field.name} {field.is_required && <span className="text-destructive">*</span>}</p>
                  </FormLabel>
                  <FormControl>
                    <Switch checked={!!formField.value} onCheckedChange={formField.onChange} />
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        )
      case "number":
        return (
          <FormField
            key={field.id}
            control={form.control}
            name={name}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>
                  <p>{field.name} {field.is_required && <span className="text-destructive">*</span>}</p>
                </FormLabel>
                <FormControl>
                  <NumberInput
                    {...formField}
                    value={formField.value ?? ""}
                    onChange={formField.onChange}
                    label={undefined}
                    placeholder={`Enter ${field.name.toLowerCase()}`}
                    required={!!field.is_required}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )
      case "date":
        return (
          <FormField
            key={field.id}
            control={form.control}
            name={name}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>
                  <p>{field.name} {field.is_required && <span className="text-destructive">*</span>}</p>
                </FormLabel>
                <FormControl>
                  <DateInput
                    ref={formField.ref}
                    name={formField.name}
                    value={
                      formField.value instanceof Date ||
                        typeof formField.value === "string" ||
                        formField.value == null
                        ? formField.value
                        : undefined
                    }
                    onBlur={formField.onBlur}
                    onSelect={formField.onChange}
                    label={undefined}
                    required={!!field.is_required}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )
      case "phone":
        return (
          <FormField
            key={field.id}
            control={form.control}
            name={name}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>
                  <p>{field.name} {field.is_required && <span className="text-destructive">*</span>}</p>
                </FormLabel>
                <FormControl>
                  <PhoneInput
                    {...formField}
                    value={formField.value ?? ""}
                    label={undefined}
                    placeholder={`Enter ${field.name.toLowerCase()}`}
                    required={!!field.is_required}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )
      default:
        return (
          <FormField
            key={field.id}
            control={form.control}
            name={name}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>
                  <p>{field.name}{field.is_required && <span className="text-destructive">*</span>}</p>
                </FormLabel>
                <FormControl>
                  <TextInput
                    ref={formField.ref}
                    name={formField.name}
                    value={typeof formField.value === "string" ? formField.value : ""}
                    onBlur={formField.onBlur}
                    onChange={formField.onChange}
                    label={undefined}
                    placeholder={`Enter ${field.name.toLowerCase()}`}
                    required={!!field.is_required}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )
    }
  }

  const saving = form.formState.isSubmitting
  const enrolledIds = form.watch("enrolledScheduleIds") ?? []

  const handleScheduleCardClick = (schedule: ScheduleRow, checked: boolean) => {
    if (checked && schedule.auto_assign === true && schedule.group_id) {
      // Auto-assign with a group: set the group and let the auto-assign effect handle enrollment
      form.setValue("group_id", String(schedule.group_id), { shouldDirty: true })
    } else {
      toggleScheduleEnrollment(schedule.id, checked)
    }
  }

  const renderScheduleCard = (schedule: ScheduleRow) => {
    const isOn = enrolledIds.includes(schedule.id)
    const groupName = schedule.group_id
      ? groups.find((g) => g.id === schedule.group_id)?.name
      : null
    const isAutoAssign = schedule.auto_assign === true

    return (
      <Toggle
        key={schedule.id}
        variant="outline"
        type="button"
        className={cn(
          "w-full h-auto py-2.5 px-3 text-left rounded-md border transition-colors",
          "hover:bg-muted/40",
          isOn ? "border-border bg-muted/40" : "border-border/50 bg-transparent"
        )}
        pressed={isOn}
        onPressedChange={(checked) => handleScheduleCardClick(schedule, checked)}
      >
        <div className="flex items-start justify-between w-full gap-2.5 min-w-0">
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-1.5">
              <p className="font-medium text-sm truncate text-foreground leading-tight">
                {schedule.name}
              </p>
              {isAutoAssign && (
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 h-4 font-normal shrink-0 text-muted-foreground border-muted-foreground/30"
                >
                  auto
                </Badge>
              )}
            </div>
            {groupName && (
              <p className="text-[11px] text-muted-foreground leading-tight">
                {groupName}
              </p>
            )}
            {(schedule.time_slots || []).length > 0 && (
              <div className="flex flex-col gap-0.5">
                {(schedule.time_slots || []).map((slot, idx) => {
                  const start = formatTime(slot.start_time)
                  const end = formatTime(slot.end_time)
                  return (
                    <span key={idx} className="text-[11px] text-muted-foreground leading-tight">
                      {formatDay(slot.day_of_week)}
                      {start && ` · ${start}`}
                      {end && `–${end}`}
                    </span>
                  )
                })}
              </div>
            )}
          </div>
          <div
            className={cn(
              "shrink-0 size-3.5 mt-0.5 rounded-sm border transition-colors",
              isOn
                ? "border-foreground/40 bg-foreground/12"
                : "border-muted-foreground/25 bg-transparent"
            )}
          />
        </div>
      </Toggle>
    )
  }

  return (
    <Form {...form}>
      <form
        id="student-form"
        onSubmit={onSubmit}
        className="grid grid-cols-1 md:grid-cols-4 w-full max-w-full items-start gap-0"
      >
        <div
          className={cn(
            "flex flex-col justify-center items-center px-4 lg:px-6 py-8",
            hasScheduleSidebar
              ? "md:col-span-3 md:min-h-[calc(100vh-var(--header-height)-2rem)]"
              : "md:col-span-4"
          )}
        >
          <div className="space-y-4 w-full max-w-xl">
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase">
            Personal Information
          </h3>
          <FormField
            control={form.control}
            name="full_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  <p>Full Name <span className="text-destructive">*</span></p>
                </FormLabel>
                <FormControl>
                  <TextInput
                    {...field}
                    value={field.value ?? ""}
                    label={undefined}
                    placeholder="e.g. Mostafa Ahmed"
                    required
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {requiredFields.map((field) => (
            <div key={field.id}>{renderCustomField(field)}</div>
          ))}
        </div>

        <Separator />

        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase">
            Academic Assignment
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="level_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    <p>Level <span className="text-destructive">*</span></p>
                  </FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(val) => {
                      field.onChange(val)
                      form.setValue("group_id", "")
                      form.setValue("enrolledScheduleIds", [], { shouldDirty: true })
                    }}
                  >
                    <FormControl>
                      <SelectTrigger id="student-level" className="w-full !h-10">
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="p-1">
                      {levels.map((l) => (
                        <SelectItem key={l.id} value={l.id.toString()} className="h-9">
                          <>
                            <div className={cn(`size-1.5 rounded-full ml-1`, swatchClassForColorId(l.color))} />
                            {l.name}
                          </>
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
                    value={field.value}
                    onValueChange={(val) =>
                      field.onChange(val === "__none__" ? "" : val)
                    }
                    disabled={!levelId || availableGroups.length === 0}
                  >
                    <FormControl>
                      <SelectTrigger id="student-group" className="w-full !h-10">
                        <SelectValue
                          placeholder={
                            availableGroups.length === 0 ? "No groups" : "Select group"
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="p-1">
                      <SelectItem value="__none__">None</SelectItem>
                      {availableGroups.map((g) => (
                        <SelectItem key={g.id} value={g.id.toString()}>
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
        </div>

        {optionalFields.length > 0 && (
          <>
            <Separator />
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase">
                Optional Information
              </h3>
              {optionalFields.map((field) => (
                <div key={field.id}>{renderCustomField(field)}</div>
              ))}
            </div>
          </>
        )}

        <div className="flex gap-3 pt-2">
          {onCancel && (
            <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" className="flex-1" disabled={saving}>
            {saving ? "Saving..." : initialStudent ? "Save Changes" : "Add Student"}
          </Button>
        </div>
          </div>
        </div>

        {hasScheduleSidebar && (
          <aside className="md:col-span-1 border-t md:border-t-0 md:border-l border-border p-4 md:p-6 md:sticky md:top-[calc(var(--header-height)+1rem)] md:h-[calc(100vh-var(--header-height)-2rem)] flex flex-col gap-4 overflow-hidden">
            <div className="shrink-0 space-y-1">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Schedule enrollment
              </h3>
              <p className="text-[11px] text-muted-foreground">
                {enrolledIds.length} selected
              </p>
            </div>
            <div className="flex-1 overflow-y-auto min-h-0 space-y-4 pr-1">
              {!canPickSchedules && (
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Select a level to see schedules this student can join.
                </p>
              )}
              {canPickSchedules && !hasScheduleCards && (
                <p className="text-xs text-muted-foreground leading-relaxed">
                  No schedules match this level and group. You can still save the student and add
                  schedules later.
                </p>
              )}
              {hasScheduleCards && (
                <>
                  {autoAssignSchedules.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                        Auto-assign sessions
                      </p>
                      <div className="space-y-2">{autoAssignSchedules.map(renderScheduleCard)}</div>
                    </div>
                  )}
                  {autoAssignSchedules.length > 0 && otherSchedules.length > 0 && (
                    <Separator className="my-1" />
                  )}
                  {otherSchedules.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                        Other sessions
                      </p>
                      <div className="space-y-2">{otherSchedules.map(renderScheduleCard)}</div>
                    </div>
                  )}
                </>
              )}
            </div>
          </aside>
        )}
      </form>
    </Form>
  )
})

// ─── Shell (data loading + remount key for resolver / defaults) ─
export const StudentForm = memo(function StudentForm({
  academyId,
  initialStudent,
  onSuccess,
  onCancel,
}: StudentFormProps) {
  const { data: levelsData, loading: loadingLevels, error: errorLevels } = useLevels(academyId)
  const { data: groupsData, loading: loadingGroups, error: errorGroups } = useGroups(academyId)
  const { data: fieldsDataRaw, loading: loadingFields, error: errorFields } = useFields(academyId)
  const { data: schedulesData, loading: loadingSchedules, error: errorSchedules } =
    useSchedules(academyId)

  const levels = levelsData ?? []
  const groups = groupsData ?? []
  const schedules = schedulesData ?? []

  const fields = useMemo(
    () => (fieldsDataRaw ?? []).filter((f) => f.is_active !== false),
    [fieldsDataRaw]
  )

  const loadingMeta =
    loadingLevels || loadingGroups || loadingFields || loadingSchedules

  useEffect(() => {
    const err = errorLevels || errorGroups || errorFields || errorSchedules
    if (err) toast.error("Failed to load form data")
  }, [errorLevels, errorGroups, errorFields, errorSchedules])

  const fieldsKey = fields.map((f) => f.id).join(",")

  if (loadingMeta) {
    return <DataSkeleton variant="form" count={6} showHeader={false} />
  }

  return (
    <div className="w-full">
      <StudentFormFields
        key={`${initialStudent?.id ?? "new"}-${fieldsKey}`}
        academyId={academyId}
        initialStudent={initialStudent}
        onSuccess={onSuccess}
        onCancel={onCancel}
        fields={fields}
        levels={levels}
        groups={groups}
        schedules={schedules}
      />
    </div>
  )
})
