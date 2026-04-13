"use client"

import { useEffect, useState } from "react"
import { useParams, usePathname, useRouter } from "next/navigation"
import { SiteHeader } from "@/components/site-header"
import { withAcademyPath } from "@/components/helpers/sidebar"
import { getCurrentUserAcademyForSlug } from "@/lib/user"
import { invalidateSchedules } from "@/lib/hooks/use-data"
import { DataSkeleton } from "@/components/ui/data-skeleton"
import { ScheduleForm } from "@/components/schedules/schedule-form"

export default function CreateSchedulePage() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useParams()
  const slug = params?.slug as string | undefined

  const [academyId, setAcademyId] = useState<string | null>(null)

  useEffect(() => {
    getCurrentUserAcademyForSlug(slug).then((id) => {
      if (id) setAcademyId(id)
    })
  }, [slug])

  const goBackToSchedules = () => router.push(withAcademyPath(pathname, "/schedules"))

  const handleSuccess = () => {
    invalidateSchedules()
    goBackToSchedules()
  }

  return (
    <>
      <SiteHeader
        title="New Schedule"
        breadcrumb={[
          { label: "Schedules", href: withAcademyPath(pathname, "/schedules") },
          { label: "New Schedule" },
        ]}
        back={goBackToSchedules}
        separator
      />

      <div className="flex flex-1">
        {!academyId ? (
          <div className="p-4 lg:p-6 w-full">
            <DataSkeleton variant="form" count={6} showHeader={false} />
          </div>
        ) : (
          <ScheduleForm academyId={academyId} onSuccess={handleSuccess} onCancel={goBackToSchedules} />
        )}
      </div>
    </>
  )
}

