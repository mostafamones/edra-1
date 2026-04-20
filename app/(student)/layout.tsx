import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";
import { getServiceSupabase } from "@/utils/supabase/admin";
import { USER_ROLES, type UserRole } from "@/lib/constants/roles";

/**
 * Gate the student portal.
 *
 * A request reaches this layout if it matches any route inside `app/(student)`.
 * We require a signed-in user whose platform role is `student` (or `parent`),
 * OR who has a row in `students.user_id` linking them to a real student. Users
 * flagged as instructors are bounced to the login page so they cannot snoop on
 * the portal scaffolding.
 */
export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const admin = getServiceSupabase();

  const { data: userRow } = await admin
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle<{ role: UserRole | null }>();

  const role = userRow?.role ?? null;
  const isStudentRole =
    role === USER_ROLES.STUDENT || role === USER_ROLES.PARENT;

  if (!isStudentRole) {
    // Fall back to the legacy check: a users row without a role but linked
    // to a `students` record should still reach the portal.
    const { data: studentLink } = await admin
      .from("students")
      .select("id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    if (!studentLink) {
      redirect("/login");
    }
  }

  return <>{children}</>;
}
