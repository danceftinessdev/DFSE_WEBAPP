import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

export type AppRole = Database["public"]["Enums"]["app_role"];

/**
 * Bejelentkezett felhasználó profilja + role-jai, Server Component-ekben
 * és Server Action-ökben használható.
 */
export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const [{ data: profile }, { data: roles }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("user_roles").select("role").eq("user_id", user.id).eq("is_active", true),
  ]);

  return {
    id: user.id,
    email: user.email,
    profile,
    roles: (roles ?? []).map((r) => r.role as AppRole),
  };
}

export async function hasRole(role: AppRole) {
  const user = await getCurrentUser();
  return !!user?.roles.includes(role);
}

export async function isAdmin() {
  return hasRole("admin");
}

export async function isStaff() {
  const user = await getCurrentUser();
  return !!user && (user.roles.includes("admin") || user.roles.includes("coach"));
}

/**
 * Modulárisan adható jogosultság ellenőrzése (pl. 'finance.view').
 * A DB oldali `has_permission()` RPC-t hívja meg, hogy egy helyen legyen
 * a forrás-igazság (RLS policy-k is ugyanezt a logikát használják).
 */
export async function hasPermission(code: string) {
  const supabase = await createClient();
  const { data } = await supabase.rpc("has_permission", { _code: code });
  return !!data;
}
