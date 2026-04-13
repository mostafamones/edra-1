
import { NextRequest, NextResponse } from "next/server";
import { getStudentFieldValues } from "@/lib/db/fields";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idString } = await params;
    const values = await getStudentFieldValues(Number(idString));
    return NextResponse.json(values);
  } catch (error) {
    console.error("Error fetching student fields:", error);
    return NextResponse.json(
      { error: "Failed to fetch student fields" },
      { status: 500 }
    );
  }
}
