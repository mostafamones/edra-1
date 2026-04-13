// ─── Types ─────────────────────────────────────────────────────

export interface TemplateOptions {
  levels: Array<{ name: string }>
  branches: Array<{ name: string; level_id?: number }>
  schedules: Array<{ name: string }>
  customFields: Array<{ name: string; field_type: string }>
}

// ─── Helper Functions ────────────────────────────────────────

/**
 * Convert a string to snake_case
 */
function toSnakeCase(str: string): string {
  return str
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^\w]/g, '')
}

/**
 * Get branches for a specific level
 */
function getBranchesForLevel(
  branches: Array<{ name: string; level_id?: number }>,
  levelName: string,
  levels: Array<{ name: string }>
): Array<{ name: string }> {
  const levelIndex = levels.findIndex(l => l.name === levelName)
  if (levelIndex === -1) return []

  return branches
    .filter(b => b.level_id === levelIndex + 1) // Assuming level_id is 1-indexed
    .map(b => ({ name: b.name }))
}

// ─── CSV Template Generator ────────────────────────────────────

/**
 * Generate a CSV template string for student import
 */
export function generateCSVTemplate(options: TemplateOptions): string {
  const { levels, branches, customFields } = options

  // Build CSV headers
  const headers = ['full_name', 'level', 'branch', 'schedule', 'email']

  // Add custom field headers in snake_case
  customFields.forEach(field => {
    headers.push(toSnakeCase(field.name))
  })

  // Generate sample rows
  const rows: string[][] = []

  levels.forEach(level => {
    const levelBranches = branches.filter(b => b.level_id !== undefined)

    if (levelBranches.length === 0) {
      // No branches for this level, create one sample
      rows.push([
        'John Doe',
        level.name,
        '',
        '', // Schedule placeholder
        'john.doe@example.com',
        ...customFields.map(f => generateSampleValue(f.field_type))
      ])
    } else {
      // Create samples for each branch
      levelBranches.forEach((branch, index) => {
        rows.push([
          `Student ${index + 1}`,
          level.name,
          branch.name,
          '', // Schedule placeholder
          `student${index + 1}@example.com`,
          ...customFields.map(f => generateSampleValue(f.field_type))
        ])
      })
    }
  })

  // Combine headers and rows
  const allRows = [headers, ...rows]

  // Convert to CSV string
  return allRows
    .map(row => row.map(cell => escapeCSVField(cell)).join(','))
    .join('\n')
}

/**
 * Escape a CSV field value
 */
function escapeCSVField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

/**
 * Generate a sample value for a field type
 */
function generateSampleValue(fieldType: string): string {
  switch (fieldType) {
    case 'number':
      return '123'
    case 'date':
      return '2010-05-15'
    case 'boolean':
      return 'true'
    case 'phone':
      return '+1234567890'
    default:
      return 'Sample Value'
  }
}

// ─── JSON Template Generator ───────────────────────────────────

/**
 * Generate a JSON template string for student import
 */
export function generateJSONTemplate(options: TemplateOptions): string {
  const { levels, branches, customFields } = options

  // Build sample student objects
  const samples: any[] = []

  levels.forEach(level => {
    const levelBranches = branches.filter(b => b.level_id !== undefined)

    if (levelBranches.length === 0) {
      // No branches for this level, create one sample
      const student: any = {
        full_name: 'John Doe',
        level: level.name,
        schedule: '',
        email: 'john.doe@example.com'
      }

      // Add custom fields
      customFields.forEach(field => {
        student[toSnakeCase(field.name)] = generateSampleValue(field.field_type)
      })

      samples.push(student)
    } else {
      // Create samples for each branch
      levelBranches.forEach((branch, index) => {
        const student: any = {
          full_name: `Student ${index + 1}`,
          level: level.name,
          branch: branch.name,
          schedule: '',
          email: `student${index + 1}@example.com`
        }

        // Add custom fields
        customFields.forEach(field => {
          student[toSnakeCase(field.name)] = generateSampleValue(field.field_type)
        })

        samples.push(student)
      })
    }
  })

  return JSON.stringify(samples, null, 2)
}

// ─── Download Helper ───────────────────────────────────────────

/**
 * Trigger a file download
 */
export function downloadFile(content: string, filename: string, type: string = 'text/csv'): void {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Download CSV template
 */
export function downloadCSVTemplate(options: TemplateOptions): void {
  const csv = generateCSVTemplate(options)
  downloadFile(csv, 'students_import_template.csv', 'text/csv')
}

/**
 * Download JSON template
 */
export function downloadJSONTemplate(options: TemplateOptions): void {
  const json = generateJSONTemplate(options)
  downloadFile(json, 'students_import_template.json', 'application/json')
}
