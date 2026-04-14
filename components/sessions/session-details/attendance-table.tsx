"use client"

import { useMemo, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { toast } from "sonner"
import { IconTrash } from "@tabler/icons-react"

import { useFields } from "@/lib/hooks/use-data"
import { encodeStudentId } from "@/lib/hashid"
import type {
  AttendanceWithStudent,
  SessionWithSchedule,
  StudentWithLevelRating,
} from "@/lib/types"
import { AttendanceStatus } from "@/lib/types"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { StudentDataTable } from "@/components/students/student-data-table"
import { buildCompactColumns } from "@/components/students/columns"

type MixedStudentRow = StudentWithLevelRating & {
  attendanceRecord: AttendanceWithStudent
}

interface AttendanceTableProps {
  session: SessionWithSchedule
  data: AttendanceWithStudent[]
  loading?: boolean
  onStatusUpdate?: () => void
}

const statusOptions = [
  { label: "Present", value: AttendanceStatus.PRESENT },
  { label: "Late", value: AttendanceStatus.LATE },
  { label: "Excused", value: AttendanceStatus.EXCUSED },
  { label: "Absent", value: AttendanceStatus.ABSENT },
]

export function AttendanceTable({
  session,
  data,
  loading,
  onStatusUpdate,
}: AttendanceTableProps) {
  const { data: fields = [] } = useFields(session.academy_id)
  const [updatingId, setUpdatingId] = useState<number | null>(null)

  const handleStatusChange = async (studentId: number, newStatus: string) => {
    setUpdatingId(studentId)
    try {
      const res = await fetch("/api/attendance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          sessionId: session.id,
          academyId: session.academy_id,
          status: newStatus,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Failed to update status")
      }

      toast.success("Attendance updated")
      onStatusUpdate?.()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setUpdatingId(null)
    }
  }

  const handleDelete = async (studentId: number) => {
    setUpdatingId(studentId)
    try {
      const res = await fetch(
        `/api/attendance?sessionId=${session.id}&studentId=${studentId}`,
        { method: "DELETE" }
      )

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Failed to delete attendance")
      }

      toast.success("Attendance removed")
      onStatusUpdate?.()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setUpdatingId(null)
    }
  }

  const mappedData = useMemo<MixedStudentRow[]>(() => {
    return (data || []).map((record) => ({
      ...(record.student as any),
      level: (record.student as any).level || null,
      group: (record.student as any).group || null,
      schedule_enrollments: (record.student as any).schedule_enrollments || [],
      student_field_values: (record.student as any).student_field_values || [],
      attendanceRecord: record,
    }))
  }, [data])

  const columns = useMemo<ColumnDef<MixedStudentRow>[]>(() => {
    const baseCols = buildCompactColumns(fields || [], false) as ColumnDef<MixedStudentRow>[]

    const nameColIndex = baseCols.findIndex((c) => (c as any).accessorKey === "full_name")
    if (nameColIndex !== -1) {
      baseCols[nameColIndex] = {
        ...baseCols[nameColIndex],
        cell: ({ row }) => {
          const student = row.original
          const hasMatchingSchedule = student.schedule_enrollments?.some(
            (e: any) => e.schedule_id === session.schedule_id
          )
          const isAnomaly = !hasMatchingSchedule
          const isUnresolved = isAnomaly && !(student.attendanceRecord as any).note

          return (
            <div className="min-w-0 pl-2">
              <div className="flex items-center gap-2">
                <p className="font-medium text-sm truncate">{student.full_name}</p>
                {isUnresolved && (
                  <div
                    className="h-2 w-2 rounded-full bg-orange-500 shrink-0"
                    title="Attendance Anomaly"
                  />
                )}
              </div>
            </div>
          )
        },
      }
    }

    const hashCol: ColumnDef<MixedStudentRow> = {
      id: "hashId",
      header: "Hash ID",
      cell: ({ row }) => {
        const hash = encodeStudentId(row.original.id)
        return <span className="text-sm font-mono text-muted-foreground">{hash}</span>
      },
    }
    baseCols.splice(1, 0, hashCol)

    const timeCol: ColumnDef<MixedStudentRow> = {
      id: "time",
      header: "Check-in Time",
      cell: ({ row }) => {
        const timeVal = (row.original.attendanceRecord as any).checkin_time
        if (!timeVal) return <span className="text-muted-foreground text-sm">-</span>
        return (
          <span className="text-sm text-muted-foreground">
            {format(new Date(timeVal), "h:mm a")}
          </span>
        )
      },
    }

    const statusCol: ColumnDef<MixedStudentRow> = {
      id: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = (row.original.attendanceRecord as any).status
        const studentId = row.original.id
        const isUpdating = updatingId === studentId

        return session.status === "live" ? (
          <div className="w-[130px]" onClick={(e) => e.stopPropagation()}>
            <Select
              disabled={isUpdating}
              value={status}
              onValueChange={(val) => handleStatusChange(studentId, val)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <div className="flex items-center gap-2">
                      <div
                        className={`size-2 rounded-full ${
                          opt.value === AttendanceStatus.PRESENT
                            ? "bg-emerald-500"
                            : opt.value === AttendanceStatus.LATE
                              ? "bg-amber-500"
                              : opt.value === AttendanceStatus.EXCUSED
                                ? "bg-blue-500"
                                : "bg-destructive"
                        }`}
                      />
                      {opt.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <div className="w-[130px] h-6.5 flex items-center">
            <span className="text-sm text-muted-foreground">
              {statusOptions.find((opt) => opt.value === status)?.label}
            </span>
          </div>
        )
      },
    }

    if (session.status === "ended") {
      return [...baseCols, timeCol, statusCol]
    }

    const actionCol: ColumnDef<MixedStudentRow> = {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const studentId = row.original.id
        const isUpdating = updatingId === studentId
        return (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation()
              handleDelete(studentId)
            }}
            disabled={isUpdating}
          >
            <IconTrash className="size-4" />
          </Button>
        )
      },
    }

    return [...baseCols, timeCol, statusCol, actionCol]
  }, [fields, updatingId, session.status, session.schedule?.id])

  return (
    <div className="rounded-xl border bg-card">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">Attendance</p>
            <p className="text-xs text-muted-foreground">
              {data.length} record{data.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>

      <div className="p-4">
        <StudentDataTable
          data={mappedData as any}
          columns={columns as any}
          paginated
          defaultPageSize={15}
          searchable
          searchPlaceholder="Search students..."
          emptyMessage="No attendance yet"
        />
      </div>
    </div>
  )
}

