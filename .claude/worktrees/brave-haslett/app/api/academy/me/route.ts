import { createClient } from "@/utils/supabase/server";
import { getServiceSupabase } from "@/utils/supabase/admin";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // 1. Identify the calling user from the cookie session
    const client = await createClient();
    const { data: { user }, error: authError } = await client.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Use service client to bypass RLS
    const supabase = getServiceSupabase();

    // 3. Get instructor record
    const { data: instructor, error: instrError } = await (supabase as any)
      .from("instructors")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (instrError) {
      console.error("Instructor lookup error:", instrError);
      return NextResponse.json({ academies: [] });
    }

    if (!instructor) {
      return NextResponse.json({ academies: [] });
    }

    // 4. Fetch all active memberships with academy details
    const { data: memberships, error: memError } = await (supabase as any)
      .from("academy_memberships")
      .select("role, academy:academies(id, name, subdomain, icon)")
      .eq("instructor_id", instructor.id)
      .eq("is_active", true);

    if (memError) {
      console.error("Memberships lookup error:", memError);
      return NextResponse.json({ academies: [] });
    }

    const academies = (memberships ?? [])
      .filter((m: any) => m.academy)
      .map((m: any) => ({
        id: m.academy.id,
        name: m.academy.name,
        subdomain: m.academy.subdomain,
        icon: m.academy.icon ?? null,
        role: m.role,
      }));

    return NextResponse.json({ academies });
  } catch (err) {
    console.error("Error fetching user academies:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
