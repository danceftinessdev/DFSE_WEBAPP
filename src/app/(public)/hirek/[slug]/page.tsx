import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export const revalidate = 60;

interface NewsDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default async function NewsDetailPage({ params }: NewsDetailPageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: post } = await supabase
    .from("news_posts")
    .select("id, title, excerpt, cover_image_url, published_at")
    .eq("slug", slug)
    .eq("is_published", true)
    .eq("is_active", true)
    .single();

  if (!post) return notFound();

  return (
    <article className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="mb-2 text-3xl font-bold tracking-tight">{post.title}</h1>
      {post.published_at && (
        <p className="mb-8 text-sm text-muted-foreground">
          {new Date(post.published_at).toLocaleDateString("hu-HU")}
        </p>
      )}
      {/*
        TODO: TipTap read-only renderer (@tiptap/react generateHTML) a
        `content` JSON mezőből, ha elkészül a hírek admin szerkesztő.
      */}
      {post.excerpt && <p className="text-lg text-muted-foreground">{post.excerpt}</p>}
    </article>
  );
}
