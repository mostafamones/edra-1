import { reorderLevels } from "@/lib/db/levels";
import { NextRequest, NextResponse } from "next/server";

/**
 * PATCH /api/levels/reorder
 * Body: { orderedIds: number[] }
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderedIds } = body as { orderedIds: number[] };

    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      return NextResponse.json(
        { error: "orderedIds must be a non-empty array" },
        { status: 400 }
      );
    }

    await reorderLevels(orderedIds);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error reordering levels:", error);
    return NextResponse.json(
      { error: "Failed to reorder levels", details: (error as any)?.message || String(error) },
      { status: 500 }
    );
  }
}
