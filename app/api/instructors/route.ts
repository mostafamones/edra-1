import { getInstructors, updateInstructor, deleteInstructor } from "@/lib";
import { getServiceSupabase } from "@/lib/supabase";
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

    const instructors = await getInstructors(academyId);

    // Enrich with user email from auth.users using the service-role client
    const supabase = getServiceSupabase();
    const enriched = await Promise.all(
      instructors.map(async (inst) => {
        try {
          const { data } = await (supabase as any).auth.admin.getUserById(inst.id);
          return {
            ...inst,
            email: data?.user?.email || null,
          };
        } catch {
          return { ...inst, email: null };
        }
      })
    );

    // Sort: owner first, then admins, then instructors
    const roleOrder: Record<string, number> = { owner: 0, admin: 1, instructor: 2 };
    enriched.sort((a, b) => (roleOrder[a.role] ?? 3) - (roleOrder[b.role] ?? 3));

    return NextResponse.json(enriched);
  } catch (error) {
    console.error("Error fetching instructors:", error);
    return NextResponse.json(
      { error: "Failed to fetch instructors" },
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
        { error: "Instructor ID is required" },
        { status: 400 }
      );
    }

    const updated = await updateInstructor(id, updates);
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating instructor:", error);
    return NextResponse.json(
      { error: "Failed to update instructor" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Instructor ID is required" },
        { status: 400 }
      );
    }

    await deleteInstructor(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting instructor:", error);
    return NextResponse.json(
      { error: "Failed to delete instructor" },
      { status: 500 }
    );
  }
}
