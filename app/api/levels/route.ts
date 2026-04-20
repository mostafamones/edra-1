import { getLevels, createLevel } from "@/lib/db/levels";
import { NextRequest, NextResponse } from "next/server";
import { requireAcademyAccess } from "@/lib/api/guard";
import { errors } from "@/lib/api/response";
import { validateBody } from "@/lib/api/validation";
import { createLevelSchema } from "@/lib/schemas";
import { getErrorMessage } from "@/lib/get-error-message";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const academyId = request.nextUrl.searchParams.get("academyId");
  const auth = await requireAcademyAccess(academyId);
  if (!auth.ok) return auth.response;

  try {
    const levels = await getLevels(auth.ctx.academyId);
    return NextResponse.json(levels);
  } catch (error) {
    console.error("Error fetching levels:", error);
    return errors.internal(getErrorMessage(error) || "Failed to fetch levels");
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const parsed = await validateBody(request, createLevelSchema);
  if (!parsed.success) return parsed.response;

  const auth = await requireAcademyAccess(parsed.data.academy_id);
  if (!auth.ok) return auth.response;

  try {
    const level = await createLevel({ ...parsed.data, academy_id: auth.ctx.academyId });
    return NextResponse.json(level, { status: 201 });
  } catch (error) {
    console.error("Error creating level:", error);
    return errors.internal(getErrorMessage(error) || "Failed to create level");
  }
}
