import { getServiceSupabase } from "@/utils/supabase/admin";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/guard";

export async function GET(): Promise<NextResponse> {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  try {
    const supabase = getServiceSupabase();

    if (!auth.ctx.instructorId) {
      return NextResponse.json({ academies: [] });
    }
    const instructor = { id: auth.ctx.instructorId };

    // 4. Fetch all active memberships with academy details
    const { data: memberships, error: memError } = await (supabase as any)
      .from("academy_memberships")
      .select("role, academy:academies(id, name, slug, icon)")
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
        slug: m.academy.slug,
        icon: m.academy.icon ?? null,
        role: m.role,
      }));

    return NextResponse.json({ academies });
  } catch (err) {
    console.error("Error fetching user academies:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
