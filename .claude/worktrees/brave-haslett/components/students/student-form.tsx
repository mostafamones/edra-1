"use client"

import { useEffect, useMemo, memo, useCallback } from "react"
import { useForm, useWatch, type FieldPath, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
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
import { swatchClassForColorId } from "../shared/academy-structure/utils"

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
  enrolledScheduleId: z.number().nullable().optional(),
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
    enrolledScheduleId: scheduleIds[0] ?? null,
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

  const availableSchedules = (schedules as any[]).filter((s: any) => {
    if (s.is_active === false) return false
    if (s.is_mandatory) return false
    if (levelId && s.level_id && s.level_id.toString() !== levelId) return false
    if (groupId && s.group_id && s.group_id.toString() !== groupId) return false
    return true
  })

  const shouldShowSchedules =
    levelId &&
    (availableGroups.length === 0 || groupId) &&
    availableSchedules.length > 0

  const requiredFields = fields.filter((f) => f.is_required)
  const optionalFields = fields.filter((f) => !f.is_required)

  const handleScheduleChange = useCallback(
    (value: string) => {
      form.setValue("enrolledScheduleId", parseInt(value, 10), { shouldDirty: true })
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
      let savedStudentId: number

      if (initialStudent) {
        const res = await fetch(`/api/students/${initialStudent.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(studentPayload),
        })
        if (!res.ok) {
          const errBody = await res.json().catch(() => null)
          throw new Error(errBody?.error || "Failed to update student")
        }
        savedStudentId = initialStudent.id
        toast.success("Student updated")
      } else {
        const res = await fetch(`/api/students`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(studentPayload),
        })
        if (!res.ok) {
          const errBody = await res.json().catch(() => null)
          throw new Error(errBody?.error || "Failed to create student")
        }
        const created = await res.json()
        savedStudentId = created.id
        toast.success("Student created")
      }

      const enrolledScheduleId = values.enrolledScheduleId

      if (initialStudent) {
        const currentIds = new Set(
          (initialStudent.schedule_enrollments || [])
            .map((ss) => ss.schedule?.id)
            .filter(Boolean) as number[]
        )

        if (enrolledScheduleId && !currentIds.has(enrolledScheduleId)) {
          await fetch(`/api/students/${savedStudentId}/groups`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ scheduleId: enrolledScheduleId, academyId }),
          })
        }

        for (const schedId of currentIds) {
          if (schedId !== enrolledScheduleId) {
            await fetch(`/api/students/${savedStudentId}/groups`, {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ scheduleId: schedId, academyId }),
            })
          }
        }
      } else if (enrolledScheduleId) {
        await fetch(`/api/students/${savedStudentId}/groups`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scheduleId: enrolledScheduleId, academyId }),
        })
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

  return (
    <Form {...form}>
      <form id="student-form" onSubmit={onSubmit} className="space-y-4 w-full max-w-xl">
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

        {shouldShowSchedules && (
          <>
            <Separator />
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Schedule Enrollment
                </h3>
                <span className="text-[11px] text-muted-foreground">
                  {form.watch("enrolledScheduleId") ? "1 selected" : "0 selected"}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground -mt-2">
                Select a schedule for this student. Mandatory sessions are auto-assigned.
              </p>
              <FormField
                control={form.control}
                name="enrolledScheduleId"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <RadioGroup
                        value={
                          field.value != null ? String(field.value) : ""
                        }
                        onValueChange={(v) => field.onChange(parseInt(v, 10))}
                        className="gap-2"
                      >
                        {availableSchedules.map((schedule: any) => {
                          const isEnrolled = field.value === schedule.id
                          return (
                            <label
                              key={schedule.id}
                              htmlFor={`schedule-${schedule.id}`}
                              className={`flex items-center gap-3 w-full p-3 rounded-lg border text-left text-sm transition-colors cursor-pointer ${
                                isEnrolled
                                  ? "border-primary/40 bg-primary/5"
                                  : "border-input hover:bg-muted/30"
                              }`}
                            >
                              <RadioGroupItem
                                value={schedule.id.toString()}
                                id={`schedule-${schedule.id}`}
                              />
                              <div className="flex-1">
                                <p
                                  className={`font-medium truncate ${
                                    isEnrolled ? "text-primary" : ""
                                  }`}
                                >
                                  {schedule.name}
                                </p>
                                <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                                  {(schedule.time_slots || []).map(
                                    (slot: any, idx: number) => {
                                      const start = formatTime(slot.start_time)
                                      const end = formatTime(slot.end_time)
                                      return (
                                        <Badge
                                          key={idx}
                                          variant="outline"
                                          className="text-xs py-0 px-1 font-normal"
                                        >
                                          {formatDay(slot.day_of_week)} {start}
                                          {end && ` - ${end}`}
                                        </Badge>
                                      )
                                    }
                                  )}
                                </div>
                              </div>
                            </label>
                          )
                        })}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </>
        )}

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
    <div className="grid grid-cols-4 w-full">
      <div className="flex justify-center items-center col-span-3">
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
      <div className="col-span-1 border-l p-4 lg:p-6" />
    </div>
  )
})
