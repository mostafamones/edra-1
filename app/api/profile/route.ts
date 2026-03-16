import { getInstructor, updateInstructor } from "@/lib/db/instructors";
import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { errors } from "@/lib/api/response";

/**
 * GET /api/profile
 *
 * Returns the current user's profile data including:
 * - id, email (from auth)
 * - full_name, phone, avatar_url, original_avatar_path, role (from instructors)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return errors.unauthorized();

    const instructor = await getInstructor(user.id);

    // Combine auth user data with instructor profile data
    const profile = {
      id: instructor.id,
      email: user.email,
      full_name: instructor.full_name || user.user_metadata?.full_name || null,
      phone: instructor.phone || null,
      avatar_url: instructor.avatar_url || user.user_metadata?.avatar_url || null,
      original_avatar_path: instructor.original_avatar_path || null,
      role: instructor.role,
      is_active: instructor.is_active,
    };

    return NextResponse.json(profile);
  } catch (error) {
    console.error("Error fetching profile:", error);
    return errors.internal("Failed to fetch profile");
  }
}

/**
 * POST /api/profile
 *
 * Body: { full_name?: string; phone?: string }
 *
 * Updates the current user's profile information.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return errors.unauthorized();

    const body = await request.json();
    const { full_name, phone } = body;

    // Build updates object with only provided fields
    const updates: Record<string, string | null> = {};
    if (full_name !== undefined) {
      updates.full_name = full_name.trim() || null;
    }
    if (phone !== undefined) {
      updates.phone = phone.trim() || null;
    }

    if (Object.keys(updates).length === 0) {
      return errors.badRequest("No fields to update");
    }

    const updated = await updateInstructor(user.id, updates);

    // Sync full_name to auth metadata if provided
    if (full_name !== undefined) {
      await supabase.auth.updateUser({
        data: { full_name: full_name.trim() || "" }
      });
    }

    const profile = {
      id: updated.id,
      email: user.email,
      full_name: updated.full_name || user.user_metadata?.full_name || null,
      phone: updated.phone || null,
      avatar_url: updated.avatar_url || user.user_metadata?.avatar_url || null,
      original_avatar_path: updated.original_avatar_path || null,
      role: updated.role,
      is_active: updated.is_active,
    };

    return NextResponse.json(profile);
  } catch (error) {
    console.error("Error updating profile:", error);
    return errors.internal("Failed to update profile");
  }
}
