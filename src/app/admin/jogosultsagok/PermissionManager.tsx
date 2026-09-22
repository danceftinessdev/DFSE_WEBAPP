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

const permissionGroups = [
  { id: "members", label: "Tagok", description: "Tagadatok és csoportbeosztások", prefixes: ["members."] },
  { id: "payments", label: "Befizetések", description: "Tagdíjak és pénzügyi adatok", prefixes: ["payments."] },
  { id: "schedule", label: "Beosztás", description: "Órák és jelenléti ívek", prefixes: ["schedule."] },
  { id: "competitions", label: "Versenyek", description: "Versenyek, nevezések és utazás", prefixes: ["competitions."] },
  { id: "content", label: "Tartalmak", description: "Koreográfiák, hírek és naptár", prefixes: ["choreographies.", "news.", "calendar."] },
  { id: "admin", label: "Adminisztráció", description: "Jogosultságok és irányítópult", prefixes: ["permissions.", "dashboard."] },
  { id: "other", label: "Egyéb", description: "Statisztikák, profil és mintaoldalak", prefixes: ["statistics.", "profile.", "ui.", "other-pages."] },
] as const;

function groupPermissions(permissions: Props["permissions"]) {
  const assigned = new Set<string>();
  const groups = permissionGroups.map((group) => {
    const items = permissions.filter((permission) => group.prefixes.some((prefix) => permission.code.startsWith(prefix)));
    items.forEach((permission) => assigned.add(permission.id));
    return { ...group, permissions: items };
  });
  const ungrouped = permissions.filter((permission) => !assigned.has(permission.id));
  return ungrouped.length > 0 ? [...groups, { id: "other-permissions", label: "Egyéb jogosultságok", description: "További rendszerengedélyek", prefixes: [] as readonly string[], permissions: ungrouped }] : groups;
}

export default function PermissionManager({ users: initialUsers, permissions }: Props) {
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState("");
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({ members: true, payments: true });
  const [openUsers, setOpenUsers] = useState<Record<string, boolean>>({});
  const groupedPermissions = groupPermissions(permissions);

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

  const togglePermission = (user: PermissionUser, permissionId: string, checked: boolean) => {
    updateLocal(user.id, {
      permissionIds: checked
        ? [...user.permissionIds, permissionId]
        : user.permissionIds.filter((id) => id !== permissionId),
    });
  };

  const toggleGroup = (user: PermissionUser, permissionIds: string[]) => {
    const allSelected = permissionIds.every((id) => user.permissionIds.includes(id));
    updateLocal(user.id, {
      permissionIds: allSelected
        ? user.permissionIds.filter((id) => !permissionIds.includes(id))
        : Array.from(new Set([...user.permissionIds, ...permissionIds])),
    });
  };

  const toggleUser = (userId: string) => {
    setOpenUsers((current) => ({ ...current, [userId]: !current[userId] }));
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
              <button type="button" className="flex min-w-0 items-center gap-3 text-left" onClick={() => toggleUser(user.id)} aria-expanded={openUsers[user.id] ?? false}>
                <span className={`text-lg text-gray-400 transition-transform ${openUsers[user.id] ? "rotate-90" : ""}`}>›</span>
                <span className="min-w-0"><h2 className="font-semibold text-gray-800 dark:text-white/90">{user.name}</h2><p className="truncate text-sm text-gray-500">{user.email}</p></span>
              </button>
              <div className="flex flex-wrap items-center gap-3">
                <select className="h-10 rounded-lg border border-gray-300 bg-transparent px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" value={user.role} onChange={(event) => updateLocal(user.id, { role: event.target.value as AppRole })}>{Object.entries(roleLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
                <Checkbox label="Aktív" checked={user.isActive} onChange={(checked) => updateLocal(user.id, { isActive: checked })} />
                <Button size="sm" onClick={() => save(user)} disabled={isPending}>Mentés</Button>
              </div>
            </div>
            {openUsers[user.id] && <div className="mt-5 border-t border-gray-100 pt-4 dark:border-gray-800">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div><span className="text-sm font-medium text-gray-700 dark:text-gray-300">Egyedi engedélyek</span><p className="mt-0.5 text-xs text-gray-400">Csoportonként áttekinthetően beállítható hozzáférések</p></div>
                <Badge variant="light" color="light" size="sm">{user.permissionIds.length} kijelölve</Badge>
              </div>
              <div className="space-y-2">
                {groupedPermissions.map((group) => {
                  const permissionIds = group.permissions.map((permission) => permission.id);
                  const selectedCount = permissionIds.filter((id) => user.permissionIds.includes(id)).length;
                  const isOpen = openGroups[group.id] ?? false;
                  return (
                    <div key={group.id} className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
                      <div className="flex items-center justify-between gap-3 bg-gray-50 px-4 py-3 dark:bg-white/[0.03]">
                        <button type="button" className="flex min-w-0 flex-1 items-center gap-3 text-left" onClick={() => setOpenGroups((current) => ({ ...current, [group.id]: !isOpen }))}>
                          <span className={`text-gray-400 transition-transform ${isOpen ? "rotate-90" : ""}`}>›</span>
                          <span className="min-w-0"><span className="block text-sm font-medium text-gray-800 dark:text-white/90">{group.label}</span><span className="block truncate text-xs text-gray-500">{group.description}</span></span>
                        </button>
                        <div className="flex shrink-0 items-center gap-3"><span className="text-xs text-gray-400">{selectedCount}/{permissionIds.length}</span>{permissionIds.length > 0 && <button type="button" className="text-xs font-medium text-brand-500 hover:text-brand-600" onClick={() => toggleGroup(user, permissionIds)}>{selectedCount === permissionIds.length ? "Összes törlése" : "Összes kijelölése"}</button>}</div>
                      </div>
                      {isOpen && <div className="grid grid-cols-1 gap-3 border-t border-gray-100 p-4 sm:grid-cols-2 xl:grid-cols-3 dark:border-gray-800">{group.permissions.map((permission) => <Checkbox key={permission.id} label={permission.description ?? permission.code} checked={user.permissionIds.includes(permission.id)} onChange={(checked) => togglePermission(user, permission.id, checked)} />)}</div>}
                    </div>
                  );
                })}
              </div>
              {permissions.length === 0 && <p className="text-sm text-gray-500">Még nincs definiált egyedi engedély.</p>}
            </div>}
          </div>
        ))}
        {visibleUsers.length === 0 && <p className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">Nincs találat.</p>}
      </div>
    </div>
  );
}