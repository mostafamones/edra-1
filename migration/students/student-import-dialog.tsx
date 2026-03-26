"use client"

import { useState, useCallback, useRef } from "react"
import Papa from "papaparse"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import {
  IconUpload,
  IconDownload,
  IconFileText,
  IconCode,
  IconCheck,
  IconX,
  IconFileSpreadsheet,
  IconCalendar,
} from "@tabler/icons-react"
import type { StudentField, Level, Branch, Schedule } from "@/lib"
import type { ParsedStudent } from "@/lib/import-parsers"
import {
  toSnakeCase,
  parseCSV as parseCSVErrors,
  parseJSON as parseJSONErrors,
  processStudentsForImport,
} from "@/lib/import-parsers"
import {
  downloadCSVTemplate,
  downloadJSONTemplate,
} from "@/lib/import-templates"

// ─── Types ─────────────────────────────────────────────────────

interface StudentImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  academyId: string
  levels: Level[]
  branches: Branch[]
  customFields: StudentField[]
  existingStudents: string[]
  schedules: Schedule[]
}

type ImportFormat = "csv" | "json"

type ImportStep = "upload" | "preview" | "importing" | "complete"

// ─── Component ───────────────────────────────────────────────────

function formatTime(timeStr?: string) {
  if (!timeStr) return null;
  const [h, m] = timeStr.split(":");
  if (!h || !m) return null;
  const date = new Date();
  date.setHours(parseInt(h, 10), parseInt(m, 10), 0);
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function formatDay(day: 0 | 1 | 2 | 3 | 4 | 5 | 6 | null) {
  const days = {
    0: "Sun",
    1: "Mon",
    2: "Tue",
    3: "Wed",
    4: "Thu",
    5: "Fri",
    6: "Sat",
  }
  if (day === null) return null;
  return days[day];
}

export function StudentImportDialog({
  open,
  onOpenChange,
  onSuccess,
  academyId,
  levels,
  branches,
  customFields,
  existingStudents,
  schedules,
}: StudentImportDialogProps) {
  const [format, setFormat] = useState<ImportFormat>("csv")
  const [step, setStep] = useState<ImportStep>("upload")
  const [file, setFile] = useState<File | null>(null)
  const [parsedStudents, setParsedStudents] = useState<ParsedStudent[]>([])
  const [importProgress, setImportProgress] = useState(0)
  const [importResults, setImportResults] = useState<{
    created: number
    skipped: number
    skippedNames: string[]
    errors: string[]
  }>({ created: 0, skipped: 0, skippedNames: [], errors: [] })

  const [defaultLevelId, setDefaultLevelId] = useState<string>("")
  const [defaultBranchId, setDefaultBranchId] = useState<string>("")
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>("")
  const [dragActive, setDragActive] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const availableBranches = defaultLevelId
    ? branches.filter(b => b.level_id === parseInt(defaultLevelId))
    : []

  // Available schedules for the selected level/branch (excluding mandatory ones)
  const availableSchedules = schedules.filter((s: any) => {
    if (s.is_active === false) return false
    if (s.is_mandatory) return false // Don't show mandatory schedules - they're auto-assigned
    // Show schedules that match level/branch or are unscoped
    if (defaultLevelId && s.level_id && s.level_id.toString() !== defaultLevelId) return false
    if (defaultBranchId && s.branch_id && s.branch_id.toString() !== defaultBranchId) return false
    return true
  })


  // ── Reset dialog state ────────────────────────────────────
  const resetDialog = useCallback(() => {
    setFormat("csv")
    setStep("upload")
    setFile(null)
    setParsedStudents([])
    setImportProgress(0)
    setImportResults({ created: 0, skipped: 0, skippedNames: [], errors: [] })
    setDefaultLevelId("")
    setDefaultBranchId("")
    setSelectedScheduleId("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }, [])

  const handleClose = useCallback(() => {
    resetDialog()
    onOpenChange(false)
  }, [resetDialog, onOpenChange])

  // ── Handle file selection ───────────────────────────────────
  const handleFileSelect = useCallback((selectedFile: File | null) => {
    if (!selectedFile) return

    // Check file type
    const isCsv = selectedFile.name.endsWith(".csv")
    const isJson = selectedFile.name.endsWith(".json")

    if (!isCsv && !isJson) {
      toast.error("Please select a CSV or JSON file")
      return
    }

    setFormat(isCsv ? "csv" : "json")
    setFile(selectedFile)

    // Parse the file
    const reader = new FileReader()

    reader.onload = (e) => {
      const content = e.target?.result as string

      let result: ParsedStudent[] = []

      if (isCsv) {
        const parseResult = parseCSVErrors(content, {
          levels,
          branches,
          schedules: availableSchedules,
          existingStudentNames: existingStudents,
          customFields,
        })
        result = parseResult.students

        if (parseResult.errors.length > 0) {
          toast.error(
            `Found ${parseResult.errors.length} error${parseResult.errors.length > 1 ? "s" : ""} in the file`
          )
        }
      } else {
        const parseResult = parseJSONErrors(content, {
          levels,
          branches,
          schedules: availableSchedules,
          existingStudentNames: existingStudents,
          customFields,
        })
        result = parseResult.students

        if (parseResult.errors.length > 0) {
          toast.error(
            `Found ${parseResult.errors.length} error${parseResult.errors.length > 1 ? "s" : ""} in the file`
          )
        }
      }

      setParsedStudents(result)

      if (result.length > 0) {
        setStep("preview")
        toast.success(`Parsed ${result.length} student${result.length > 1 ? "s" : ""}`)
      } else {
        toast.error("No valid students found in the file")
      }
    }

    reader.onerror = () => {
      toast.error("Failed to read the file")
    }

    reader.readAsText(selectedFile)
  }, [levels, branches, existingStudents, customFields])

  // ── Handle drag and drop ─────────────────────────────────────
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }, [handleFileSelect])

  // ── Download template ───────────────────────────────────────
  const handleDownloadTemplate = useCallback(() => {
    const templateOptions = {
      levels: levels.map(l => ({ name: l.name })),
      branches: branches.map(b => ({ name: b.name, level_id: b.level_id })),
      schedules: availableSchedules.map((s: any) => ({ name: s.name })),
      customFields,
    }

    if (format === "csv") {
      downloadCSVTemplate(templateOptions)
    } else {
      downloadJSONTemplate(templateOptions)
    }
  }, [format, levels, branches, customFields])

  // ── Import students ───────────────────────────────────────────
  const handleImport = useCallback(async () => {
    setStep("importing")
    setImportProgress(0)

    try {
      const { processed, duplicates } = processStudentsForImport(parsedStudents, {
        customFields,
        defaultLevelId: defaultLevelId ? parseInt(defaultLevelId) : undefined,
        defaultBranchId: defaultBranchId ? parseInt(defaultBranchId) : undefined,
      })

      if (processed.length === 0) {
        toast.error("No valid students to import")
        setStep("upload")
        return
      }

      // Animate progress
      const progressInterval = setInterval(() => {
        setImportProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 100)

      // Call API
      const response = await fetch("/api/students/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          students: processed,
          academyId,
          defaultLevelId: defaultLevelId ? parseInt(defaultLevelId) : undefined,
          defaultBranchId: defaultBranchId ? parseInt(defaultBranchId) : undefined,
          scheduleIds: selectedScheduleId && selectedScheduleId !== "__none__" ? [parseInt(selectedScheduleId)] : [],
        }),
      })

      clearInterval(progressInterval)
      setImportProgress(100)

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to import students")
      }

      setImportResults({
        created: result.created,
        skipped: result.skipped + duplicates,
        skippedNames: result.skippedNames || [],
        errors: result.errors?.map((e: any) => `Row ${e.row}: ${e.message}`) || [],
      })

      setStep("complete")

      const totalErrors = (result.errors?.length || 0) + result.skipped
      if (totalErrors === 0) {
        toast.success(`Successfully imported ${result.created} student${result.created > 1 ? "s" : ""}`)
      } else {
        toast.warning(`Imported ${result.created} student${result.created > 1 ? "s" : ""}. ${totalErrors} skipped or had errors.`)
      }

      onSuccess?.()
    } catch (error: any) {
      console.error("Import error:", error)
      toast.error(error?.message || "Failed to import students")
      setStep("preview")
    }
  }, [parsedStudents, customFields, defaultLevelId, defaultBranchId, academyId, onSuccess])

  // ── Get field columns for preview ───────────────────────────
  const getPreviewColumns = () => {
    const columns = ["Name", "Level", "Branch", "Email"]
    customFields.forEach(f => {
      columns.push(toSnakeCase(f.name))
    })
    return columns
  }

  // ── Render preview row ──────────────────────────────────────
  const renderPreviewRow = (student: ParsedStudent, index: number) => {
    const hasErrors = student.errors && student.errors.length > 0

    // Compute effective level and branch to filter row schedules accurately
    const effLevelId = student.level_id || (defaultLevelId ? parseInt(defaultLevelId) : null)
    const effBranchId = student.branch_id || (defaultBranchId ? parseInt(defaultBranchId) : null)

    const rowSchedules = availableSchedules.filter((s: any) => {
      if (s.level_id && effLevelId && s.level_id !== effLevelId) return false;
      if (s.branch_id && effBranchId && s.branch_id !== effBranchId) return false;
      return true;
    });

    return (
      <tr
        key={student.full_name + "-" + index}
        className={hasErrors ? "bg-destructive/10" : ""}
      >
        <td className="p-2 text-sm border-b">{student.full_name}</td>
        <td className="p-2 text-sm border-b">{student.level || "-"}</td>
        <td className="p-2 text-sm border-b">{student.branch || "-"}</td>
        <td className="p-2 text-sm border-b">
          <Select
            value={student.schedule_id ? student.schedule_id.toString() : (selectedScheduleId || "__none__")}
            onValueChange={(val) => {
              setParsedStudents(prev => {
                const next = [...prev]
                if (val === "__none__") {
                  next[index] = { ...next[index], schedule: undefined, schedule_id: undefined }
                } else {
                  const schedule = availableSchedules.find(s => s.id.toString() === val)
                  if (schedule) {
                    next[index] = { ...next[index], schedule: schedule.name, schedule_id: schedule.id }
                    if (next[index].errors) {
                      next[index].errors = next[index].errors?.filter(e => e.field !== 'schedule')
                    }
                  }
                }
                return next
              })
            }}
          >
            <SelectTrigger className="h-7 w-[180px] text-xs">
              <SelectValue placeholder="Select schedule..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">None</SelectItem>
              {rowSchedules.map((schedule: any) => (
                <SelectItem key={schedule.id} value={schedule.id.toString()}>
                  {schedule.name}
                  {schedule.time_slots?.map((slot: any) => ` • ${formatDay(slot.day_of_week)}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </td>
        <td className="p-2 text-sm border-b">{student.email || "-"}</td>
        {customFields.map(field => (
          <td key={field.id} className="p-2 text-sm border-b">
            {student.customFields?.[field.name] || "-"}
          </td>
        ))}
        <td className="p-2 border-b">
          {hasErrors ? (
            <Badge variant="destructive" className="text-xs">
              {student.errors?.length} error{student.errors!.length > 1 ? "s" : ""}
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs text-green-600 border-green-600">
              Valid
            </Badge>
          )}
        </td>
      </tr>
    )
  }

  // ── Render ───────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className={`max-h-[90vh] overflow-hidden flex flex-col transition-all duration-300 ${step === "preview"
          ? "max-w-[90vw] lg:max-w-[1200px]"
          : "max-w-[1000px] w-[1000px]"
          }`}
      >
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center size-10 rounded-lg bg-primary/10">
              <IconUpload className="size-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Import Students</DialogTitle>
              <DialogDescription>
                {step === "upload" && "Upload a CSV or JSON file to import students in bulk"}
                {step === "preview" && "Review the parsed data before importing"}
                {step === "importing" && "Importing students..."}
                {step === "complete" && "Import complete"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {step === "upload" && (
          <div className="space-y-4">
            {/* Format tabs */}
            <Tabs value={format} onValueChange={(v) => setFormat(v as ImportFormat)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="csv">
                  <IconFileSpreadsheet className="size-4 mr-2" />
                  CSV
                </TabsTrigger>
                <TabsTrigger value="json">
                  <IconCode className="size-4 mr-2" />
                  JSON
                </TabsTrigger>
              </TabsList>

              <TabsContent value={format} className="mt-4 space-y-4">
                {/* Template download */}
                <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                  <div>
                    <p className="text-sm font-medium">Download Template</p>
                    <p className="text-xs text-muted-foreground">
                      Get a template file with the correct format
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
                    <IconDownload className="size-4 mr-2" />
                    Download {format.toUpperCase()}
                  </Button>
                </div>

                {/* Default values */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="default-level">Default Level</Label>
                    <Select value={defaultLevelId || "__none__"} onValueChange={(v) => setDefaultLevelId(v === "__none__" ? "" : v)}>
                      <SelectTrigger id="default-level" className="w-full">
                        <SelectValue placeholder="Optional" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">None</SelectItem>
                        {levels.map(l => (
                          <SelectItem key={l.id} value={l.id.toString()}>
                            {l.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="default-branch">Default Branch</Label>
                    <Select
                      value={defaultBranchId || "__none__"}
                      onValueChange={(v) => setDefaultBranchId(v === "__none__" ? "" : v)}
                      disabled={!defaultLevelId || availableBranches.length === 0}
                    >
                      <SelectTrigger id="default-branch" className="w-full">
                        <SelectValue placeholder="Optional" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">None</SelectItem>
                        {availableBranches.map(b => (
                          <SelectItem key={b.id} value={b.id.toString()}>
                            {b.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Schedule enrollment */}
                {(availableSchedules.length > 0 && defaultLevelId && defaultLevelId !== "__none__") && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="default-schedule">Enroll in Schedule</Label>
                    </div>
                    <Select
                      value={selectedScheduleId || "__none__"}
                      onValueChange={(v) => setSelectedScheduleId(v === "__none__" ? "" : v)}
                    >
                      <SelectTrigger id="default-schedule" className="w-full">
                        <SelectValue placeholder="Optional" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">None</SelectItem>
                        {availableSchedules.map((schedule: any) => (
                          <SelectItem key={schedule.id} value={schedule.id.toString()}>
                            {schedule.name}
                            {schedule.branch && ` • ${schedule.branch.name}`}
                            {schedule.time_slots?.map((slot: any) => {
                              const start = formatTime(slot.start_time);
                              const end = formatTime(slot.end_time);
                              return ` • ${formatDay(slot.day_of_week)} ${start}`;
                            })}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* File upload */}
                <div
                  className={`
                    relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
                    ${dragActive ? "border-primary bg-primary/5" : "border-input hover:border-primary/50"}
                  `}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={format === "csv" ? ".csv" : ".json"}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
                  />
                  <div className="flex flex-col items-center gap-2">
                    {format === "csv" ? (
                      <IconFileSpreadsheet className="size-8 text-muted-foreground" />
                    ) : (
                      <IconCode className="size-8 text-muted-foreground" />
                    )}
                    <p className="text-sm font-medium">
                      Drag and drop your {format.toUpperCase()} file here
                    </p>
                    <p className="text-xs text-muted-foreground">or click to browse</p>
                  </div>
                </div>

                {/* Format help */}
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>
                    <strong>Required columns:</strong> full_name, level
                  </p>
                  <p>
                    <strong>Optional columns:</strong> branch, schedule, email
                  </p>
                  {customFields.length > 0 && (
                    <p>
                      <strong>Custom fields:</strong>{" "}
                      {customFields.map(f => toSnakeCase(f.name)).join(", ")}
                    </p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-4 w-full flex-1 overflow-hidden flex flex-col">
            {/* Summary */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-2xl font-bold">{parsedStudents.length}</p>
                  <p className="text-xs text-muted-foreground">Total Rows</p>
                </div>
                <div className="w-px h-8 bg-border" />
                <div>
                  <p className="text-2xl font-bold text-green-600">
                    {parsedStudents.filter(s => !s.errors || s.errors.length === 0).length}
                  </p>
                  <p className="text-xs text-muted-foreground">Valid</p>
                </div>
                <div className="w-px h-8 bg-border" />
                <div>
                  <p className="text-2xl font-bold text-destructive">
                    {parsedStudents.filter(s => s.errors && s.errors.length > 0).length}
                  </p>
                  <p className="text-xs text-muted-foreground">Errors</p>
                </div>
              </div>
            </div>

            {/* Preview table */}
            <div className="flex-1 overflow-auto border rounded-lg h-[300px]">
              <table className="w-full text-sm whitespace-nowrap">
                <thead className="sticky top-0 bg-background border-b z-10">
                  <tr>
                    <th className="p-2 text-left font-medium">Name</th>
                    <th className="p-2 text-left font-medium">Level</th>
                    <th className="p-2 text-left font-medium">Branch</th>
                    <th className="p-2 text-left font-medium">Schedule</th>
                    <th className="p-2 text-left font-medium">Email</th>
                    {customFields.map(field => (
                      <th key={field.id} className="p-2 text-left font-medium">
                        {field.name}
                      </th>
                    ))}
                    <th className="p-2 text-left font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedStudents.map((student, idx) => renderPreviewRow(student, idx))}
                </tbody>
              </table>
            </div>

            {/* Errors summary */}
            {parsedStudents.some(s => s.errors && s.errors.length > 0) && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-sm font-medium text-destructive mb-2">
                  Errors that will be skipped:
                </p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  {parsedStudents
                    .filter(s => s.errors && s.errors.length > 0)
                    .slice(0, 5)
                    .map((student, i) => (
                      <li key={i}>
                        {student.full_name}:{" "}
                        {student.errors?.map(e => e.message).join(", ")}
                      </li>
                    ))}
                  {parsedStudents.filter(s => s.errors && s.errors.length > 0).length > 5 && (
                    <li className="italic">
                      ...and{" "}
                      {parsedStudents.filter(s => s.errors && s.errors.length > 0).length - 5} more
                    </li>
                  )}
                </ul>
              </div>
            )}

            {/* Duplicates note */}
            {parsedStudents.some(s =>
              s.errors?.some(e => e.field === 'full_name' && e.message === 'Duplicate name')
            ) && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                  <IconX className="size-4 text-yellow-600 dark:text-yellow-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-500">
                      Duplicates will be skipped
                    </p>
                    <p className="text-xs text-yellow-700 dark:text-yellow-600">
                      Students with the same name as existing students will not be imported.
                    </p>
                  </div>
                </div>
              )}
          </div>
        )}

        {step === "importing" && (
          <div className="space-y-6 py-8">
            <div className="text-center space-y-2">
              <IconUpload className="size-12 mx-auto animate-pulse" />
              <p className="text-lg font-medium">Importing students...</p>
              <p className="text-sm text-muted-foreground">
                Please wait while we process your file
              </p>
            </div>
            <Progress value={importProgress} />
          </div>
        )}

        {step === "complete" && (
          <div className="space-y-4">
            {/* Results summary */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-500">
                  <IconCheck className="size-5" />
                  <p className="text-sm font-medium">Imported</p>
                </div>
                <p className="text-3xl font-bold text-green-700 dark:text-green-500 mt-1">
                  {importResults.created}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-500">
                  <IconX className="size-5" />
                  <p className="text-sm font-medium">Skipped</p>
                </div>
                <p className="text-3xl font-bold text-yellow-700 dark:text-yellow-500 mt-1">
                  {importResults.skipped}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <div className="flex items-center gap-2 text-red-700 dark:text-red-500">
                  <IconX className="size-5" />
                  <p className="text-sm font-medium">Errors</p>
                </div>
                <p className="text-3xl font-bold text-red-700 dark:text-red-500 mt-1">
                  {importResults.errors.length}
                </p>
              </div>
            </div>

            {/* Skipped names */}
            {importResults.skippedNames.length > 0 && (
              <div className="p-3 rounded-lg bg-muted/30">
                <p className="text-sm font-medium mb-2">
                  {importResults.skipped} student{importResults.skipped > 1 ? "s were" : " was"} skipped
                </p>
                <ScrollArea className="h-20">
                  <ul className="text-xs text-muted-foreground space-y-0.5">
                    {importResults.skippedNames.map((name, i) => (
                      <li key={i}>• {name}</li>
                    ))}
                  </ul>
                </ScrollArea>
              </div>
            )}

            {/* Errors */}
            {importResults.errors.length > 0 && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-sm font-medium text-destructive mb-2">Errors:</p>
                <ScrollArea className="h-20">
                  <ul className="text-xs text-destructive space-y-0.5">
                    {importResults.errors.map((error, i) => (
                      <li key={i}>• {error}</li>
                    ))}
                  </ul>
                </ScrollArea>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {step === "upload" && (
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
          )}
          {step === "preview" && (
            <>
              <Button variant="outline" onClick={() => setStep("upload")}>
                Back
              </Button>
              <Button
                onClick={handleImport}
                disabled={parsedStudents.filter(s => !s.errors || s.errors.length === 0).length === 0}
              >
                Import {parsedStudents.filter(s => !s.errors || s.errors.length === 0).length} Students
              </Button>
            </>
          )}
          {step === "importing" && (
            <Button disabled>
              Importing...
            </Button>
          )}
          {step === "complete" && (
            <Button onClick={handleClose}>
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
