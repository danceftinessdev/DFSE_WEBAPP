import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 60;

export default async function SchedulePage() {
  const supabase = await createClient();
  const { data: classes } = await supabase
    .from("scheduled_classes")
    .select("id, starts_at, ends_at, location, status, class_types(name, color, level)")
    .eq("status", "scheduled")
    .eq("is_active", true)
    .gte("starts_at", new Date().toISOString())
    .order("starts_at")
    .limit(50);

  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="mb-8 text-3xl font-bold tracking-tight">Órarend</h1>

      {!classes || classes.length === 0 ? (
        <p className="text-muted-foreground">Jelenleg nincs meghirdetett óra.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {classes.map((cls) => (
            <Card key={cls.id}>
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base">
                  {(cls.class_types as unknown as { name: string })?.name ?? "Óra"}
                </CardTitle>
                {(cls.class_types as unknown as { level?: string })?.level && (
                  <Badge variant="outline">
                    {(cls.class_types as unknown as { level?: string })?.level}
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
                <span>
                  {new Date(cls.starts_at).toLocaleString("hu-HU", {
                    weekday: "long",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  {" – "}
                  {new Date(cls.ends_at).toLocaleTimeString("hu-HU", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                {cls.location && <span>{cls.location}</span>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
