import { redirect } from "next/navigation";

import { hasPermission, isAdmin } from "@/lib/rbac";

export default async function AdminMembershipFeesPage() {
  const canView = (await isAdmin()) || (await hasPermission("finance.view"));
  if (!canView) redirect("/admin/dashboard");

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold tracking-tight">Havi Tagdíjak</h1>
      <p className="text-muted-foreground">
        Tagdíjak felírása és követése (`membership_fees`) – fizetett/elmaradt státusz. CRUD
        felület fejlesztés alatt.
      </p>
    </div>
  );
}
