import Image from "next/image";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 300;

export default async function AthletesPage() {
  const supabase = await createClient();
  const { data: athletes } = await supabase
    .from("athletes_showcase")
    .select("id, display_name, bio, photo_url, achievements")
    .eq("is_active", true)
    .order("sort_order");

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <h1 className="mb-8 text-3xl font-bold tracking-tight">Versenyzőink</h1>

      {!athletes || athletes.length === 0 ? (
        <p className="text-muted-foreground">Hamarosan bemutatjuk versenyzőinket.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {athletes.map((athlete) => (
            <Card key={athlete.id}>
              <CardHeader className="items-center text-center">
                {athlete.photo_url && (
                  <Image
                    src={athlete.photo_url}
                    alt={athlete.display_name}
                    width={96}
                    height={96}
                    className="mb-3 rounded-full object-cover"
                  />
                )}
                <CardTitle>{athlete.display_name}</CardTitle>
              </CardHeader>
              <CardContent className="text-center text-sm text-muted-foreground">
                {athlete.bio}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
