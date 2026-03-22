import { generateInstructorInvite } from "@/lib/db/invites";
import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { academyId, email } = await request.json();

    if (!academyId) {
      return NextResponse.json({ error: "academyId is required" }, { status: 400 });
    }

    const invite = await generateInstructorInvite(academyId, email);
    return NextResponse.json(invite);
  } catch (error: any) {
    console.error("Error generating invite:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate invite" },
      { status: 500 }
    );
  }
}
