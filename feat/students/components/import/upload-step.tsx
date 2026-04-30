"use client"

import { IconCode, IconDownload, IconFileSpreadsheet } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Group, Level, StudentField } from "@/lib/types"

import type { ImportFormat, ImportSchedule } from "../../types"
import { formatDay, formatTime, toSnakeCase } from "../../utils/import-parsers"

interface UploadStepProps {
  availableGroups: Group[]
  availableSchedules: ImportSchedule[]
  customFields: StudentField[]
  defaultGroupId: string
  defaultLevelId: string
  dragActive: boolean
  fileInputRef: React.RefObject<HTMLInputElement | null>
  format: ImportFormat
  groups: Group[]
  handleDownloadTemplate: () => void
  handleDrag: (event: React.DragEvent) => void
  handleDrop: (event: React.DragEvent) => void
  handleFileSelect: (file: File | null) => void
  levels: Level[]
  selectedScheduleId: string
  setDefaultGroupId: (value: string) => void
  setDefaultLevelId: (value: string) => void
  setFormat: (value: ImportFormat) => void
  setSelectedScheduleId: (value: string) => void
}

export function UploadStep({
  availableGroups,
  availableSchedules,
  customFields,
  defaultGroupId,
  defaultLevelId,
  dragActive,
  fileInputRef,
  format,
  groups,
  handleDownloadTemplate,
  handleDrag,
  handleDrop,
  handleFileSelect,
  levels,
  selectedScheduleId,
  setDefaultGroupId,
  setDefaultLevelId,
  setFormat,
  setSelectedScheduleId,
}: UploadStepProps) {
  return (
    <div className="space-y-4">
      <Tabs value={format} onValueChange={(value) => setFormat(value as ImportFormat)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="csv">
            <IconFileSpreadsheet className="mr-2 size-4" />
            CSV
          </TabsTrigger>
          <TabsTrigger value="json">
            <IconCode className="mr-2 size-4" />
            JSON
          </TabsTrigger>
        </TabsList>

        <TabsContent value={format} className="mt-4 space-y-4">
          <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
            <div>
              <p className="text-sm font-medium">Download Template</p>
              <p className="text-xs text-muted-foreground">
                Get a template file with the correct format
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
              <IconDownload className="mr-2 size-4" />
              Download {format.toUpperCase()}
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="default-level">Default Level</Label>
              <Select
                value={defaultLevelId || "__none__"}
                onValueChange={(value) => {
                  setDefaultLevelId(value === "__none__" ? "" : value)
                  setDefaultGroupId("")
                }}
              >
                <SelectTrigger id="default-level" className="w-full">
                  <SelectValue placeholder="Optional" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {levels.map((level) => (
                    <SelectItem key={level.id} value={level.id.toString()}>
                      {level.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="default-group">Default Group</Label>
              <Select
                value={defaultGroupId || "__none__"}
                onValueChange={(value) => setDefaultGroupId(value === "__none__" ? "" : value)}
                disabled={!defaultLevelId || availableGroups.length === 0}
              >
                <SelectTrigger id="default-group" className="w-full">
                  <SelectValue placeholder="Optional" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {availableGroups.map((group) => (
                    <SelectItem key={group.id} value={group.id.toString()}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {availableSchedules.length > 0 && defaultLevelId && defaultLevelId !== "__none__" && (
            <div className="space-y-2">
              <Label htmlFor="default-schedule">Enroll in Schedule</Label>
              <Select
                value={selectedScheduleId || "__none__"}
                onValueChange={(value) => setSelectedScheduleId(value === "__none__" ? "" : value)}
              >
                <SelectTrigger id="default-schedule" className="w-full">
                  <SelectValue placeholder="Optional" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {availableSchedules.map((schedule) => (
                    <SelectItem key={schedule.id} value={schedule.id.toString()}>
                      {schedule.name}
                      {(schedule.time_slots || []).map((slot) => {
                        const start = formatTime(slot.start_time)
                        return ` • ${formatDay(slot.day_of_week)} ${start}`
                      })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div
            className={`relative rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
              dragActive ? "border-primary bg-primary/5" : "border-input hover:border-primary/50"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={format === "csv" ? ".csv" : ".json"}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              onChange={(event) => handleFileSelect(event.target.files?.[0] || null)}
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

          <div className="space-y-1 text-xs text-muted-foreground">
            <p>
              <strong>Required columns:</strong> full_name, level
            </p>
            <p>
              <strong>Optional columns:</strong> group, schedule, email
            </p>
            {customFields.length > 0 && (
              <p>
                <strong>Custom fields:</strong>{" "}
                {customFields.map((field) => toSnakeCase(field.name)).join(", ")}
              </p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

