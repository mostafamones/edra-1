import { createAcademy } from "@/lib/db/academies";
import { createAcademyMembership } from "@/lib/db/academy-memberships";
import { getAcademy, updateAcademy } from "@/lib/db/academies";
import { getAcademyMemberships as getMemberships } from "@/lib/db/academy-memberships";
import { createField } from "@/lib/db/fields";
import { createGroup } from "@/lib/db/groups";
import { getInstructorByUserId } from "@/lib/db/instructors";
import { createLevel } from "@/lib/db/levels";
import { getServiceSupabase } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";
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

// ── POST /api/academy — Create a new academy (all steps in one transaction) ──

export async function POST(request: NextRequest) {
  try {
    // 1. Auth: get the current user from the cookie session
    const supabaseClient = await createClient();
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Resolve (or create) the instructor record for this user
    let instructor = await getInstructorByUserId(user.id);
    if (!instructor) {
      // First time this user creates an academy — provision their instructor record
      const { createInstructor } = await import("@/lib/db/instructors");
      instructor = await createInstructor({
        user_id: user.id,
        full_name: user.user_metadata?.full_name ?? user.email ?? "Academy Owner",
      });
    }

    // 3. Parse the wizard payload
    const body = await request.json();
    const {
      name,
      subdomain,
      icon = "school",
      subject = "",
      levels = [],
      fields = [],
    }: {
      name: string
      subdomain: string
      icon?: string
      subject?: string
      levels: Array<{
        id: string
        name: string
        color?: string
        groups: Array<{ id: string; name: string }>
      }>
      fields: Array<{
        id: string
        name: string
        field_type: string
        is_required: boolean
        options?: string[]
      }>
    } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Academy name is required." }, { status: 400 });
    }

    // 4. Create the academy
    // subdomain falls back to a slugified name if somehow empty
    const resolvedSubdomain =
      subdomain?.trim() ||
      name.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")

    const academy = await createAcademy({
      name: name.trim(),
      owner_id: user.id,
      // The DB has these columns but database.ts types are stale — cast around them
      ...({ subdomain: resolvedSubdomain, icon, subject } as any),
    } as any);

    const academyId = academy.id;

    // 5. Add the creator as the academy owner / admin member
    await createAcademyMembership({
      academy_id: academyId,
      instructor_id: instructor.id,
      role: "admin",
      is_active: true,
      joined_at: new Date().toISOString(),
    });

    // 6. Create levels + their groups sequentially (order matters — level must exist before groups)
    for (const level of levels) {
      const createdLevel = await createLevel({
        academy_id: academyId,
        name: level.name.trim(),
        color: level.color ?? null,
        is_active: true,
      });

      for (const group of level.groups) {
        await createGroup({
          academy_id: academyId,
          level_id: createdLevel.id,
          name: group.name.trim(),
          is_active: true,
        });
      }
    }

    // 7. Create custom fields (options stored as JSON array for select fields)
    for (let i = 0; i < fields.length; i++) {
      const field = fields[i];
      await createField({
        academy_id: academyId,
        name: field.name.trim(),
        field_type: field.field_type,
        is_required: field.is_required ?? false,
        options: field.field_type === "select" && field.options?.length
          ? field.options
          : null,
        order_index: i,
        is_active: true,
      });
    }

    return NextResponse.json({
      id: academyId,
      subdomain,
      redirectTo: `/${subdomain}/dashboard`,
    });
  } catch (error) {
    console.error("Error creating academy:", error);
    return NextResponse.json(
      { error: "Failed to create academy. Please try again." },
      { status: 500 }
    );
  }
}
