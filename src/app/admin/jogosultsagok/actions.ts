"use server";

import { revalidatePath } from "next/cache";
import { fail, ok, requireAdmin, type ActionResult } from "@/lib/supabase/guards";
import type { Database } from "@/types/database.types";

type AppRole = Database["public"]["Enums"]["app_role"];

const APP_ROLES: AppRole[] = ["user", "parent", "coach", "admin"];

export async function updateUserAccess(
  userId: string,
  role: AppRole,
  isActive: boolean,
  permissionIds: string[]
): Promise<ActionResult> {
  const { supabase, user, error } = await requireAdmin();
  if (error || !user) return fail(error ?? "Nincs jogosultságod.");
  if (!APP_ROLES.includes(role)) return fail("Érvénytelen szerepkör.");

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ is_active: isActive })
    .eq("id", userId);
  if (profileError) return fail(profileError.message);

  const { data: currentRole } = await supabase
    .from("user_roles")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  const roleResult = currentRole
    ? await supabase.from("user_roles").update({ role, is_active: isActive }).eq("id", currentRole.id)
    : await supabase.from("user_roles").insert({ user_id: userId, role, is_active: isActive });
  if (roleResult.error) return fail(roleResult.error.message);

  const { error: deleteError } = await supabase.from("user_permissions").delete().eq("user_id", userId);
  if (deleteError) return fail(deleteError.message);

  if (permissionIds.length > 0) {
    const { error: permissionError } = await supabase.from("user_permissions").insert(
      permissionIds.map((permission_id) => ({ user_id: userId, permission_id, granted_by: user.id }))
    );
    if (permissionError) return fail(permissionError.message);
  }

  revalidatePath("/admin/jogosultsagok");
  return ok();
}