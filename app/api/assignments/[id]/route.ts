import { getServiceSupabase } from "@/lib/supabase"
import { NextResponse } from "next/server"

// GET /api/assignments/[id] - Fetch a single assignment and its parts
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase: any = getServiceSupabase()
    const resolvedParams = await params
    const id = parseInt(resolvedParams.id)

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("assignments")
      .select(`
        *,
        parts:assignment_parts(*)
      `)
      .eq("id", id)
      .single()

    if (error) throw error

    // Sort parts by order_index
    if (data?.parts) {
      data.parts.sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0))
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error("Error fetching assignment:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT /api/assignments/[id] - Update an assignment and its parts
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase: any = getServiceSupabase()

    const resolvedParams = await params
    const id = parseInt(resolvedParams.id)
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 })
    }

    const body = await req.json()
    const { academy_id, parts, ...assignmentData } = body

    if (!academy_id) {
      return NextResponse.json({ error: "academy_id is required" }, { status: 400 })
    }

    // 1. Update the parent assignment
    const { error: asgnError } = await fallbackUpdate(supabase, id, assignmentData)
    if (asgnError) throw asgnError

    // 2. Handle parts: Since it's tricky to map updates/inserts/deletes perfectly,
    // the cleanest way for a simple assignment edit is to wipe and recreate existing parts.
    // BUT we must preserve academy_id for the trigger.
    if (parts && Array.isArray(parts)) {
      // Delete old parts
      await supabase
        .from("assignment_parts")
        .delete()
        .eq("assignment_id", id)
        .eq("academy_id", academy_id)

      // Insert new parts
      const partsToInsert = parts.map((p: any) => ({
        assignment_id: id,
        academy_id: academy_id,
        title: p.title,
        max_mark: p.max_mark,
        order_index: p.order_index,
      }))
      if (partsToInsert.length > 0) {
        const { error: partsError } = await supabase
          .from("assignment_parts")
          .insert(partsToInsert)
        if (partsError) throw partsError
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error updating assignment:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE /api/assignments/[id] - Delete an assignment
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase: any = getServiceSupabase()

    const resolvedParams = await params
    const id = parseInt(resolvedParams.id)
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 })
    }

    const { error } = await supabase
      .from("assignments")
      .delete()
      .eq("id", id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting assignment:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

async function fallbackUpdate(supabase: any, id: number, data: any) {
  return await supabase
    .from("assignments")
    .update(data)
    .eq("id", id)
}
