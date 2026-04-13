import { StudentsPageContent } from "@/components/students/students-page-content"
import { getServerAcademyIdForSlug } from "@/lib/user-server"

/**
 * Server: resolve academy from session only. All student/schedule/level/group/field
 * data is loaded client-side via useStudents, useSchedules, etc. (see use-data.ts).
 */
export default async function StudentsPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const academyId = await getServerAcademyIdForSlug(slug)

  if (!academyId) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        We could not load your academy. Please sign in again.
      </div>
    )
  }

  return <StudentsPageContent academyId={academyId} />
}
