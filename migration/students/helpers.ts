import type { StudentWithLevelRating, StudentField, StudentFieldValue } from "@/lib"

// ─── Status badge colors ──────────────────────────────────────

export const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  inactive: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20",
  graduated: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
}

// ─── Field value helpers ──────────────────────────────────────

/** Extract the display value from a field value row */
export function getFieldDisplayValue(fv: StudentFieldValue, fieldType: string): string {
  // Now that all custom field values are stored as a generic string "value" 
  // we just parse/format it depending on the actual field type context.
  const rawValue = fv.value

  if (!rawValue) return ""

  switch (fieldType) {
    case "date":
      // Attempt to format if it's a valid date string
      const d = new Date(rawValue)
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      }
      return rawValue
    case "boolean":
      if (rawValue.toLowerCase() === "true" || rawValue === "1") return "Yes"
      if (rawValue.toLowerCase() === "false" || rawValue === "0") return "No"
      return rawValue
    default:
      return rawValue
  }
}

// ─── Full-row search ──────────────────────────────────────────

/**
 * Build a single lowercased string containing all searchable text for a student.
 * This includes core fields, schedule names, and all custom field values.
 */
export function getStudentSearchString(
  student: StudentWithLevelRating,
  fields: StudentField[]
): string {
  const parts: string[] = [
    student.full_name || "",
    student.email || "",
    student.status || "",
    student.level?.name || "",
    student.branch?.name || "",
  ]

  // Schedule names
  for (const ss of student.schedule_enrollments || []) {
    if (ss.schedule?.name) parts.push(ss.schedule.name)
  }

  // Custom field values
  for (const field of fields) {
    const fv = (student.student_field_values || []).find((v) => v.field_id === field.id)
    if (fv) parts.push(getFieldDisplayValue(fv, field.field_type))
  }

  return parts.join(" ").toLowerCase()
}
