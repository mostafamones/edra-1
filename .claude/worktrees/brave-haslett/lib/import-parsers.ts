import Papa from 'papaparse'

// ─── Types ─────────────────────────────────────────────────────

export interface ParsedStudent {
  full_name: string
  level?: string
  level_id?: number
  branch?: string
  branch_id?: number
  schedule?: string
  schedule_id?: number
  email?: string
  customFields?: Record<string, any>
  errors?: Array<{ field: string; message: string }>
}

export interface ParseResult {
  students: ParsedStudent[]
  errors: Array<{ row: number; message: string }>
}

// ─── Utility Functions ────────────────────────────────────────

/**
 * Convert a string to snake_case
 */
export function toSnakeCase(str: string): string {
  return str
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^\w]/g, '')
}

/**
 * Convert snake_case to Title Case (for display)
 */
export function fromSnakeCase(str: string): string {
  return str
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Find a level by name (case-insensitive)
 */
export function findLevelByName(
  levels: Array<{ id: number; name: string }>,
  name: string
): { id: number; name: string } | undefined {
  return levels.find(l => l.name.toLowerCase() === name.toLowerCase())
}

/**
 * Find a branch by name (case-insensitive) within a specific level
 */
export function findBranchByName(
  branches: Array<{ id: number; name: string; level_id: number }>,
  name: string,
  levelId?: number
): { id: number; name: string } | undefined {
  return branches.find(
    b => b.name.toLowerCase() === name.toLowerCase() &&
      (!levelId || b.level_id === levelId)
  )
}

/**
 * Find a schedule by ID or Name (case-insensitive)
 */
export function findScheduleByIdOrName(
  schedules: Array<{ id: number; name: string; level_id?: number | null; branch_id?: number | null }>,
  input: string | number,
  levelId?: number | null,
  branchId?: number | null
): { id: number; name: string } | undefined {
  const inputStr = input !== null && input !== undefined ? String(input).trim().toLowerCase() : ''
  const asNumber = Number(inputStr)

  return schedules.find(s => {
    const matchesIdOrName = (!isNaN(asNumber) && s.id === asNumber) || s.name.toLowerCase() === inputStr
    if (!matchesIdOrName) return false

    if (levelId && s.level_id && s.level_id !== levelId) return false
    if (branchId && s.branch_id && s.branch_id !== branchId) return false

    return true
  })
}

/**
 * Check if a student already exists in the list
 */
export function isDuplicate(
  student: ParsedStudent,
  existingNames: Set<string>,
  parsedNames: Set<string>
): boolean {
  const name = student.full_name.trim().toLowerCase()
  return existingNames.has(name) || parsedNames.has(name)
}

// ─── CSV Parser ────────────────────────────────────────────────

export function parseCSV(
  content: string,
  options: {
    levels: Array<{ id: number; name: string }>
    branches: Array<{ id: number; name: string; level_id: number }>
    schedules: Array<{ id: number; name: string; level_id?: number | null; branch_id?: number | null }>
    existingStudentNames: string[]
    customFields: Array<{ id: number; name: string; field_type: string }>
  }
): ParseResult {
  const { levels, branches, schedules, existingStudentNames, customFields } = options

  const result: ParseResult = {
    students: [],
    errors: []
  }

  const existingNamesSet = new Set(existingStudentNames.map(n => n.toLowerCase()))
  const parsedNames = new Set<string>()

  // Build a lookup map for custom fields (by snake_case name)
  const fieldLookup = new Map<string, { id: number; name: string; field_type: string }>()
  customFields.forEach(field => {
    fieldLookup.set(toSnakeCase(field.name), field)
  })

  Papa.parse(content, {
    header: true,
    skipEmptyLines: true,
    complete: (results: any) => {
      const rows = results.data as Array<Record<string, string>>

      rows.forEach((row, index) => {
        const student: ParsedStudent = {
          full_name: row.full_name?.trim() || '',
          email: row.email?.trim() || undefined,
          customFields: {},
          errors: []
        }

        const rowNum = index + 2 // +2 because CSV is 1-indexed and we have a header row

        // Validate required fields
        if (!student.full_name) {
          student.errors?.push({ field: 'full_name', message: 'Name is required' })
          result.errors.push({ row: rowNum, message: 'Missing student name' })
        }

        // Parse level
        const levelName = row.level?.trim()
        if (levelName) {
          const level = findLevelByName(levels, levelName)
          if (level) {
            student.level = levelName
            student.level_id = level.id
          } else {
            student.errors?.push({ field: 'level', message: `Invalid level: ${levelName}` })
            result.errors.push({ row: rowNum, message: `Invalid level: ${levelName}` })
          }
        } else {
          student.errors?.push({ field: 'level', message: 'Level is required' })
        }

        // Parse branch
        const branchName = row.branch?.trim()
        if (branchName) {
          const branch = findBranchByName(branches, branchName, student.level_id)
          if (branch) {
            student.branch = branchName
            student.branch_id = branch.id
          } else {
            student.errors?.push({ field: 'branch', message: `Invalid branch: ${branchName}` })
            result.errors.push({ row: rowNum, message: `Invalid branch: ${branchName}` })
          }
        }

        // Parse schedule
        const scheduleInput = row.schedule?.trim()
        if (scheduleInput) {
          const schedule = findScheduleByIdOrName(schedules, scheduleInput, student.level_id, student.branch_id)
          if (schedule) {
            student.schedule = schedule.name
            student.schedule_id = schedule.id
          } else {
            student.errors?.push({ field: 'schedule', message: `Invalid schedule: ${scheduleInput}` })
            result.errors.push({ row: rowNum, message: `Invalid schedule: ${scheduleInput}` })
          }
        }

        // Check for duplicates
        if (student.full_name && isDuplicate(student, existingNamesSet, parsedNames)) {
          student.errors?.push({ field: 'full_name', message: 'Duplicate name' })
        }

        // Parse custom fields
        Object.keys(row).forEach(key => {
          const snakeKey = toSnakeCase(key)

          // Skip standard fields
          if (['full_name', 'level', 'branch', 'schedule', 'email'].includes(snakeKey)) {
            return
          }

          const field = fieldLookup.get(snakeKey)
          if (field) {
            const value = row[key]?.trim()
            if (value) {
              student.customFields![field.name] = value
            }
          }
        })

        parsedNames.add(student.full_name.toLowerCase())

        result.students.push(student)
      })
    },
    error: (error: any) => {
      result.errors.push({ row: 0, message: `CSV parsing error: ${error.message}` })
    }
  })

  return result
}

// ─── JSON Parser ───────────────────────────────────────────────

export function parseJSON(
  content: string,
  options: {
    levels: Array<{ id: number; name: string }>
    branches: Array<{ id: number; name: string; level_id: number }>
    schedules: Array<{ id: number; name: string; level_id?: number | null; branch_id?: number | null }>
    existingStudentNames: string[]
    customFields: Array<{ id: number; name: string; field_type: string }>
  }
): ParseResult {
  const { levels, branches, schedules, existingStudentNames, customFields } = options

  const result: ParseResult = {
    students: [],
    errors: []
  }

  const existingNamesSet = new Set(existingStudentNames.map(n => n.toLowerCase()))
  const parsedNames = new Set<string>()

  // Build a lookup map for custom fields (by snake_case name)
  const fieldLookup = new Map<string, { id: number; name: string; field_type: string }>()
  customFields.forEach(field => {
    fieldLookup.set(toSnakeCase(field.name), field)
  })

  try {
    const data = JSON.parse(content)

    if (!Array.isArray(data)) {
      result.errors.push({ row: 0, message: 'JSON must be an array of student objects' })
      return result
    }

    data.forEach((item: any, index) => {
      const student: ParsedStudent = {
        full_name: item.full_name?.trim() || '',
        level: item.level,
        branch: item.branch,
        email: item.email?.trim() || undefined,
        customFields: {},
        errors: []
      }

      const rowNum = index + 1

      // Validate required fields
      if (!student.full_name) {
        student.errors?.push({ field: 'full_name', message: 'Name is required' })
        result.errors.push({ row: rowNum, message: 'Missing student name' })
      }

      // Parse level
      if (item.level) {
        const level = findLevelByName(levels, item.level)
        if (level) {
          student.level = level.name
          student.level_id = level.id
        } else {
          student.errors?.push({ field: 'level', message: `Invalid level: ${item.level}` })
          result.errors.push({ row: rowNum, message: `Invalid level: ${item.level}` })
        }
      } else {
        student.errors?.push({ field: 'level', message: 'Level is required' })
      }

      // Parse branch
      if (item.branch) {
        const branch = findBranchByName(branches, item.branch, student.level_id)
        if (branch) {
          student.branch = branch.name
          student.branch_id = branch.id
        } else {
          student.errors?.push({ field: 'branch', message: `Invalid branch: ${item.branch}` })
          result.errors.push({ row: rowNum, message: `Invalid branch: ${item.branch}` })
        }
      }

      // Parse schedule
      if (item.schedule) {
        const schedule = findScheduleByIdOrName(schedules, item.schedule, student.level_id, student.branch_id)
        if (schedule) {
          student.schedule = schedule.name
          student.schedule_id = schedule.id
        } else {
          student.errors?.push({ field: 'schedule', message: `Invalid schedule: ${item.schedule}` })
          result.errors.push({ row: rowNum, message: `Invalid schedule: ${item.schedule}` })
        }
      }

      // Check for duplicates
      if (student.full_name && isDuplicate(student, existingNamesSet, parsedNames)) {
        student.errors?.push({ field: 'full_name', message: 'Duplicate name' })
      }

      // Parse custom fields (support both snake_case and original keys)
      Object.keys(item).forEach(key => {
        const snakeKey = toSnakeCase(key)

        // Skip standard fields
        if (['full_name', 'level', 'branch', 'schedule', 'email'].includes(snakeKey)) {
          return
        }

        const field = fieldLookup.get(snakeKey)
        if (field) {
          const value = item[key]
          if (value !== undefined && value !== null && value !== '') {
            student.customFields![field.name] = value
          }
        }
      })

      parsedNames.add(student.full_name.toLowerCase())

      result.students.push(student)
    })
  } catch (error: any) {
    result.errors.push({ row: 0, message: `JSON parsing error: ${error.message}` })
  }

  return result
}

// ─── Process Parsed Students for Import ───────────────────────

export interface ProcessedStudent {
  full_name: string
  level_id: number
  branch_id: number | null
  schedule_id: number | null
  email: string | null
  fieldValues: Array<{ field_id: number; field_type: string; value: any }>
}

export function processStudentsForImport(
  parsedStudents: ParsedStudent[],
  options: {
    customFields: Array<{ id: number; name: string; field_type: string }>
    defaultLevelId?: number
    defaultBranchId?: number
  }
): {
  processed: ProcessedStudent[]
  duplicates: number
  errors: ParsedStudent[]
} {
  const { customFields, defaultLevelId, defaultBranchId } = options

  const processed: ProcessedStudent[] = []
  const errors: ParsedStudent[] = []
  let duplicates = 0

  const fieldLookup = new Map<string, { id: number; field_type: string }>()
  customFields.forEach(field => {
    fieldLookup.set(field.name, field)
  })

  parsedStudents.forEach((student) => {
    // Check for duplicate error
    if (student.errors?.some(e => e.field === 'full_name' && e.message === 'Duplicate name')) {
      duplicates++
      return
    }

    // Check for validation errors
    if (student.errors && student.errors.length > 0) {
      errors.push(student)
      return
    }

    // Use defaults if level not provided
    const levelId = student.level_id || defaultLevelId
    if (!levelId) {
      student.errors = student.errors || []
      student.errors.push({ field: 'level', message: 'Level is required' })
      errors.push(student)
      return
    }

    // Build field values array
    const fieldValues: Array<{ field_id: number; field_type: string; value: any }> = []

    if (student.customFields) {
      Object.entries(student.customFields).forEach(([fieldName, value]) => {
        const field = fieldLookup.get(fieldName)
        if (field && value !== undefined && value !== null && value !== '') {
          fieldValues.push({
            field_id: field.id,
            field_type: field.field_type,
            value
          })
        }
      })
    }

    // levelId is guaranteed to be defined here because we return if it's not
    const finalLevelId: number = levelId || 0

    processed.push({
      full_name: student.full_name,
      level_id: finalLevelId,
      branch_id: student.branch_id || defaultBranchId || null,
      schedule_id: student.schedule_id || null,
      email: student.email || null,
      fieldValues
    })
  })

  return { processed, duplicates, errors }
}
