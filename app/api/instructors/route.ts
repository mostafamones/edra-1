import { updateInstructor, deleteInstructor } from "@/lib/db/instructors";
import { getAcademyMemberships, createAcademyMembership } from "@/lib/db/academy-memberships";
import { getServiceSupabase } from "@/utils/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { requireAcademyAccess, readBodyWithAcademy } from "@/lib/api/guard";
import { errors } from "@/lib/api/response";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const academyId = request.nextUrl.searchParams.get("academyId");
  const auth = await requireAcademyAccess(academyId);
  if (!auth.ok) return auth.response;

  try {
    const memberships = await getAcademyMemberships(auth.ctx.academyId);
    const supabase = getServiceSupabase();
    const enriched = await Promise.all(
      memberships.map(async (membership: any) => {
        try {
          const { data } = await (supabase as any).auth.admin.getUserById(membership.instructor_id);
          return {
            ...membership,
            instructor: { ...membership.instructor, email: data?.user?.email || null },
          };
        } catch {
          return { ...membership, instructor: { ...membership.instructor, email: null } };
        }
      })
    );

    const roleOrder: Record<string, number> = { owner: 0, admin: 1, instructor: 2 };
    enriched.sort((a, b) => (roleOrder[a.role] ?? 3) - (roleOrder[b.role] ?? 3));

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
    return errors.internal("Failed to fetch instructors");
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const read = await readBodyWithAcademy(request);
  if (!read) return errors.badRequest("Invalid JSON body");

  const auth = await requireAcademyAccess(read.academyId);
  if (!auth.ok) return auth.response;

  const { instructor_id, role = "instructor" } = read.body as {
    instructor_id?: string;
    role?: string;
  };
  if (!instructor_id) return errors.badRequest("Instructor ID is required");

  try {
    const membership = await createAcademyMembership({
      academy_id: auth.ctx.academyId,
      instructor_id,
      role,
      is_active: true,
      joined_at: new Date().toISOString(),
    });
    return NextResponse.json(membership, { status: 201 });
  } catch (error) {
    console.error("Error creating instructor membership:", error);
    return errors.internal("Failed to add instructor to academy");
  }
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  const read = await readBodyWithAcademy(request);
  if (!read) return errors.badRequest("Invalid JSON body");

  const auth = await requireAcademyAccess(read.academyId);
  if (!auth.ok) return auth.response;

  const { id, ...updates } = read.body as { id?: string } & Record<string, unknown>;
  if (!id) return errors.badRequest("Instructor ID is required");

  try {
    const updated = await updateInstructor(id, updates as never);
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating instructor:", error);
    return errors.internal("Failed to update instructor");
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = request.nextUrl;
  const id = searchParams.get("id");
  const academyId = searchParams.get("academyId");
  if (!id) return errors.badRequest("Instructor ID is required");

  const auth = await requireAcademyAccess(academyId);
  if (!auth.ok) return auth.response;

  try {
    await deleteInstructor(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting instructor:", error);
    return errors.internal("Failed to delete instructor");
  }
}
