import { getLevels, createLevel } from "@/lib/db/levels";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const academyId = request.nextUrl.searchParams.get("academyId");

    if (!academyId) {
      return NextResponse.json(
        { error: "Academy ID is required" },
        { status: 400 }
      );
    }

    const levels = await getLevels(academyId);
    return NextResponse.json(levels);
  } catch (error) {
    console.error("Error fetching levels:", error);
    return NextResponse.json(
      { error: "Failed to fetch levels", details: (error as any)?.message || String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const level = await createLevel(body);
    return NextResponse.json(level, { status: 201 });
  } catch (error) {
    console.error("Error creating level:", error);
    return NextResponse.json(
      { error: "Failed to create level", details: (error as any)?.message || String(error) },
      { status: 500 }
    );
  }
}
