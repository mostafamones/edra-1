import { acceptInstructorInviteToken } from "@/lib/db/invites";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    const invite = await acceptInstructorInviteToken(token);
    return NextResponse.json(invite);
  } catch (error: any) {
    console.error("Error accepting invite token:", error);
    return NextResponse.json(
      { error: error.message || "Failed to accept invite" },
      { status: 500 }
    );
  }
}
