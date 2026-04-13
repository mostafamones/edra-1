import { NextRequest, NextResponse } from "next/server";
import {
  // Instructor invites
  generateInstructorInvite,
  listInstructorInvites,
  revokeInstructorInvite,
  validateInstructorInviteToken,
  acceptInstructorInviteToken,
  // Student portal invites
  generateStudentPortalInvite,
  validateStudentPortalInviteToken,
  acceptStudentPortalInviteToken,
} from "@/lib/db/invites";

export async function GET(request: NextRequest) {
  try {
    const academyId = request.nextUrl.searchParams.get("academyId");
    const type = request.nextUrl.searchParams.get("type"); // 'instructor' | 'student'

    if (!academyId || !type) {
      return NextResponse.json(
        { error: "Academy ID and type are required" },
        { status: 400 }
      );
    }

    if (type === "student") {
      // Student portal invites (not implemented in db yet, return empty for now)
      return NextResponse.json([]);
    }

    const invites = await listInstructorInvites(academyId);
    return NextResponse.json(invites);
  } catch (error) {
    console.error("Error fetching invites:", error);
    return NextResponse.json(
      { error: "Failed to fetch invites" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { academyId, email, role = "instructor" } = body;

    if (!academyId) {
      return NextResponse.json(
        { error: "Academy ID is required" },
        { status: 400 }
      );
    }

    const invite = await generateInstructorInvite(academyId, email, role);
    return NextResponse.json(invite, { status: 201 });
  } catch (error: any) {
    console.error("Error creating invite:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create invite" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Invite ID is required" },
        { status: 400 }
      );
    }

    const invite = await revokeInstructorInvite(id);
    return NextResponse.json(invite);
  } catch (error) {
    console.error("Error revoking invite:", error);
    return NextResponse.json(
      { error: "Failed to revoke invite" },
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
        { error: "Invite ID is required" },
        { status: 400 }
      );
    }

    // Soft delete by setting status to 'revoked'
    const invite = await revokeInstructorInvite(id);
    return NextResponse.json(invite);
  } catch (error) {
    console.error("Error deleting invite:", error);
    return NextResponse.json(
      { error: "Failed to delete invite" },
      { status: 500 }
    );
  }
}
