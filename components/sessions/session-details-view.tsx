"use client"

import { useMemo, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { toast } from "sonner"
import { IconPencil } from "@tabler/icons-react"

import { SiteHeader } from "@/components/site-header"
import { Button } from "@/components/ui/button"
import { DataSkeleton } from "@/components/ui/data-skeleton"
import { Refresh } from "@/components/ui/refresh"
import { withAcademyPath } from "@/components/helpers/sidebar"

import { decodeSessionId } from "@/lib/hashid"
import { useAttendance } from "@/lib/hooks/use-attendance"
import { useSession } from "@/lib/hooks/use-data"

import { SessionSummary } from "./session-details/session-summary"
import { AttendanceScanner } from "./session-details/attendance-scanner"
import { AttendanceTable } from "./session-details/attendance-table"
import { SessionEditForm } from "./session-edit-form"

export interface SessionDetailsViewProps {
  academyId: string
  hashId: string
}

export function SessionDetailsView({ academyId, hashId }: SessionDetailsViewProps) {
  const router = useRouter()
  const pathname = usePathname()

  const sessionId = useMemo(() => decodeSessionId(hashId), [hashId])
  const { data: session, loading: sessionLoading, refresh: refreshSession } = useSession(sessionId || null)
  const { data: attendance, loading: attendanceLoading, refresh: refreshAttendance } = useAttendance(sessionId || null)

  const [isEditing, setIsEditing] = useState(false)

  const refresh = () => {
    refreshSession()
    refreshAttendance()
  }

  if (sessionLoading || !session) {
    return (
      <>
        <SiteHeader
          title="Session"
          subtitle="Loading session details…"
          actions={<Refresh func={refresh} variant="ghost" />}
        />
        <div className="p-4 lg:p-6">
          <DataSkeleton variant="detail" />
        </div>
      </>
    )
  }

  const scheduleName = session.schedule?.name || "Session"

  return (
    <>
      <SiteHeader
        title={scheduleName}
        subtitle="Session details"
        breadcrumb={[
          { label: "Sessions", href: withAcademyPath(pathname, "/sessions") },
          { label: scheduleName },
        ]}
        back={() => router.push(withAcademyPath(pathname, "/sessions"))}
        separator
        actions={
          <div className="flex items-center gap-2">
            <Refresh func={refresh} variant="ghost" />
            <Button
              variant="ghost"
              className="gap-1.5"
              onClick={() => setIsEditing((v) => !v)}
            >
              <IconPencil className="size-4" />
              {isEditing ? "Close edit" : "Edit session"}
            </Button>
          </div>
        }
      />

      {isEditing ? (
        <SessionEditForm
          academyId={academyId}
          session={session}
          onCancel={() => setIsEditing(false)}
          onSuccess={() => {
            toast.success("Session updated")
            setIsEditing(false)
            refresh()
          }}
        />
      ) : (
        <div className="pb-10">
          <SessionSummary session={session} attendanceData={attendance || []} onRefresh={refresh} />
          <div className="px-4 lg:px-6 mt-6 space-y-6">
            {session.status === "live" && (
              <AttendanceScanner
                session={session}
                attendanceData={attendance || []}
                onScanSuccess={refreshAttendance}
              />
            )}
            <AttendanceTable
              session={session}
              data={attendance || []}
              loading={attendanceLoading}
              onStatusUpdate={refreshAttendance}
            />
          </div>
        </div>
      )}
    </>
  )
}

