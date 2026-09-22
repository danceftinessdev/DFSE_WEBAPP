import { createClient } from "./server";
import type { PermissionCode } from "@/lib/permissions";

export type ActionResult<T = undefined> =
  | ({ success: true } & (T extends undefined ? object : { data: T }))
  | { success: false; error: string };

export function ok<T = undefined>(data?: T): ActionResult<T> {
  return { success: true, ...(data === undefined ? {} : { data }) } as ActionResult<T>;
}

export function fail<T = undefined>(error: string): ActionResult<T> {
  return { success: false, error };
}

export async function hasPermission(
  supabase: Awaited<ReturnType<typeof createClient>>,
  code: PermissionCode
) {
  const adminResult = await supabase.rpc("is_admin");
  if (!adminResult.error && adminResult.data) return true;
  const permissionResult = await supabase.rpc("has_permission", { _code: code });
  return !permissionResult.error && permissionResult.data === true;
}

export async function requirePermission(code: PermissionCode) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, error: "Bejelentkezés szükséges." as string | null };
  if (await hasPermission(supabase, code)) return { supabase, user, error: null as string | null };
  return { supabase, user, error: "Nincs jogosultságod ehhez a felülethez." as string | null };
}

/**
 * Hitelesítés + edző/admin jogosultság ellenőrzése server action-ökhöz.
 *
 * Visszaadja a Supabase klienst és a felhasználót, vagy hibaüzenetet.
 * Ha a szerepkör-függvények (is_admin / has_role) nem érhetők el az adatbázisban,
 * fejlesztési kompromisszumként minden hitelesített felhasználót beenged.
 */
export async function requireStaff(permission?: PermissionCode) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, user: null, error: "Bejelentkezés szükséges." as string | null };
  }

  if (permission && !(await hasPermission(supabase, permission))) {
    return { supabase, user, error: "Nincs jogosultságod ehhez a művelethez." as string | null };
  }

  try {
    const adminResult = await supabase.rpc("is_admin");
    if (!adminResult.error && adminResult.data) {
      return { supabase, user, error: null as string | null };
    }

    const [coachResult, adminRoleResult] = await Promise.all([
      supabase.rpc("has_role", { _role: "coach" }),
      supabase.rpc("has_role", { _role: "admin" }),
    ]);

    if (
      (!coachResult.error && coachResult.data) ||
      (!adminRoleResult.error && adminRoleResult.data)
    ) {
      return { supabase, user, error: null as string | null };
    }

    // Ha egyik függvény sem futott le hiba nélkül, a szerepkör-rendszer nincs
    // (még) beállítva – ilyenkor a hitelesített felhasználót beengedjük.
    if (adminResult.error && coachResult.error && adminRoleResult.error) {
      return { supabase, user, error: null as string | null };
    }

    return {
      supabase,
      user,
      error: "Nincs edzői vagy admin jogosultságod ehhez a művelethez." as string | null,
    };
  } catch {
    return { supabase, user, error: null as string | null };
  }
}

/** Jogosultságok és szerepkörök módosításához kizárólag admin engedélyezett. */
export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { supabase, user: null, error: "Bejelentkezés szükséges." as string | null };

  const adminResult = await supabase.rpc("is_admin");
  if (!adminResult.error && adminResult.data) {
    return { supabase, user, error: null as string | null };
  }

  const roleResult = await supabase.rpc("has_role", { _role: "admin" });
  if (!roleResult.error && roleResult.data) {
    return { supabase, user, error: null as string | null };
  }

  return {
    supabase,
    user,
    error: "Csak admin kezelheti a jogosultságokat." as string | null,
  };
}
