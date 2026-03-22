import { getInstructor, updateInstructor } from "@/lib/db/instructors";
import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const instructor = await getInstructor(user.id);

    // Fetch instructor's active academy memberships to get role
    const { data: membershipsData } = await (supabase as any)
      .from("academy_memberships")
      .select(`
        *,
        academy:academies(name, id)
      `)
      .eq("instructor_id", instructor.id)
      .eq("is_active", true)
      .order("joined_at", { ascending: false });

    const membership = membershipsData?.[0];
    const academyId = membership?.academy_id;
    const role = membership?.role;
    const isAcademyMember = membership?.academy_id === academyId;

    const profile = {
      id: instructor.id,
      email: user.email,
      full_name: instructor.full_name || user.user_metadata?.full_name || null,
      phone: instructor.phone || null,
      avatar_url: instructor.avatar_url || user.user_metadata?.avatar_url || null,
      original_avatar_path: instructor.original_avatar_path || null,
      role: isAcademyMember ? role : null,
      is_active: membership?.is_active ?? true,
    };

    return NextResponse.json(profile);
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { full_name, phone } = body;

    if (Object.keys(body).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const updated = await updateInstructor(user.id, body);

    // Sync full_name to auth metadata if provided
    if (full_name !== undefined) {
      await supabase.auth.updateUser({
        data: { full_name: full_name.trim() || "" }
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
