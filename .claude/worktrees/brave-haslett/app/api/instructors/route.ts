import { getInstructors, updateInstructor, deleteInstructor } from "@/lib/db/instructors";
import { getAcademyMemberships, createAcademyMembership } from "@/lib/db/academy-memberships";
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

    const memberships = await getAcademyMemberships(academyId);

    // Enrich instructor data with user emails from auth.users
    const supabase = getServiceSupabase();
    const enriched = await Promise.all(
      memberships.map(async (membership: any) => {
        try {
          const { data } = await (supabase as any).auth.admin.getUserById(membership.instructor_id);
          return {
            ...membership,
            instructor: {
              ...membership.instructor,
              email: data?.user?.email || null,
            },
          };
        } catch {
          return {
            ...membership,
            instructor: {
              ...membership.instructor,
              email: null,
            },
          };
        }
      })
    );

    // Sort by role order: owner (0), admin (1), instructor (2)
    const roleOrder: Record<string, number> = { owner: 0, admin: 1, instructor: 2 };
    enriched.sort((a, b) => (roleOrder[a.role] ?? 3) - (roleOrder[b.role] ?? 3));

    // Extract just instructor data with email for backward compatibility
    const result = enriched.map((item: any) => ({
      ...item.instructor,
      academy_id: item.academy_id,
      role: item.role,
      is_active: item.is_active,
      joined_at: item.joined_at,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching instructors:", error);
    return NextResponse.json(
      { error: "Failed to fetch instructors" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { academy_id, instructor_id, role = 'instructor' } = body;

    if (!academy_id || !instructor_id) {
      return NextResponse.json(
        { error: "Academy ID and Instructor ID are required" },
        { status: 400 }
      );
    }

    const membership = await createAcademyMembership({
      academy_id,
      instructor_id,
      role,
      is_active: true,
      joined_at: new Date().toISOString(),
    });

    return NextResponse.json(membership, { status: 201 });
  } catch (error) {
    console.error("Error creating instructor membership:", error);
    return NextResponse.json(
      { error: "Failed to add instructor to academy" },
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
