import { redirect } from "next/navigation";

import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { getCurrentUser } from "@/lib/rbac";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user) redirect("/login");

  const isStaff = user.roles.includes("admin") || user.roles.includes("coach");
  if (!isStaff) redirect("/");

  return (
    <div className="flex min-h-full flex-1">
      <AdminSidebar />
      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b px-4">
          <span className="text-sm font-semibold">Dance Fitness SE – Admin</span>
          <ThemeToggle />
        </header>
        <main className="flex-1 p-4 pb-20 md:pb-4">{children}</main>
      </div>
    </div>
  );
}
