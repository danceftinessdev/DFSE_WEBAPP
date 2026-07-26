import { CalendarDays, Newspaper, Trophy, Users, Wallet } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const [{ count: upcomingClasses }, { count: activeAthletes }, { count: unpaidFees }] =
    await Promise.all([
      supabase
        .from("scheduled_classes")
        .select("*", { count: "exact", head: true })
        .eq("status", "scheduled")
        .gte("starts_at", new Date().toISOString()),
      supabase.from("athlete_profiles").select("*", { count: "exact", head: true }).eq("is_active", true),
      supabase
        .from("membership_fees")
        .select("*", { count: "exact", head: true })
        .in("status", ["pending", "overdue"]),
    ]);

  const stats = [
    { label: "Közelgő órák", value: upcomingClasses ?? 0, icon: CalendarDays },
    { label: "Aktív versenyzők", value: activeAthletes ?? 0, icon: Users },
    { label: "Elmaradt tagdíjak", value: unpaidFees ?? 0, icon: Wallet },
    { label: "Versenyek", value: "—", icon: Trophy },
    { label: "Publikált hírek", value: "—", icon: Newspaper },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold tracking-tight">Áttekintés</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <stat.icon className="size-4 text-primary" />
            </CardHeader>
            <CardContent className="text-2xl font-bold">{stat.value}</CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
