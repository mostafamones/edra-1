import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

// Server-side Supabase client (uses service role key for admin operations)
export const getServiceSupabase = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!serviceRoleKey) {
    console.warn(
      '⚠️ SUPABASE_SERVICE_ROLE_KEY not found. Using anon key instead.\n' +
      '   This may cause permission issues. Please add SUPABASE_SERVICE_ROLE_KEY to your .env.local file.'
    );
  }

  return createClient<Database>(
    supabaseUrl,
    serviceRoleKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
};
