"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"
import { IconLoader, IconScan } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { invalidateAttendance } from "@/lib/hooks/use-attendance"
import { useStudents } from "@/lib/hooks/use-data"
import { decodeStudentId, encodeStudentId } from "@/lib/hashid"
import type { AttendanceWithStudent, SessionWithSchedule } from "@/lib/types"
import { AttendanceStatus } from "@/lib/types"

interface AttendanceScannerProps {
  session: SessionWithSchedule
  attendanceData?: AttendanceWithStudent[]
  onScanSuccess?: () => void
}

export function AttendanceScanner({
  session,
  attendanceData = [],
  onScanSuccess,
}: AttendanceScannerProps) {
  const [hashId, setHashId] = useState("")
  const [lateFromMins, setLateFromMins] = useState(15)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const { data: allStudentsData } = useStudents(session.academy_id)
  const allStudents = allStudentsData || []

  const validStudents = useMemo(() => {
    const attendedIds = new Set(attendanceData.map((a) => a.student_id))
    return allStudents.filter((student) => {
      if (attendedIds.has(student.id)) return false

      const hasMatchingSchedule = student.schedule_enrollments?.some(
        (e) => e.schedule?.id === session.schedule?.id
      )
      if (!hasMatchingSchedule) return false

      return true
    })
  }, [allStudents, session.schedule?.id, attendanceData])

  const searchResults = useMemo(() => {
    if (!hashId.trim()) return validStudents.slice(0, 50)
    const term = hashId.toLowerCase()
    return validStudents
      .filter(
        (s) =>
          s.full_name.toLowerCase().includes(term) ||
          encodeStudentId(s.id).toLowerCase().includes(term)
      )
      .slice(0, 50)
  }, [validStudents, hashId])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const processSubmission = async (submitHashId: string) => {
    if (!submitHashId.trim()) return

    const decodedId = decodeStudentId(submitHashId)
    if (attendanceData.some((a) => a.student_id === decodedId)) {
      toast.error("Student has already been scanned.")
      setHashId("")
      return
    }

    setIsSubmitting(true)
    try {
      const sessionStart = new Date(session.created_at || session.session_date)
      const now = new Date()
      const diffMins = (now.getTime() - sessionStart.getTime()) / 60000

      const calculatedStatus =
        diffMins > lateFromMins ? AttendanceStatus.LATE : AttendanceStatus.PRESENT

      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hashId: submitHashId,
          sessionId: session.id,
          academyId: session.academy_id,
          status: calculatedStatus,
          checkin_time: now.toISOString(),
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to record attendance")

      toast.success(`Marked as ${calculatedStatus}`)
      invalidateAttendance()
      onScanSuccess?.()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsSubmitting(false)
      setHashId("")
      setTimeout(() => inputRef.current?.focus(), 10)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    let submitId = hashId.trim()

    const exactMatch = searchResults.find(
      (s) => encodeStudentId(s.id).toUpperCase() === submitId.toUpperCase()
    )
    if (exactMatch) submitId = encodeStudentId(exactMatch.id)

    processSubmission(submitId)
  }

  return (
    <div className="w-full rounded-xl flex flex-col md:flex-row gap-4 items-end md:items-center shadow-sm">
      <form
        onSubmit={handleSubmit}
        className="flex-1 w-full flex flex-col md:flex-row items-stretch md:items-center gap-3 relative"
      >
        <div className="relative flex-1">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground z-10 pointer-events-none">
            <IconScan className="size-5" />
          </div>
          <Input
            ref={inputRef}
            value={hashId}
            onChange={(e) => setHashId(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            placeholder="Search student or scan ID..."
            className="pl-10 h-12 text-lg shadow-sm w-full relative z-0"
            disabled={isSubmitting}
            autoComplete="off"
            autoFocus
          />
          {isFocused && searchResults.length > 0 && hashId.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-popover text-popover-foreground border rounded-lg shadow-xl max-h-72 overflow-y-auto z-50 p-1.5 animate-in fade-in zoom-in-95 duration-100">
              {searchResults.map((student) => {
                const encodedId = encodeStudentId(student.id)
                return (
                  <div
                    key={student.id}
                    className="px-3 py-2.5 cursor-pointer hover:bg-accent hover:text-accent-foreground rounded-md flex flex-col gap-0.5 transition-colors group"
                    onMouseDown={(e) => {
                      e.preventDefault()
                      setHashId(encodedId)
                      setIsFocused(false)
                      processSubmission(encodedId)
                    }}
                  >
                    <span className="text-sm font-semibold group-hover:text-primary transition-colors">
                      {student.full_name}
                    </span>
                    <span className="text-[11px] text-muted-foreground font-mono uppercase tracking-wider">
                      {encodedId}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <Button
          type="submit"
          disabled={isSubmitting || !hashId.trim()}
          className="h-12 px-6 whitespace-nowrap"
        >
          {isSubmitting ? <IconLoader className="size-4 animate-spin mr-2" /> : null}
          Submit
        </Button>
      </form>
    </div>
  )
}

