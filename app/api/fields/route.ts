import { getFields, createField } from "@/lib/db/fields";
import { NextRequest, NextResponse } from "next/server";
import { requireAcademyAccess } from "@/lib/api/guard";
import { errors } from "@/lib/api/response";
import { validateBody } from "@/lib/api/validation";
import { createFieldSchema } from "@/lib/schemas";
import { getErrorMessage } from "@/lib/get-error-message";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const academyId = request.nextUrl.searchParams.get("academyId");
  const auth = await requireAcademyAccess(academyId);
  if (!auth.ok) return auth.response;

  try {
    const fields = await getFields(auth.ctx.academyId);
    return NextResponse.json(fields);
  } catch (error) {
    console.error("Error fetching fields:", error);
    return errors.internal("Failed to fetch fields");
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const parsed = await validateBody(request, createFieldSchema);
  if (!parsed.success) return parsed.response;

  const auth = await requireAcademyAccess(parsed.data.academy_id);
  if (!auth.ok) return auth.response;

  try {
    const field = await createField({ ...parsed.data, academy_id: auth.ctx.academyId });
    return NextResponse.json(field, { status: 201 });
  } catch (error) {
    console.error("Error creating field:", error);
    return errors.internal(getErrorMessage(error) || "Failed to create field");
  }
}
