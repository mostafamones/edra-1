import { generateInstructorInvite } from "@/lib/db/invites";
import { NextRequest, NextResponse } from "next/server";
import { requireAcademyAccess } from "@/lib/api/guard";
import { errors } from "@/lib/api/response";
import { validateBody } from "@/lib/api/validation";
import { createInviteSchema } from "@/lib/schemas";
import { getErrorMessage } from "@/lib/get-error-message";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const parsed = await validateBody(request, createInviteSchema);
  if (!parsed.success) return parsed.response;

  const auth = await requireAcademyAccess(parsed.data.academyId);
  if (!auth.ok) return auth.response;

  try {
    const invite = await generateInstructorInvite(auth.ctx.academyId, parsed.data.email);
    return NextResponse.json(invite);
  } catch (error) {
    console.error("Error generating invite:", error);
    return errors.internal(getErrorMessage(error) || "Failed to generate invite");
  }
}
