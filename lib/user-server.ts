import { createClient } from "@/utils/supabase/server"
import { getServiceSupabase } from "@/utils/supabase/admin"

/**
 * Resolve the current instructor's academy ID on the server (cookie session).
 */
export async function getServerAcademyId(): Promise<string | null> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return null
    }

    const meta = user.user_metadata as { academy_id?: string } | undefined
    if (meta?.academy_id) {
      return meta.academy_id
    }

    const { data: row, error } = await supabase
      .from("v_instructor_context")
      .select("academy_id")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("joined_at", { ascending: false })
      .limit(1)
      .maybeSingle<{ academy_id: string | null }>()

    if (error || !row) {
      return null
    }

    return row.academy_id ?? null
  } catch {
    return null
  }
}

/**
 * Resolve academy ID for a specific `[subdomain]` route on the server.
 *
 * This ensures instructor pages fetch data for the academy in the URL,
 * not whichever academy happens to be in `user_metadata` / last-active context.
 */
export async function getServerAcademyIdForSubdomain(
  subdomain: string
): Promise<string | null> {
  try {
    const client = await createClient()
    const {
      data: { user },
      error: userError,
    } = await client.auth.getUser()

    if (userError || !user) return null

    const supabase = getServiceSupabase()

    const { data: instructor, error: instrError } = await (supabase as any)
      .from("instructors")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle()

    if (instrError || !instructor?.id) return null

    const { data: memberships, error: memError } = await (supabase as any)
      .from("academy_memberships")
      .select("academy:academies(id, subdomain)")
      .eq("instructor_id", instructor.id)
      .eq("is_active", true)

    if (memError) return null

    const match = (memberships ?? []).find(
      (m: any) => m.academy?.subdomain === subdomain
    )

    return match?.academy?.id ?? null
  } catch {
    return null
  }
}
