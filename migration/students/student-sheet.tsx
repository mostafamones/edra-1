"use client"

import { useState, useEffect, useCallback, memo } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
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
import { ScrollArea } from "@/components/ui/scroll-area"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { IconUserPlus, IconCheck, IconX } from "@tabler/icons-react"
import type {
  StudentWithLevelRating,
  StudentField,
  Level,
  Branch,
  Schedule,
  StudentFieldValue,
} from "@/lib"

// ─── Types ────────────────────────────────────────────────────

interface StudentSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  student?: StudentWithLevelRating | null
  academyId: string
  onSuccess?: () => void
}

interface FieldValueEntry {
  field_id: number
  field_type: string
  value: any
}

// ─── Component ───────────────────────────────────────────────

function formatTime(timeStr?: string) {
  if (!timeStr) return null;
  const [h, m] = timeStr.split(":");
  if (!h || !m) return null;
  const date = new Date();
  date.setHours(parseInt(h, 10), parseInt(m, 10), 0);
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function formatDay(day: 0 | 1 | 2 | 3 | 4 | 5 | 6) {
  const days = {
    0: "Sunday",
    1: "Monday",
    2: "Tuesday",
    3: "Wednesday",
    4: "Thursday",
    5: "Friday",
    6: "Saturday",
  }
  if (day === null) return null;
  return days[day];
}

export function StudentSheet({
  open,
  onOpenChange,
  student,
  academyId,
  onSuccess,
}: StudentSheetProps) {
  const [loading, setLoading] = useState(false)
  const [levels, setLevels] = useState<Level[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [fields, setFields] = useState<StudentField[]>([])
  const [schedules, setSchedules] = useState<Schedule[]>([])

  // Core form data
  const [formData, setFormData] = useState({
    full_name: "",
    level_id: "",
    branch_id: "",
  })

  // Custom field values
  const [fieldValues, setFieldValues] = useState<FieldValueEntry[]>([])

  // Schedule enrollment
  const [enrolledScheduleId, setEnrolledScheduleId] = useState<number | null>(null)

  // ── Fetch metadata when sheet opens ──────────────────────
  useEffect(() => {
    if (open && academyId) {
      Promise.all([
        fetch(`/api/levels?academyId=${academyId}`).then((r) => r.json()),
        fetch(`/api/branches?academyId=${academyId}`).then((r) => r.json()),
        fetch(`/api/fields?academyId=${academyId}`).then((r) => r.json()),
        fetch(`/api/schedules?academyId=${academyId}`).then((r) => r.json()),
      ])
        .then(([lvls, brs, flds, scheds]) => {
          setLevels(Array.isArray(lvls) ? lvls : [])
          setBranches(Array.isArray(brs) ? brs : [])
          setFields(Array.isArray(flds) ? (flds as StudentField[]).filter((f) => f.is_active !== false) : [])
          setSchedules(Array.isArray(scheds) ? scheds : [])
        })
        .catch(() => toast.error("Failed to load form data"))
    }
  }, [open, academyId])

  // ── Populate form on edit / reset on create ──────────────
  useEffect(() => {
    if (!open) return

    if (student) {
      // Edit mode
      setFormData({
        full_name: student.full_name || "",
        level_id: student.level_id?.toString() || "",
        branch_id: student.branch_id?.toString() || "",
      })

      // Populate custom field values from student data
      const fvEntries: FieldValueEntry[] = (student.student_field_values || []).map(
        (fv: StudentFieldValue) => {
          const field = fields.find((f) => f.id === fv.field_id)
          const fieldType = field?.field_type || "text"

          let value: any = fv.value ?? ""

          // If boolean, convert the string to a real boolean for the Switch component
          if (fieldType === "boolean") {
            if (value === "true" || value === "1" || value === "Yes") value = true
            else if (value === "false" || value === "0" || value === "No") value = false
            else value = !!value
          }

          return { field_id: fv.field_id, field_type: fieldType, value }
        }
      )
      setFieldValues(fvEntries)

      // Populate enrolled schedules (take the first one if multiple, since it's now a single select)
      const ids = (student.schedule_enrollments || []).map((ss) => ss.schedule?.id).filter(Boolean) as number[]
      if (ids.length > 0) {
        setEnrolledScheduleId(ids[0])
      } else {
        setEnrolledScheduleId(null)
      }
    } else {
      // Create mode — reset everything
      setFormData({
        full_name: "",
        level_id: "",
        branch_id: "",
      })
      setFieldValues([])
      setEnrolledScheduleId(null)
    }
  }, [open, student, fields])

  // ── Derived state ────────────────────────────────────────
  const selectedLevelId = parseInt(formData.level_id)
  const availableBranches = Array.isArray(branches) ? branches.filter((b) => b.level_id === selectedLevelId) : []

  // Available schedules for the selected level/branch (excluding mandatory ones)
  const availableSchedules = schedules.filter((s: any) => {
    if (s.is_active === false) return false
    if (s.is_mandatory) return false // Don't show mandatory schedules
    // Show schedules that match level/branch or are unscoped
    if (formData.level_id && s.level_id && s.level_id.toString() !== formData.level_id)
      return false
    if (formData.branch_id && s.branch_id && s.branch_id.toString() !== formData.branch_id)
      return false
    return true
  })

  // Check if we should show schedules (level selected, and if there are branches, branch must be selected too)
  const shouldShowSchedules =
    formData.level_id &&
    (availableBranches.length === 0 || formData.branch_id) &&
    availableSchedules.length > 0

  // Split fields into required and optional
  const requiredFields = fields.filter((f) => f.is_required)
  const optionalFields = fields.filter((f) => !f.is_required)

  // ── Custom field helpers ─────────────────────────────────
  const getFieldValue = (fieldId: number): any => {
    const entry = fieldValues.find((fv) => fv.field_id === fieldId)
    return entry?.value ?? ""
  }

  const setFieldValue = (fieldId: number, fieldType: string, value: any) => {
    setFieldValues((prev) => {
      const existing = prev.find((fv) => fv.field_id === fieldId)
      if (existing) {
        return prev.map((fv) =>
          fv.field_id === fieldId ? { ...fv, value } : fv
        )
      }
      return [...prev, { field_id: fieldId, field_type: fieldType, value }]
    })
  }

  // ── Schedule enrollment selection ────────────────────────
  const handleScheduleChange = useCallback((value: string) => {
    setEnrolledScheduleId(parseInt(value))
  }, [])

  // ── Submit ───────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.full_name.trim()) {
      toast.error("Student name is required")
      return
    }

    if (!formData.level_id) {
      toast.error("Level is required")
      return
    }

    // Validate required custom fields
    for (const field of requiredFields) {
      const val = getFieldValue(field.id)
      const isEmpty =
        val === "" || val === null || val === undefined || (field.field_type === "boolean" && val === false)
      if (isEmpty && field.field_type !== "boolean") {
        toast.error(`${field.name} is required`)
        return
      }
    }

    setLoading(true)
    try {
      // Build field values payload — include all fields that have values
      const fieldValuesPayload = fieldValues
        .filter((fv) => {
          // Don't send empty values
          if (fv.value === "" || fv.value === null || fv.value === undefined) return false
          return true
        })
        .map((fv) => ({
          field_id: fv.field_id,
          field_type: fv.field_type,
          value: String(fv.value), // Convert everything to string for the DB
        }))

      const studentPayload = {
        full_name: formData.full_name.trim(),
        level_id: parseInt(formData.level_id),
        branch_id: formData.branch_id ? parseInt(formData.branch_id) : null,
        academy_id: academyId,
        fieldValues: fieldValuesPayload,
      }

      let savedStudentId: number

      if (student) {
        // Update
        const res = await fetch(`/api/students/${student.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(studentPayload),
        })
        if (!res.ok) {
          const errBody = await res.json().catch(() => null)
          throw new Error(errBody?.error || "Failed to update student")
        }
        savedStudentId = student.id
        toast.success("Student updated")
      } else {
        // Create
        const res = await fetch("/api/students", {
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

      // ── Sync schedule enrollments ────────────────────────
      if (student) {
        // Compare current vs desired enrollments
        const currentIds = new Set(
          (student.schedule_enrollments || [])
            .map((ss) => ss.schedule?.id)
            .filter(Boolean) as number[]
        )

        // Handle new schedule enrollment
        if (enrolledScheduleId) {
          if (!currentIds.has(enrolledScheduleId)) {
            await fetch(`/api/students/${savedStudentId}/groups`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ scheduleId: enrolledScheduleId, academyId }),
            })
          }
        }

        // Unenroll from removed schedules
        for (const schedId of currentIds) {
          if (schedId !== enrolledScheduleId) {
            await fetch(`/api/students/${savedStudentId}/groups`, {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ scheduleId: schedId, academyId }),
            })
          }
        }
      } else {
        // New student — enroll in selected schedule
        if (enrolledScheduleId) {
          await fetch(`/api/students/${savedStudentId}/groups`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ scheduleId: enrolledScheduleId, academyId }),
          })
        }
      }

      onSuccess?.()
      onOpenChange(false)
    } catch (err: any) {
      console.error(err)
      toast.error(
        err?.message || (student ? "Could not update student" : "Could not create student")
      )
    } finally {
      setLoading(false)
    }
  }

  // ── Render helpers ───────────────────────────────────────
  const renderFieldInput = (field: StudentField) => {
    const value = getFieldValue(field.id)

    switch (field.field_type) {
      case "boolean":
        return (
          <div className="flex items-center justify-between rounded-lg border border-input p-3">
            <div>
              <p className="text-sm font-medium flex items-center gap-0.5">
                {field.name}
                {field.is_required && <span className="text-destructive ml-1">*</span>}
              </p>
            </div>
            <Switch
              checked={!!value}
              onCheckedChange={(checked) => setFieldValue(field.id, field.field_type, checked)}
            />
          </div>
        )

      case "number":
        return (
          <div className="space-y-2">
            <Label className="flex items-center gap-0.5">
              {field.name}
              {field.is_required && <span className="text-destructive">*</span>}
            </Label>
            <Input
              type="number"
              value={value}
              onChange={(e) => setFieldValue(field.id, field.field_type, e.target.value)}
              placeholder={`Enter ${field.name.toLowerCase()}`}
            />
          </div>
        )

      case "date":
        return (
          <div className="space-y-2">
            <Label className="flex items-center gap-0.5">
              {field.name}
              {field.is_required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              type="date"
              value={value}
              onChange={(e) => setFieldValue(field.id, field.field_type, e.target.value)}
            />
          </div>
        )

      case "phone":
        return (
          <div className="space-y-2">
            <Label className="flex items-center gap-0.5">
              {field.name}
              {field.is_required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              type="tel"
              value={value}
              onChange={(e) => setFieldValue(field.id, field.field_type, e.target.value)}
              placeholder={`Enter ${field.name.toLowerCase()}`}
            />
          </div>
        )

      default:
        // text
        return (
          <div className="space-y-2">
            <Label className="flex items-center gap-0.5">
              {field.name}
              {field.is_required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              type="text"
              value={value}
              onChange={(e) => setFieldValue(field.id, field.field_type, e.target.value)}
              placeholder={`Enter ${field.name.toLowerCase()}`}
            />
          </div>
        )
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="sm:max-w-[520px] p-0 flex flex-col overflow-y-auto"
        showCloseButton={false}
      >
        <SheetHeader className="px-6 py-5 border-b">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center size-10 rounded-lg bg-primary/10">
              <IconUserPlus className="size-5 text-primary" />
            </div>
            <div>
              <SheetTitle>{student ? "Edit Student" : "New Student"}</SheetTitle>
              <SheetDescription className="text-xs">
                {student
                  ? "Update student details below."
                  : "Add a new student to your academy."}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <form id="student-form" onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* ─── Basic Information ────────────────────────── */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Basic Information
              </h3>

              <div className="space-y-2">
                <Label htmlFor="student-name" className="flex gap-0.5">
                  Full Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="student-name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="e.g. Mostafa Ahmed"
                  required
                />

              </div>
              {/* ─── Required Custom Fields ────────────────────── */}
              {requiredFields.length > 0 && (
                requiredFields.map((field) => (
                  <div key={field.id}>{renderFieldInput(field)}</div>
                ))
              )}
            </div>



            <Separator />

            {/* ─── Academic Assignment ──────────────────────── */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Academic Assignment
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="student-level">
                    Level <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.level_id}
                    onValueChange={(val) =>
                      setFormData({
                        ...formData,
                        level_id: val,
                        branch_id: "",
                      })
                    }
                  >
                    <SelectTrigger id="student-level" className="w-full">
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      {levels.map((l) => (
                        <SelectItem key={l.id} value={l.id.toString()}>
                          {l.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="student-branch">Branch</Label>
                  <Select
                    value={formData.branch_id}
                    onValueChange={(val) =>
                      setFormData({ ...formData, branch_id: val === "__none__" ? "" : val })
                    }
                    disabled={!formData.level_id || availableBranches.length === 0}
                  >
                    <SelectTrigger id="student-branch" className="w-full">
                      <SelectValue placeholder={availableBranches.length === 0 ? "No branches" : "Select branch"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">None</SelectItem>
                      {availableBranches.map((b) => (
                        <SelectItem key={b.id} value={b.id.toString()}>
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* ─── Schedule Enrollment ─────────────────────── */}
            {shouldShowSchedules && (
              <>
                <Separator />
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                      Schedule Enrollment
                    </h3>
                    <span className="text-[11px] text-muted-foreground">
                      {enrolledScheduleId ? "1 selected" : "0 selected"}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground -mt-2">
                    Select schedules this student should be enrolled in.
                    {availableBranches.length > 0 && " Mandatory sessions are auto-assigned."}
                  </p>
                  <RadioGroup
                    value={enrolledScheduleId?.toString()}
                    onValueChange={handleScheduleChange}
                  >
                    {availableSchedules.map((schedule: any) => {
                      const isEnrolled = enrolledScheduleId === schedule.id
                      return (
                        <label
                          key={schedule.id}
                          htmlFor={`schedule-${schedule.id}`}
                          className={`flex items-center gap-3 w-full p-3 rounded-lg border text-left text-sm transition-colors cursor-pointer ${isEnrolled
                            ? "border-primary/40 bg-primary/5"
                            : "border-input hover:bg-muted/30"
                            }`}
                        >
                          <RadioGroupItem
                            value={schedule.id.toString()}
                            id={`schedule-${schedule.id}`}
                          />
                          <div className="flex-1 flex-row">
                            <p className={`font-medium truncate ${isEnrolled ? "text-primary" : ""}`}>
                              {schedule.name}
                            </p>
                            <div className="flex items-center gap-1.5">
                              {schedule.time_slots?.map((slot: any, idx: number) => {
                                const start = formatTime(slot.start_time);
                                const end = formatTime(slot.end_time);
                                return (
                                  <Badge key={idx} variant="outline" className="text-xs py-0 px-1 font-normal">
                                    {formatDay(slot.day_of_week)} {start} {end && " - "} {end}
                                  </Badge>
                                );
                              })}
                            </div>
                          </div>
                        </label>
                      )
                    })}
                  </RadioGroup>
                </div>
              </>
            )}

            {/* ─── Optional Custom Fields ────────────────────── */}
            {optionalFields.length > 0 && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Optional Information
                  </h3>
                  {optionalFields.map((field) => (
                    <div key={field.id}>{renderFieldInput(field)}</div>
                  ))}
                </div>
              </>
            )}
          </form>
        </ScrollArea>

        {/* Footer */}
        <div className="p-6 border-t bg-background mt-auto">
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              type="button"
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              type="submit"
              form="student-form"
              disabled={loading}
            >
              {loading
                ? "Saving..."
                : student
                  ? "Save Changes"
                  : "Add Student"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
