import { getServiceSupabase } from "@/lib/supabase"
import { NextRequest, NextResponse } from "next/server"
import { requireAcademyAccessForRow } from "@/lib/api/guard"
import { errors } from "@/lib/api/response"
import { getErrorMessage } from "@/lib/get-error-message"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const { id: idString } = await params
  const id = parseInt(idString, 10)
  if (!Number.isFinite(id)) return errors.badRequest("Invalid ID")

  const auth = await requireAcademyAccessForRow("assignments", id)
  if (!auth.ok) return auth.response

  try {
    const supabase = getServiceSupabase() as any
    const { data, error } = await supabase
      .from("assignments")
      .select(`*, parts:assignment_parts(*)`)
      .eq("id", id)
      .single()

    if (error) throw error
    if (data?.parts) {
      data.parts.sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0))
    }
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching assignment:", error)
    return errors.internal(getErrorMessage(error))
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const { id: idString } = await params
  const id = parseInt(idString, 10)
  if (!Number.isFinite(id)) return errors.badRequest("Invalid ID")

  const auth = await requireAcademyAccessForRow("assignments", id)
  if (!auth.ok) return auth.response

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return errors.badRequest("Invalid JSON body")
  }

  const { parts, ...assignmentData } = body as { parts?: unknown[] } & Record<string, unknown>
  delete (assignmentData as Record<string, unknown>).academy_id
  const academy_id = auth.ctx.academyId

  try {
    const supabase = getServiceSupabase() as any
    const { error: asgnError } = await supabase.from("assignments").update(assignmentData).eq("id", id)
    if (asgnError) throw asgnError

    if (parts && Array.isArray(parts)) {
      await supabase
        .from("assignment_parts")
        .delete()
        .eq("assignment_id", id)
        .eq("academy_id", academy_id)

      const partsToInsert = parts.map((p: any) => ({
        assignment_id: id,
        academy_id,
        title: p.title,
        max_mark: p.max_mark,
        order_index: p.order_index,
      }))
      if (partsToInsert.length > 0) {
        const { error: partsError } = await supabase.from("assignment_parts").insert(partsToInsert)
        if (partsError) throw partsError
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating assignment:", error)
    return errors.internal(getErrorMessage(error))
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const { id: idString } = await params
  const id = parseInt(idString, 10)
  if (!Number.isFinite(id)) return errors.badRequest("Invalid ID")

  const auth = await requireAcademyAccessForRow("assignments", id)
  if (!auth.ok) return auth.response

  try {
    const supabase = getServiceSupabase() as any
    const { error } = await supabase.from("assignments").delete().eq("id", id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting assignment:", error)
    return errors.internal(getErrorMessage(error))
  }
}
