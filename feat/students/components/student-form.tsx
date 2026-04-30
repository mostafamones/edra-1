"use client"

import { memo, useCallback, useEffect, useMemo } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useWatch, type Resolver } from "react-hook-form"
import { toast } from "sonner"

import { DataSkeleton } from "@/components/ui/data-skeleton"
import { Form } from "@/components/ui/form"
import { api } from "@/lib/api/client"
import { useFields, useGroups, useLevels, useSchedules } from "@/lib/hooks/use-data"
import type { Group, Level, Schedule, StudentField } from "@/lib/types"

import type { StudentFormProps } from "../types"
import {
  buildDefaultValues,
  buildStudentFormSchema,
  getAutoAssignSchedules,
  getAvailableGroups,
  getLevelSchedules,
  getOtherSchedules,
  type StudentFormValues,
  type StudentScheduleRow,
} from "../utils/student-form"
import { StudentFormContent } from "./form/student-form-content"
import { StudentScheduleSidebar } from "./form/student-schedule-sidebar"
import { cn } from "@/lib/utils"

type StudentFormFieldsProps = StudentFormProps & {
  fields: StudentField[]
  groups: Group[]
  levels: Level[]
  schedules: Schedule[]
}

const StudentFormFields = memo(function StudentFormFields({
  academyId,
  fields,
  groups,
  initialStudent,
  levels,
  onCancel,
  onSuccess,
  schedules,
}: StudentFormFieldsProps) {
  const schema = useMemo(() => buildStudentFormSchema(fields), [fields])
  const defaultValues = useMemo(() => buildDefaultValues(initialStudent, fields), [fields, initialStudent])
  const form = useForm<StudentFormValues>({
    resolver: zodResolver(schema) as Resolver<StudentFormValues>,
    defaultValues,
  })

  useEffect(() => {
    form.reset(defaultValues)
  }, [defaultValues, form])

  const levelId = useWatch({ control: form.control, name: "level_id" })
  const groupId = useWatch({ control: form.control, name: "group_id" })
  const scheduleRows = schedules as StudentScheduleRow[]

  const availableGroups = useMemo(() => getAvailableGroups(groups, levelId), [groups, levelId])
  const levelSchedules = useMemo(() => getLevelSchedules(scheduleRows, levelId), [levelId, scheduleRows])
  const autoAssignSchedules = useMemo(
    () => getAutoAssignSchedules(levelSchedules, levelId, groupId),
    [groupId, levelId, levelSchedules]
  )
  const otherSchedules = useMemo(
    () => getOtherSchedules(levelSchedules, autoAssignSchedules, groupId),
    [autoAssignSchedules, groupId, levelSchedules]
  )

  const hasScheduleSidebar = scheduleRows.length > 0
  const canPickSchedules = !!levelId
  const hasScheduleCards = canPickSchedules && levelSchedules.length > 0
  const requiredFields = fields.filter((field) => field.is_required)
  const optionalFields = fields.filter((field) => !field.is_required)

  const allowedScheduleIdsKey = useMemo(
    () =>
      levelId
        ? levelSchedules
            .map((schedule) => schedule.id)
            .sort((left, right) => left - right)
            .join(",")
        : "",
    [levelId, levelSchedules]
  )
  const autoAssignIdsKey = useMemo(
    () =>
      levelId
        ? autoAssignSchedules
            .map((schedule) => schedule.id)
            .sort((left, right) => left - right)
            .join(",")
        : "",
    [autoAssignSchedules, levelId]
  )

  useEffect(() => {
    if (!levelId) return

    const allowedIds = new Set<number>(levelSchedules.map((schedule) => schedule.id))
    const autoAssignIds = new Set<number>(autoAssignSchedules.map((schedule) => schedule.id))
    const allLevelAutoAssignIds = new Set<number>(
      levelSchedules.filter((schedule) => schedule.auto_assign === true).map((schedule) => schedule.id)
    )

    const current = (form.getValues("enrolledScheduleIds") ?? []).filter((id) => allowedIds.has(id))
    const desired = new Set<number>(current)

    for (const id of allLevelAutoAssignIds) {
      if (!autoAssignIds.has(id)) desired.delete(id)
    }
    for (const id of autoAssignIds) {
      desired.add(id)
    }

    const next = [...desired].sort((left, right) => left - right)
    const currentSorted = [...current].sort((left, right) => left - right)
    const changed =
      next.length !== currentSorted.length ||
      next.some((value, index) => value !== currentSorted[index])

    if (changed) {
      form.setValue("enrolledScheduleIds", next, { shouldDirty: true })
    }
  }, [allowedScheduleIdsKey, autoAssignIdsKey, autoAssignSchedules, form, levelId, levelSchedules])

  const toggleScheduleEnrollment = useCallback(
    (scheduleId: number, checked: boolean) => {
      const current = form.getValues("enrolledScheduleIds") ?? []
      form.setValue(
        "enrolledScheduleIds",
        checked
          ? [...new Set([...current, scheduleId])]
          : current.filter((id) => id !== scheduleId),
        { shouldDirty: true }
      )
    },
    [form]
  )

  const onSubmit = form.handleSubmit(async (values) => {
    const fieldValuesPayload = Object.entries(values.fields || {})
      .filter(([, value]) => value !== "" && value !== null && value !== undefined)
      .map(([fieldId, value]) => {
        const fieldMeta = fields.find((field) => field.id === parseInt(fieldId, 10))
        return {
          field_id: parseInt(fieldId, 10),
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
      const allowedScheduleIds = new Set<number>(levelSchedules.map((schedule) => schedule.id))
      const desiredIds = new Set(
        (values.enrolledScheduleIds ?? []).filter((id) => allowedScheduleIds.has(id))
      )

      let savedStudentId: number

      if (initialStudent) {
        await api.put(`/api/students/${initialStudent.id}`, studentPayload)
        savedStudentId = initialStudent.id
        toast.success("Student updated")
      } else {
        const created = await api.post<{ id: number }>("/api/students", studentPayload)
        savedStudentId = created.id
        toast.success("Student created")
      }

      if (initialStudent) {
        const currentIds = new Set(
          (initialStudent.schedule_enrollments || [])
            .map((enrollment) => enrollment.schedule?.id)
            .filter(Boolean) as number[]
        )

        for (const id of desiredIds) {
          if (!currentIds.has(id)) {
            await api.post(`/api/students/${savedStudentId}/groups`, { scheduleId: id, academyId })
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
          await api.post(`/api/students/${savedStudentId}/groups`, { scheduleId, academyId })
        }
      }

      if (!initialStudent) {
        form.reset(defaultValues)
      }

      onSuccess?.()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Request failed"
      toast.error(
        message || (initialStudent ? "Could not update student" : "Could not create student")
      )
    }
  })

  const enrolledIds = form.watch("enrolledScheduleIds") ?? []
  const saving = form.formState.isSubmitting

  return (
    <Form {...form}>
      <form
        id="student-form"
        onSubmit={onSubmit}
        className="grid w-full max-w-full grid-cols-1 items-start h-full gap-0 md:grid-cols-4"
      >
        <div className={cn("h-full flex items-center justify-center", hasScheduleSidebar ? "md:col-span-3" : "md:col-span-4")}>
          <StudentFormContent
            availableGroups={availableGroups}
            form={form}
            initialStudentId={initialStudent?.id}
            levelId={levelId}
            levels={levels}
            onCancel={onCancel}
            optionalFields={optionalFields}
            requiredFields={requiredFields}
            saving={saving}
          />
        </div>

        <StudentScheduleSidebar
          autoAssignSchedules={autoAssignSchedules}
          canPickSchedules={canPickSchedules}
          enrolledIds={enrolledIds}
          groups={groups}
          hasScheduleCards={hasScheduleCards}
          hasScheduleSidebar={hasScheduleSidebar}
          onScheduleCardClick={(schedule, checked) => {
            if (checked && schedule.auto_assign === true && schedule.group_id) {
              form.setValue("group_id", String(schedule.group_id), { shouldDirty: true })
              return
            }

            toggleScheduleEnrollment(schedule.id, checked)
          }}
          otherSchedules={otherSchedules}
        />
      </form>
    </Form>
  )
})

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

  const fields = useMemo(
    () => (fieldsDataRaw ?? []).filter((field) => field.is_active !== false),
    [fieldsDataRaw]
  )
  const loadingMeta = loadingLevels || loadingGroups || loadingFields || loadingSchedules

  useEffect(() => {
    if (errorLevels || errorGroups || errorFields || errorSchedules) {
      toast.error("Failed to load form data")
    }
  }, [errorFields, errorGroups, errorLevels, errorSchedules])

  if (loadingMeta) {
    return <DataSkeleton variant="form" count={6} showHeader={false} />
  }

  return (
    <div className="w-full">
      <StudentFormFields
        key={`${initialStudent?.id ?? "new"}-${fields.map((field) => field.id).join(",")}`}
        academyId={academyId}
        initialStudent={initialStudent}
        onSuccess={onSuccess}
        onCancel={onCancel}
        fields={fields}
        levels={levelsData ?? []}
        groups={groupsData ?? []}
        schedules={schedulesData ?? []}
      />
    </div>
  )
})
