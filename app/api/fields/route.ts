
import { NextRequest, NextResponse } from "next/server";
import { getFields, createField, getAcademyIdByInstructor } from "@/lib/db/fields";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const academyId = searchParams.get("academyId");

    if (!academyId) {
      return NextResponse.json({ error: "Missing academyId" }, { status: 400 });
    }

    const fields = await getFields(academyId);
    return NextResponse.json(fields);
  } catch (error: any) {
    console.error("Error fetching fields:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch fields" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Get the academy_id from the current user
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get academy_id from user metadata first
    let academyId = session.user.user_metadata.academy_id;

    // Fallback: fetch from instructors table using service role
    if (!academyId) {
      academyId = await getAcademyIdByInstructor(session.user.id);
    }

    if (!academyId) {
      return NextResponse.json({ error: "No academy found for user" }, { status: 403 });
    }

    const field = await createField({
      ...body,
      academy_id: academyId,
    });

    return NextResponse.json(field);
  } catch (error: any) {
    console.error("Error creating field:", error);
    return NextResponse.json({ error: error.message || "Failed to create field" }, { status: 500 });
  }
}
