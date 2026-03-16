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

    // Fallback: query instructors table (may hit RLS, but try it)
    console.log('Academy ID not in user metadata, querying instructors table...');

    const { data: instructorData, error } = await supabase
      .from('instructors')
      .select('academy_id')
      .eq('id', session.user.id)
      .limit(1)
      .maybeSingle<{ academy_id: string }>();

    if (error) {
      console.error('Error fetching instructor from database:', error.message || error);
      // This often happens due to RLS policies blocking the query
      // The academy_id should be in user metadata if login/signup handled it correctly
      return null;
    }

    if (!instructorData) {
      console.warn('No instructor record found for user:', session.user.id);
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

    // Fallback: query instructors table (may hit RLS, but try it)
    console.log('Role not in user metadata, querying instructors table...');

    const { data: instructorData, error } = await supabase
      .from('instructors')
      .select('role')
      .eq('id', session.user.id)
      .limit(1)
      .maybeSingle<{ role: string }>();

    if (error) {
      console.error('Error fetching instructor role:', error);
      return null;
    }

    if (!instructorData) {
      console.warn('No instructor record found for user:', session.user.id);
      return null;
    }

    console.log('Found role:', instructorData.role);
    return instructorData.role || null;
  } catch (error) {
    console.error('Unexpected error fetching user role:', error);
    return null;
  }
}
