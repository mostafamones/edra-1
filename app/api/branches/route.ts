import { getBranches, getBranchesByLevel, createBranch, updateBranch, deleteBranch } from "@/lib";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const academyId = searchParams.get("academyId");
  const levelId = searchParams.get("levelId");

  if (levelId) {
    try {
      const branches = await getBranchesByLevel(Number(levelId));
      return NextResponse.json(branches);
    } catch (error) {
      console.error("Error fetching branches by level:", error);
      return NextResponse.json({ error: "Failed to fetch branches", details: (error as any)?.message || String(error) }, { status: 500 });
    }
  }

  if (academyId) {
    try {
      const branches = await getBranches(academyId);
      return NextResponse.json(branches);
    } catch (error) {
      console.error("Error fetching branches:", error);
      return NextResponse.json({ error: "Failed to fetch branches", details: (error as any)?.message || String(error) }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Academy ID or Level ID is required" }, { status: 400 });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const branch = await createBranch(body);
    return NextResponse.json(branch);
  } catch (error) {
    console.error("Error creating branch:", error);
    return NextResponse.json({ error: "Failed to create branch", details: (error as any)?.message || String(error) }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "Branch ID is required" }, { status: 400 });
    }

    const branch = await updateBranch(Number(id), updates);
    return NextResponse.json(branch);
  } catch (error) {
    console.error("Error updating branch:", error);
    return NextResponse.json({ error: "Failed to update branch", details: (error as any)?.message || String(error) }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Branch ID is required" }, { status: 400 });
    }

    await deleteBranch(Number(id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting branch:", error);
    return NextResponse.json({ error: "Failed to delete branch", details: (error as any)?.message || String(error) }, { status: 500 });
  }
}
