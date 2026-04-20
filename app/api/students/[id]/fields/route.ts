import { NextRequest, NextResponse } from "next/server";
import { getStudentFieldValues } from "@/lib/db/fields";
import { requireAcademyAccessForRow } from "@/lib/api/guard";
import { errors } from "@/lib/api/response";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id: idString } = await params;
  const id = Number(idString);
  if (!Number.isFinite(id)) return errors.badRequest("Invalid id");

  const auth = await requireAcademyAccessForRow("students", id);
  if (!auth.ok) return auth.response;

  try {
    const values = await getStudentFieldValues(id);
    return NextResponse.json(values);
  } catch (error) {
    console.error("Error fetching student fields:", error);
    return errors.internal("Failed to fetch student fields");
  }
}
