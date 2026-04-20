import { acceptInstructorInviteToken } from "@/lib/db/invites";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/guard";
import { errors } from "@/lib/api/response";
import { validateBody } from "@/lib/api/validation";
import { acceptInviteSchema } from "@/lib/schemas";
import { getErrorMessage } from "@/lib/get-error-message";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const parsed = await validateBody(request, acceptInviteSchema);
  if (!parsed.success) return parsed.response;

  try {
    const invite = await acceptInstructorInviteToken(parsed.data.token);
    return NextResponse.json(invite);
  } catch (error) {
    console.error("Error accepting invite token:", error);
    return errors.internal(getErrorMessage(error) || "Failed to accept invite");
  }
}
