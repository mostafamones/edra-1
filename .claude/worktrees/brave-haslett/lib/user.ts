import { supabase } from './supabase';

/**
 * Get the current user's academy ID directly from user metadata
 * Falls back to querying instructors table with RLS bypass if needed
 */
export async function getCurrentUserAcademy(): Promise<string | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      console.error('No authenticated user found');
      return null;
    }

    // First try to get from user metadata (fastest)
    const userMetadata = session.user.user_metadata as any;

    if (userMetadata?.academy_id) {
      console.log('Found academy_id from user metadata:', userMetadata.academy_id);
      return userMetadata.academy_id;
    }

    // Fallback: query instructor context view (joins memberships + instructors)
    console.log('Academy ID not in user metadata, querying instructor context...');

    const { data: instructorData, error } = await supabase
      .from('v_instructor_context')
      .select('academy_id')
      .eq('user_id', session.user.id)
      .eq('is_active', true)
      .order('joined_at', { ascending: false })
      .limit(1)
      .maybeSingle<{ academy_id: string | null }>();

    if (error) {
      console.error('Error fetching instructor context from database:', error.message || error);
      // This often happens due to RLS policies blocking the query
      // The academy_id should be in user metadata if login/signup handled it correctly
      return null;
    }

    if (!instructorData) {
      console.warn('No active instructor membership found for user:', session.user.id);
      return null;
    }

    console.log('Found academy_id:', instructorData.academy_id);
    return instructorData.academy_id || null;
  } catch (error) {
    console.error('Unexpected error fetching user academy:', error);
    return null;
  }
}

/**
 * Resolve academy ID for the current URL subdomain.
 *
 * This avoids relying on `user_metadata.academy_id`, which can represent a
 * different (previously active) academy when the user belongs to multiple.
 */
export async function getCurrentUserAcademyForSubdomain(
  subdomain: string | null | undefined
): Promise<string | null> {
  if (!subdomain) return null;

  try {
    const res = await fetch("/api/academy/me");
    if (!res.ok) return null;
    const body = (await res.json()) as {
      academies?: { id: string; subdomain: string }[];
    };

    const match = (body.academies ?? []).find((a) => a.subdomain === subdomain);
    return match?.id ?? null;
  } catch {
    return null;
  }
}

/**
 * Get the current user's role directly from user metadata
 * Falls back to querying instructors table with RLS bypass if needed
 */
export async function getCurrentUserRole(): Promise<string | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      console.error('No authenticated user found');
      return null;
    }

    // First try to get from user metadata (fastest)
    const userMetadata = session.user.user_metadata as any;

    if (userMetadata?.role) {
      console.log('Found role from user metadata:', userMetadata.role);
      return userMetadata.role;
    }

    // Fallback: query instructor context view (joins memberships + instructors)
    console.log('Role not in user metadata, querying instructor context...');

    const { data: instructorData, error } = await supabase
      .from('v_instructor_context')
      .select('role')
      .eq('user_id', session.user.id)
      .eq('is_active', true)
      .order('joined_at', { ascending: false })
      .limit(1)
      .maybeSingle<{ role: string | null }>();

    if (error) {
      console.error('Error fetching instructor role from context:', error);
      return null;
    }

    if (!instructorData) {
      console.warn('No active instructor membership found for user:', session.user.id);
      return null;
    }

    console.log('Found role:', instructorData.role);
    return instructorData.role || null;
  } catch (error) {
    console.error('Unexpected error fetching user role:', error);
    return null;
  }
}
