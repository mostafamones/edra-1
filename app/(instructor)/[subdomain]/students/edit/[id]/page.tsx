"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname, useParams } from "next/navigation"
import { StudentForm } from "@/components/students/student-form"
import { SiteHeader } from "@/components/site-header"
import { getCurrentUserAcademyForSubdomain } from "@/lib/user"
import { withAcademyPath } from "@/components/helpers/sidebar"
import { invalidateStudents } from "@/lib/hooks/use-data"
import { DataSkeleton } from "@/components/ui/data-skeleton"
import { toast } from "sonner"
import type { StudentWithLevelRating } from "@/lib/types"

export default function EditStudentPage() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useParams()
  const studentId = params?.id as string | undefined
  const subdomain = params?.subdomain as string | undefined

  const [academyId, setAcademyId] = useState<string | null>(null)
  const [student, setStudent] = useState<StudentWithLevelRating | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCurrentUserAcademyForSubdomain(subdomain).then((id) => {
      if (id) setAcademyId(id)
    })
  }, [subdomain])

  useEffect(() => {
    if (!studentId) return
    setLoading(true)
    fetch(`/api/students/${studentId}`)
      .then((r) => {
        if (!r.ok) throw new Error("Student not found")
        return r.json()
      })
      .then((data) => setStudent(data))
      .catch(() => {
        toast.error("Failed to load student")
        router.push(withAcademyPath(pathname, "/students"))
      })
      .finally(() => setLoading(false))
  }, [studentId])

  const handleSuccess = () => {
    invalidateStudents()
    router.push(withAcademyPath(pathname, "/students"))
  }

  const handleCancel = () => {
    router.push(withAcademyPath(pathname, "/students"))
  }

  const backToList = () => router.push(withAcademyPath(pathname, "/students"))

  return (
    <>
      <SiteHeader
        title={loading ? "Edit Student" : (student?.full_name || "Edit Student")}
        breadcrumb={[
          { label: "Students", href: withAcademyPath(pathname, "/students") },
          { label: loading ? "..." : (student?.full_name || "Edit") },
        ]}
        back={backToList}
      />
      <div className="p-4 lg:p-6 max-w-2xl">
        {loading || !academyId ? (
          <DataSkeleton variant="form" count={4} />
        ) : (
          <StudentForm
            academyId={academyId}
            initialStudent={student}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        )}
      </div>
    </>
  )
}
