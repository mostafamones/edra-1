import { SessionDetailsView } from "@/components/sessions/session-details-view"
import { getServerAcademyIdForSlug } from "@/lib/user-server"

export default async function SessionDetailsPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>
}) {
  const { slug, id } = await params
  const academyId = await getServerAcademyIdForSlug(slug)

  if (!academyId) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        We could not load your academy. Please sign in again.
      </div>
    )
  }

  return <SessionDetailsView academyId={academyId} hashId={id} />
}

