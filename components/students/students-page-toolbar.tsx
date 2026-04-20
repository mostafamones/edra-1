"use client"

import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { IconUserPlus, IconUpload } from "@tabler/icons-react"
import { Refresh } from "@/components/ui/refresh"
import { withAcademyPath } from "@/components/helpers/sidebar"
import { StudentImportDialog } from "./student-import-dialog"
import type { Level, Group, StudentField, Schedule } from "@/lib/types"

export interface StudentsPageToolbarProps {
  academyId: string
  levels: Level[]
  groups: Group[]
  fields: StudentField[]
  schedules: Schedule[]
  existingStudentNames: string[]
  /** When set (e.g. from use-data hooks), used for Refresh + after import. Defaults to router.refresh(). */
  onRefresh?: () => void | Promise<void>
  buttonVariant?: "ghost" | "outline"
  buttonSize?: "default" | "lg"
}

export function StudentsPageToolbar({
  academyId,
  levels,
  groups,
  fields,
  schedules,
  existingStudentNames,
  onRefresh,
  buttonVariant = "outline",
  buttonSize = "default",
}: StudentsPageToolbarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [importOpen, setImportOpen] = useState(false)

  const refresh = () => {
    if (onRefresh) {
      void Promise.resolve(onRefresh())
    } else {
      router.refresh()
    }
  }

  return (
    <>
      <Refresh func={refresh} variant={buttonVariant} size="icon" />
      <Button
        variant={buttonVariant}
        size={buttonSize}
        className="gap-1.5"
        onClick={() => setImportOpen(true)}
      >
        <IconUpload className="size-4" />
        Import
      </Button>
      <Button
        variant={buttonVariant}
        size={buttonSize}
        className="gap-1.5"
        onClick={() => router.push(withAcademyPath(pathname, "/students/create"))}
      >
        <IconUserPlus className="size-4" />
        Add Student
      </Button>

      <StudentImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onSuccess={refresh}
        academyId={academyId}
        levels={levels}
        groups={groups}
        customFields={fields}
        existingStudents={existingStudentNames}
        schedules={schedules}
      />
    </>
  )
}
