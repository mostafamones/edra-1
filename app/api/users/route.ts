import { getUser, updateUser, updateUserLastSeen } from "@/lib/db/users";
import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/guard";
import { errors } from "@/lib/api/response";
import { getErrorMessage } from "@/lib/get-error-message";

export async function GET(): Promise<NextResponse> {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return errors.unauthorized();

    const profile = await getUser(user.id);
    return NextResponse.json({
      ...profile,
      email: user.email,
      full_name: user.user_metadata?.full_name || profile.full_name || null,
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return errors.internal("Failed to fetch user profile");
  }
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return errors.unauthorized();

    const body = await request.json();
    const { full_name } = body;

    const profile = await updateUser(user.id, body);

    if (full_name !== undefined) {
      await supabase.auth.updateUser({ data: { full_name: full_name.trim() || "" } });
    }
    await updateUserLastSeen(user.id);
    return NextResponse.json(profile);
  } catch (error) {
    console.error("Error updating user profile:", error);
    return errors.internal(getErrorMessage(error) || "Failed to update profile");
  }
}

export async function POST(): Promise<NextResponse> {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  try {
    await updateUserLastSeen(auth.ctx.userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error tracking user activity:", error);
    return errors.internal("Failed to track user activity");
  }
}
