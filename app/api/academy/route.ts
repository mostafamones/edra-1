import { getAcademy, updateAcademy } from "@/lib/db/academies";
import { getAcademyMemberships as getMemberships } from "@/lib/db/academy-memberships";
import { getServiceSupabase } from "@/utils/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const academyId = request.nextUrl.searchParams.get("academyId");

    if (!academyId) {
      return NextResponse.json(
        { error: "Academy ID is required" },
        { status: 400 }
      );
    }

    const [academy, memberships] = await Promise.all([
      getAcademy(academyId),
      getMemberships(academyId),
    ]);

    // Count active instructors (those with active memberships)
    const activeInstructorCount = memberships?.filter(m => m.is_active).length || 0;

    // Fetch owner email from auth.users
    let ownerEmail: string | null = null;
    try {
      const supabase = getServiceSupabase();
      const { data } = await (supabase as any).auth.admin.getUserById(academy.owner_id);
      ownerEmail = data?.user?.email || null;
    } catch {
      // Owner email is non-critical, fall back to null
    }

    return NextResponse.json({
      ...academy,
      instructor_count: activeInstructorCount,
      owner_email: ownerEmail,
    });
  } catch (error) {
    console.error("Error fetching academy:", error);
    return NextResponse.json(
      { error: "Failed to fetch academy details" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Academy ID is required" },
        { status: 400 }
      );
    }

    const academy = await updateAcademy(id, updates);
    return NextResponse.json(academy);
  } catch (error) {
    console.error("Error updating academy:", error);
    return NextResponse.json(
      { error: "Failed to update academy" },
      { status: 500 }
    );
  }
}
