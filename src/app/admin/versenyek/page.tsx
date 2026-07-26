import { redirect } from "next/navigation";

import { hasPermission, isAdmin } from "@/lib/rbac";

export default async function AdminCompetitionsPage() {
  const canView = (await isAdmin()) || (await hasPermission("finance.view"));
  if (!canView) redirect("/admin/dashboard");

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold tracking-tight">Versenykezelő &amp; Pénzügy</h1>
      <p className="text-muted-foreground">
        Versenyek (`competitions`), résztvevők, logisztika és pénzügy (`competition_participants`)
        kezelése. CRUD felület fejlesztés alatt.
      </p>
    </div>
  );
}
