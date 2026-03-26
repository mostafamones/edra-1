"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { StudentForm } from "@/components/students/student-form"
import { SiteHeader } from "@/components/site-header"
import { getCurrentUserAcademyForSubdomain } from "@/lib/user"
import { withAcademyPath } from "@/components/helpers/sidebar"
import { invalidateStudents } from "@/lib/hooks/use-data"
import { DataSkeleton } from "@/components/ui/data-skeleton"
import { useParams } from "next/navigation"

export default function CreateStudentPage() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useParams()
  const subdomain = params?.subdomain as string | undefined
  const [academyId, setAcademyId] = useState<string | null>(null)

  useEffect(() => {
    getCurrentUserAcademyForSubdomain(subdomain).then((id) => {
      if (id) setAcademyId(id)
    })
  }, [subdomain])

  const handleSuccess = () => {
    invalidateStudents()
    router.push(withAcademyPath(pathname, "/students"))
  }

  const handleCancel = () => {
    router.push(withAcademyPath(pathname, "/students"))
  }

  return (
    <>
      <SiteHeader
        title="New Student"
        breadcrumb={[
          { label: "Students", href: withAcademyPath(pathname, "/students") },
          { label: "New Student" },
        ]}
        back={() => router.push(withAcademyPath(pathname, "/students"))}
        separator
      />
      <div className="flex flex-1">
        {!academyId ? (
          <DataSkeleton variant="form" count={4} />
        ) : (
          <StudentForm
            academyId={academyId}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        )}
      </div>
    </>
  )
}
