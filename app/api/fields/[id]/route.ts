
import { NextRequest, NextResponse } from "next/server";
import { updateField, deleteField } from "@/lib/db/fields";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const updated = await updateField(Number(id), body);
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating field:", error);
    return NextResponse.json({ error: "Failed to update field" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await deleteField(Number(id));
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting field:", error);
    return NextResponse.json({ error: "Failed to delete field" }, { status: 500 });
  }
}
