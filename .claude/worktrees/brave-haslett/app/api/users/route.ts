import { getUser, updateUser, updateUserLastSeen } from "@/lib/db/users";
import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const profile = await getUser(user.id);
    return NextResponse.json({
      ...profile,
      email: user.email,
      full_name: user.user_metadata?.full_name || profile.full_name || null,
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user profile" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { full_name, phone, ...otherFields } = body;

    // Update user profile
    const profile = await updateUser(user.id, {
      full_name,
      phone,
      ...otherFields,
    });

    // Sync to auth metadata
    if (full_name !== undefined) {
      await supabase.auth.updateUser({
        data: { full_name: full_name.trim() || "" }
      });
    }

    // Update last seen
    await updateUserLastSeen(user.id);

    return NextResponse.json(profile);
  } catch (error: any) {
    console.error("Error updating user profile:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update profile" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Update last seen timestamp
    await updateUserLastSeen(user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error tracking user activity:", error);
    return NextResponse.json(
      { error: "Failed to track user activity" },
      { status: 500 }
    );
  }
}
