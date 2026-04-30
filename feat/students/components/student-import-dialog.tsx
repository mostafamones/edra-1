"use client"

import { useCallback, useRef, useState } from "react"
import { IconUpload } from "@tabler/icons-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { Group, Level, Schedule, ScheduleTimeSlot, StudentField } from "@/lib/types"
import { getErrorMessage } from "@/lib/get-error-message"

import type { ImportFormat, ImportSchedule, ImportStep } from "../types"
import type { ParsedStudent, ProcessedStudent } from "../utils/import-parsers"
import {
  parseCSV,
  parseJSON,
  processStudentsForImport,
  toSnakeCase,
} from "../utils/import-parsers"
import { downloadCSVTemplate, downloadJSONTemplate } from "../utils/import-templates"
import { ImportingStep, ImportResultsStep } from "./import/import-results-step"
import { PreviewStep } from "./import/preview-step"
import { UploadStep } from "./import/upload-step"

interface StudentImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  academyId: string
  levels: Level[]
  groups: Group[]
  customFields: StudentField[]
  existingStudents: string[]
  schedules: ImportSchedule[]
}

type ParserSchedule = {
  id: number
  name: string
  level_id?: number | null
  branch_id?: number | null
}

type BulkImportResponse = {
  created: number
  skipped: number
  skippedNames?: string[]
  errors?: Array<{ row: number; message: string }>
  error?: string
}

export function StudentImportDialog({
  open,
  onOpenChange,
  onSuccess,
  academyId,
  levels,
  groups,
  customFields,
  existingStudents,
  schedules,
}: StudentImportDialogProps) {
  const [format, setFormat] = useState<ImportFormat>("csv")
  const [step, setStep] = useState<ImportStep>("upload")
  const [file, setFile] = useState<File | null>(null)
  const [parsedStudents, setParsedStudents] = useState<ParsedStudent[]>([])
  const [importProgress, setImportProgress] = useState(0)
  const [importResults, setImportResults] = useState({
    created: 0,
    skipped: 0,
    skippedNames: [] as string[],
    errors: [] as string[],
  })
  const [defaultLevelId, setDefaultLevelId] = useState("")
  const [defaultGroupId, setDefaultGroupId] = useState("")
  const [selectedScheduleId, setSelectedScheduleId] = useState("")
  const [dragActive, setDragActive] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const availableGroups = defaultLevelId
    ? groups.filter((group) => group.level_id === parseInt(defaultLevelId, 10))
    : []

  const availableSchedules = schedules.filter((schedule) => {
    if (schedule.is_active === false) return false
    if (schedule.is_mandatory) return false
    if (defaultLevelId && schedule.level_id && schedule.level_id.toString() !== defaultLevelId) return false
    if (defaultGroupId && schedule.group_id && schedule.group_id.toString() !== defaultGroupId) return false
    return true
  })

  const parserSchedules: ParserSchedule[] = availableSchedules.map((schedule) => ({
    id: schedule.id,
    name: schedule.name,
    level_id: schedule.level_id,
    branch_id: schedule.group_id,
  }))

  const resetDialog = useCallback(() => {
    setFormat("csv")
    setStep("upload")
    setFile(null)
    setParsedStudents([])
    setImportProgress(0)
    setImportResults({ created: 0, skipped: 0, skippedNames: [], errors: [] })
    setDefaultLevelId("")
    setDefaultGroupId("")
    setSelectedScheduleId("")
    if (fileInputRef.current) fileInputRef.current.value = ""
  }, [])

  const handleClose = useCallback(() => {
    resetDialog()
    onOpenChange(false)
  }, [onOpenChange, resetDialog])

  const handleFileSelect = useCallback(
    (selectedFile: File | null) => {
      if (!selectedFile) return

      const isCsv = selectedFile.name.endsWith(".csv")
      const isJson = selectedFile.name.endsWith(".json")
      if (!isCsv && !isJson) {
        toast.error("Please select a CSV or JSON file")
        return
      }

      setFormat(isCsv ? "csv" : "json")
      setFile(selectedFile)

      const reader = new FileReader()
      reader.onload = (event) => {
        const content = event.target?.result as string
        const parserBranches = groups.map((group) => ({
          id: group.id,
          name: group.name,
          level_id: group.level_id ?? 0,
        }))

        const parseResult = isCsv
          ? parseCSV(content, {
              levels,
              branches: parserBranches,
              schedules: parserSchedules,
              existingStudentNames: existingStudents,
              customFields,
            })
          : parseJSON(content, {
              levels,
              branches: parserBranches,
              schedules: parserSchedules,
              existingStudentNames: existingStudents,
              customFields,
            })

        if (parseResult.errors.length > 0) {
          toast.error(
            `Found ${parseResult.errors.length} error${
              parseResult.errors.length > 1 ? "s" : ""
            } in the file`
          )
        }

        setParsedStudents(parseResult.students)
        if (parseResult.students.length > 0) {
          setStep("preview")
          toast.success(
            `Parsed ${parseResult.students.length} student${
              parseResult.students.length > 1 ? "s" : ""
            }`
          )
        } else {
          toast.error("No valid students found in the file")
        }
      }
      reader.onerror = () => toast.error("Failed to read the file")
      reader.readAsText(selectedFile)
    },
    [customFields, existingStudents, groups, levels, parserSchedules]
  )

  const handleDrag = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
    if (event.type === "dragenter" || event.type === "dragover") {
      setDragActive(true)
    } else if (event.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()
      event.stopPropagation()
      setDragActive(false)
      if (event.dataTransfer.files?.length > 0) {
        handleFileSelect(event.dataTransfer.files[0])
      }
    },
    [handleFileSelect]
  )

  const handleDownloadTemplate = useCallback(() => {
    const templateOptions = {
      levels: levels.map((level) => ({ name: level.name })),
      branches: groups.map((group) => ({ name: group.name, level_id: group.level_id ?? 0 })),
      schedules: availableSchedules.map((schedule) => ({ name: schedule.name })),
      customFields,
    }

    if (format === "csv") {
      downloadCSVTemplate(templateOptions)
    } else {
      downloadJSONTemplate(templateOptions)
    }
  }, [availableSchedules, customFields, format, groups, levels])

  const handleImport = useCallback(async () => {
    setStep("importing")
    setImportProgress(0)

    try {
      const { processed, duplicates } = processStudentsForImport(parsedStudents, {
        customFields,
        defaultLevelId: defaultLevelId ? parseInt(defaultLevelId, 10) : undefined,
        defaultBranchId: defaultGroupId ? parseInt(defaultGroupId, 10) : undefined,
      })

      if (processed.length === 0) {
        toast.error("No valid students to import")
        setStep("upload")
        return
      }

      const progressInterval = setInterval(() => {
        setImportProgress((previous) => {
          if (previous >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return previous + 10
        })
      }, 100)

      const response = await fetch("/api/students/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          students: processed.map((student: ProcessedStudent) => ({
            ...student,
            group_id: student.branch_id ?? null,
          })),
          academyId,
          defaultLevelId: defaultLevelId ? parseInt(defaultLevelId, 10) : undefined,
          defaultGroupId: defaultGroupId ? parseInt(defaultGroupId, 10) : undefined,
          scheduleIds:
            selectedScheduleId && selectedScheduleId !== "__none__"
              ? [parseInt(selectedScheduleId, 10)]
              : [],
        }),
      })

      clearInterval(progressInterval)
      setImportProgress(100)

      const result = (await response.json()) as BulkImportResponse
      if (!response.ok) throw new Error(result.error || "Failed to import students")

      setImportResults({
        created: result.created,
        skipped: result.skipped + duplicates,
        skippedNames: result.skippedNames || [],
        errors: result.errors?.map((error) => `Row ${error.row}: ${error.message}`) || [],
      })
      setStep("complete")

      const totalErrors = (result.errors?.length || 0) + result.skipped
      if (totalErrors === 0) {
        toast.success(
          `Successfully imported ${result.created} student${result.created > 1 ? "s" : ""}`
        )
      } else {
        toast.warning(
          `Imported ${result.created} student${result.created > 1 ? "s" : ""}. ${totalErrors} skipped or had errors.`
        )
      }

      onSuccess?.()
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to import students"))
      setStep("preview")
    }
  }, [
    academyId,
    customFields,
    defaultGroupId,
    defaultLevelId,
    onSuccess,
    parsedStudents,
    selectedScheduleId,
  ])

  const validStudentCount = parsedStudents.filter(
    (student) => !student.errors || student.errors.length === 0
  ).length

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className={`max-h-[90vh] overflow-hidden flex flex-col transition-all duration-300 ${
          step === "preview" ? "max-w-[90vw] lg:max-w-[1200px]" : "w-[1000px] max-w-[1000px]"
        }`}
      >
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
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
          <UploadStep
            availableGroups={availableGroups}
            availableSchedules={availableSchedules}
            customFields={customFields}
            defaultGroupId={defaultGroupId}
            defaultLevelId={defaultLevelId}
            dragActive={dragActive}
            fileInputRef={fileInputRef}
            format={format}
            groups={groups}
            handleDownloadTemplate={handleDownloadTemplate}
            handleDrag={handleDrag}
            handleDrop={handleDrop}
            handleFileSelect={handleFileSelect}
            levels={levels}
            selectedScheduleId={selectedScheduleId}
            setDefaultGroupId={setDefaultGroupId}
            setDefaultLevelId={setDefaultLevelId}
            setFormat={setFormat}
            setSelectedScheduleId={setSelectedScheduleId}
          />
        )}

        {step === "preview" && (
          <PreviewStep
            availableSchedules={availableSchedules}
            customFields={customFields}
            defaultGroupId={defaultGroupId}
            defaultLevelId={defaultLevelId}
            parsedStudents={parsedStudents}
            renderPreviewColumns={() => {
              const columns = ["Name", "Level", "Group", "Schedule", "Email"]
              customFields.forEach((field) => columns.push(toSnakeCase(field.name)))
              return columns
            }}
            selectedScheduleId={selectedScheduleId}
            setParsedStudents={setParsedStudents}
          />
        )}

        {step === "importing" && <ImportingStep progress={importProgress} />}

        {step === "complete" && <ImportResultsStep results={importResults} />}

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
              <Button onClick={handleImport} disabled={validStudentCount === 0}>
                Import {validStudentCount} Students
              </Button>
            </>
          )}
          {step === "importing" && <Button disabled>Importing...</Button>}
          {step === "complete" && <Button onClick={handleClose}>Done</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

