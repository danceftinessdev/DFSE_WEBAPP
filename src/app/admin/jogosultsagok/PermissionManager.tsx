"use client";

import { useState, useTransition } from "react";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import { updateUserAccess } from "./actions";

type AppRole = "user" | "parent" | "coach" | "admin";

export interface PermissionUser {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  role: AppRole;
  permissionIds: string[];
}

interface Props {
  users: PermissionUser[];
  permissions: { id: string; code: string; description: string | null }[];
}

const roleLabels: Record<AppRole, string> = {
  user: "Felhasználó",
  parent: "Szülő",
  coach: "Edző",
  admin: "Admin",
};

export default function PermissionManager({ users: initialUsers, permissions }: Props) {
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState("");

  const visibleUsers = users.filter((user) => {
    const query = search.trim().toLowerCase();
    return !query || user.name.toLowerCase().includes(query) || user.email.toLowerCase().includes(query);
  });

  const updateLocal = (userId: string, update: Partial<PermissionUser>) => {
    setUsers((current) => current.map((user) => (user.id === userId ? { ...user, ...update } : user)));
  };

  const save = (user: PermissionUser) => {
    setFeedback("");
    startTransition(async () => {
      const result = await updateUserAccess(user.id, user.role, user.isActive, user.permissionIds);
      setFeedback(result.success ? `${user.name} jogosultságai elmentve.` : result.error ?? "A mentés nem sikerült.");
    });
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">Jogosultságkezelő</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Szerepkörök és egyedi hozzáférések beállítása felhasználónként.</p>
      </div>
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]"><Input placeholder="Keresés név vagy e-mail alapján…" value={search} onChange={(event) => setSearch(event.target.value)} />{feedback && <p className="mt-3 text-sm text-gray-500">{isPending ? "Mentés…" : feedback}</p>}</div>
      <div className="space-y-4">
        {visibleUsers.map((user) => (
          <div key={user.id} className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div><h2 className="font-semibold text-gray-800 dark:text-white/90">{user.name}</h2><p className="text-sm text-gray-500">{user.email}</p></div>
              <div className="flex flex-wrap items-center gap-3">
                <select className="h-10 rounded-lg border border-gray-300 bg-transparent px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" value={user.role} onChange={(event) => updateLocal(user.id, { role: event.target.value as AppRole })}>{Object.entries(roleLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
                <Checkbox label="Aktív" checked={user.isActive} onChange={(checked) => updateLocal(user.id, { isActive: checked })} />
                <Button size="sm" onClick={() => save(user)} disabled={isPending}>Mentés</Button>
              </div>
            </div>
            <div className="mt-5 border-t border-gray-100 pt-4 dark:border-gray-800"><div className="mb-3 flex items-center gap-2"><span className="text-sm font-medium text-gray-700 dark:text-gray-300">Egyedi engedélyek</span><Badge variant="light" color="light" size="sm">{user.permissionIds.length} kijelölve</Badge></div><div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">{permissions.map((permission) => <Checkbox key={permission.id} label={permission.description ? `${permission.code} · ${permission.description}` : permission.code} checked={user.permissionIds.includes(permission.id)} onChange={(checked) => updateLocal(user.id, { permissionIds: checked ? [...user.permissionIds, permission.id] : user.permissionIds.filter((id) => id !== permission.id) })} />)}</div>{permissions.length === 0 && <p className="text-sm text-gray-500">Még nincs definiált egyedi engedély.</p>}</div>
          </div>
        ))}
        {visibleUsers.length === 0 && <p className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">Nincs találat.</p>}
      </div>
    </div>
  );
}