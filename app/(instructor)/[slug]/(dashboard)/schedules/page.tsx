import { SchedulesView } from "@/feat/schedules"
import { getServerAcademyIdForSlug } from "@/lib/user-server"

/**
 * Server: resolve academy from session only. All schedules data is loaded
 * client-side via the schedules feature hook.
 */
export default async function SchedulesPage({
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

  return <SchedulesView academyId={academyId} />
}
