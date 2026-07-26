import { redirect } from "next/navigation";

import { hasPermission, isAdmin } from "@/lib/rbac";

export default async function AdminWardrobePage() {
  const canView = (await isAdmin()) || (await hasPermission("wardrobe.view"));
  if (!canView) redirect("/admin/dashboard");

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold tracking-tight">Ruházat &amp; Felszerelés</h1>
      <p className="text-muted-foreground">
        Ruhák nyilvántartása (`costumes`), kikölcsönzés diákokhoz (`user_costumes`) és
        koreográfia-hozzárendelés (`choreography_costumes`). CRUD felület fejlesztés alatt.
      </p>
    </div>
  );
}
