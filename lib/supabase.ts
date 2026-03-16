import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.');
}

// Client-side Supabase client (uses anon key)
export const supabase = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);

// Server-side Supabase client (uses service role key for admin operations)
// This is lazy-loaded to ensure environment variables are available
let serviceSupabaseInstance: ReturnType<typeof createSupabaseClient<Database>> | null = null;

export const getServiceSupabase = (): ReturnType<typeof createSupabaseClient<Database>> => {
  if (serviceSupabaseInstance) {
    return serviceSupabaseInstance;
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    console.warn(
      '⚠️  SUPABASE_SERVICE_ROLE_KEY not found. Using anon key instead.\n' +
      '   This may cause permission issues. Please add SUPABASE_SERVICE_ROLE_KEY to your .env.local file.\n' +
      '   Make sure to restart your dev server after adding it.'
    );
    // Fallback to anon key if service role key is not available
    serviceSupabaseInstance = createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  } else {
    serviceSupabaseInstance = createSupabaseClient<Database>(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }

  return serviceSupabaseInstance;
};
