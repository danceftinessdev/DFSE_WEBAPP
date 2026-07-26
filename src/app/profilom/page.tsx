import { redirect } from "next/navigation";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/rbac";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-16">
        <h1 className="mb-8 text-3xl font-bold tracking-tight">Profilom</h1>
        <Card>
          <CardHeader>
            <CardTitle>{user.profile?.display_name}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm text-muted-foreground">
            <p>E-mail: {user.email}</p>
            <p>Szerepkör(ök): {user.roles.join(", ") || "user"}</p>
          </CardContent>
        </Card>
      </main>
      <SiteFooter />
    </div>
  );
}
