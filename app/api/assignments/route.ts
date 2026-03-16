import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { createAssignment } from "@/lib/db/assignments";

const supabase: any = getServiceSupabase();

export async function GET(request: NextRequest) {
  try {
    const academyId = request.nextUrl.searchParams.get("academyId");

    if (!academyId) {
      return NextResponse.json(
        { error: "Academy ID is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("assignments")
      .select(`
        *,
        level:levels(id, name),
        branch:branches(id, name),
        parts:assignment_parts(id, title, max_mark, order_index)
      `)
      .eq("academy_id", academyId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Sort parts by order_index
    const result = (data || []).map((a: any) => ({
      ...a,
      parts: (a.parts || []).sort(
        (x: any, y: any) => (x.order_index || 0) - (y.order_index || 0)
      ),
    }));

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error fetching assignments:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch assignments" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { parts = [], ...assignmentData } = body;

    const result = await createAssignment(assignmentData, parts);
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error("Error creating assignment:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create assignment" },
      { status: 500 }
    );
  }
}
