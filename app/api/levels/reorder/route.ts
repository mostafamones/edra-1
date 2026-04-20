import { reorderLevels } from "@/lib/db/levels";
import { NextRequest, NextResponse } from "next/server";
import { requireAcademyAccessForRow } from "@/lib/api/guard";
import { errors } from "@/lib/api/response";
import { validateBody } from "@/lib/api/validation";
import { reorderLevelsSchema } from "@/lib/schemas";
import { getServiceSupabase } from "@/utils/supabase/admin";
import { getErrorMessage } from "@/lib/get-error-message";

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  const parsed = await validateBody(request, reorderLevelsSchema);
  if (!parsed.success) return parsed.response;

  const { orderedIds } = parsed.data;

  const auth = await requireAcademyAccessForRow("levels", orderedIds[0]);
  if (!auth.ok) return auth.response;

  const admin = getServiceSupabase();
  const { data: rows, error: fetchError } = await admin
    .from("levels")
    .select("id, academy_id")
    .in("id", orderedIds);

  if (fetchError || !rows || rows.length !== orderedIds.length) {
    return errors.badRequest("One or more levels not found");
  }

  const foreign = (rows as { academy_id: string }[]).some(
    (r) => r.academy_id !== auth.ctx.academyId
  );
  if (foreign) return errors.forbidden("Cross-academy reorder is not allowed");

  try {
    await reorderLevels(orderedIds);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error reordering levels:", error);
    return errors.internal(getErrorMessage(error) || "Failed to reorder levels");
  }
}
