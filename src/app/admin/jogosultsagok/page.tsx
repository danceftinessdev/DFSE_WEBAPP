import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/guards";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import React from "react";
import PermissionManager, { type PermissionUser } from "./PermissionManager";

export const metadata: Metadata = {
  title: "Jogosultságok",
  description: "Felhasználói szerepkörök és egyedi engedélyek kezelése.",
};

export const dynamic = "force-dynamic";

export default async function PermissionsPage() {
  const access = await requireAdmin();
  if (!access.user) redirect("/signin?redirectedFrom=%2Fadmin%2Fjogosultsagok");
  if (access.error) {
    return <p className="rounded-xl border border-error-200 bg-error-50 p-5 text-sm text-error-700">{access.error}</p>;
  }

  const supabase = await createClient();
  const [profilesRes, rolesRes, permissionsRes, userPermissionsRes] = await Promise.all([
    supabase.from("profiles").select("id, email, display_name, first_name, last_name, is_active").order("last_name").order("first_name"),
    supabase.from("user_roles").select("user_id, role, is_active"),
    supabase.from("permissions").select("id, code, description").order("code"),
    supabase.from("user_permissions").select("user_id, permission_id"),
  ]);

  const queryError = profilesRes.error ?? rolesRes.error ?? permissionsRes.error ?? userPermissionsRes.error;
  if (queryError) {
    return (
      <div>
        <PageBreadcrumb pageTitle="Jogosultságok" />
        <div className="rounded-xl border border-error-200 bg-error-50 p-5 text-sm text-error-700">
          A jogosultságok adatai nem tölthetők be. Ellenőrizd, hogy a jogosultsági migrációk fel lettek-e futtatva a Supabase adatbázisban.
          <p className="mt-2 font-mono text-xs">{queryError.message}</p>
        </div>
      </div>
    );
  }

  const roleByUser = new Map((rolesRes.data ?? []).map((role) => [role.user_id, role]));
  const permissionsByUser = new Map<string, string[]>();
  for (const item of userPermissionsRes.data ?? []) {
    permissionsByUser.set(item.user_id, [...(permissionsByUser.get(item.user_id) ?? []), item.permission_id]);
  }

  const users: PermissionUser[] = (profilesRes.data ?? []).map((profile) => {
    const role = roleByUser.get(profile.id);
    return {
      id: profile.id,
      name: profile.display_name || `${profile.last_name} ${profile.first_name}`.trim() || profile.email,
      email: profile.email,
      isActive: profile.is_active,
      role: role?.role ?? "user",
      permissionIds: permissionsByUser.get(profile.id) ?? [],
    };
  });

  return (
    <div>
      <PageBreadcrumb pageTitle="Jogosultságok" />
      <PermissionManager users={users} permissions={permissionsRes.data ?? []} />
    </div>
  );
}