import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 60; // ISR: 1 perces cache

export default async function NewsListPage() {
  const supabase = await createClient();
  const { data: posts } = await supabase
    .from("news_posts")
    .select("id, title, slug, excerpt, cover_image_url, published_at")
    .eq("is_published", true)
    .eq("is_active", true)
    .order("published_at", { ascending: false });

  if (!posts) return notFound();

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <h1 className="mb-8 text-3xl font-bold tracking-tight">Hírek</h1>

      {posts.length === 0 ? (
        <p className="text-muted-foreground">Jelenleg nincs közzétett hír.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Link key={post.id} href={`/hirek/${post.slug}`}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg">{post.title}</CardTitle>
                  {post.published_at && (
                    <Badge variant="secondary" className="w-fit">
                      {new Date(post.published_at).toLocaleDateString("hu-HU")}
                    </Badge>
                  )}
                </CardHeader>
                {post.excerpt && (
                  <CardContent className="text-sm text-muted-foreground">
                    {post.excerpt}
                  </CardContent>
                )}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
