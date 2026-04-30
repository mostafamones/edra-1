"use client"

import { IconCheck, IconUpload, IconX } from "@tabler/icons-react"

import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"

interface ImportResults {
  created: number
  skipped: number
  skippedNames: string[]
  errors: string[]
}

export function ImportingStep({ progress }: { progress: number }) {
  return (
    <div className="space-y-6 py-8">
      <div className="space-y-2 text-center">
        <IconUpload className="mx-auto size-12 animate-pulse" />
        <p className="text-lg font-medium">Importing students...</p>
        <p className="text-sm text-muted-foreground">Please wait while we process your file</p>
      </div>
      <Progress value={progress} />
    </div>
  )
}

export function ImportResultsStep({ results }: { results: ImportResults }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
          <div className="flex items-center gap-2 text-green-700 dark:text-green-500">
            <IconCheck className="size-5" />
            <p className="text-sm font-medium">Imported</p>
          </div>
          <p className="mt-1 text-3xl font-bold text-green-700 dark:text-green-500">
            {results.created}
          </p>
        </div>
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
          <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-500">
            <IconX className="size-5" />
            <p className="text-sm font-medium">Skipped</p>
          </div>
          <p className="mt-1 text-3xl font-bold text-yellow-700 dark:text-yellow-500">
            {results.skipped}
          </p>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
          <div className="flex items-center gap-2 text-red-700 dark:text-red-500">
            <IconX className="size-5" />
            <p className="text-sm font-medium">Errors</p>
          </div>
          <p className="mt-1 text-3xl font-bold text-red-700 dark:text-red-500">
            {results.errors.length}
          </p>
        </div>
      </div>

      {results.skippedNames.length > 0 && (
        <div className="rounded-lg bg-muted/30 p-3">
          <p className="mb-2 text-sm font-medium">
            {results.skipped} student{results.skipped > 1 ? "s were" : " was"} skipped
          </p>
          <ScrollArea className="h-20">
            <ul className="space-y-0.5 text-xs text-muted-foreground">
              {results.skippedNames.map((name, index) => (
                <li key={index}>• {name}</li>
              ))}
            </ul>
          </ScrollArea>
        </div>
      )}

      {results.errors.length > 0 && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3">
          <p className="mb-2 text-sm font-medium text-destructive">Errors:</p>
          <ScrollArea className="h-20">
            <ul className="space-y-0.5 text-xs text-destructive">
              {results.errors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </ScrollArea>
        </div>
      )}
    </div>
  )
}
