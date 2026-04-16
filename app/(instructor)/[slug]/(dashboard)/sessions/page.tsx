import { SessionsView } from "@/components/sessions"
import { getServerAcademyIdForSlug } from "@/lib/user-server"

/**
 * Server: resolve academy from session only. All sessions data is loaded
 * client-side via `useSessions` (see `lib/hooks/use-data.ts`).
 */
export default async function SessionsPage({
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

  return <SessionsView academyId={academyId} />
}

