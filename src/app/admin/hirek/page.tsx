import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { createClient } from "@/lib/supabase/server";
import { Metadata } from "next";
import React from "react";
import NewsManager, { NewsListItem } from "./NewsManager";

export const metadata: Metadata = {
  title: "Hírek",
  description: "Hírek és közlemények kezelése.",
};

export const dynamic = "force-dynamic";

export default async function NewsPage() {
  const supabase = await createClient();
  const { data: posts } = await supabase
    .from("news_posts")
    .select("*")
    .eq("is_active", true)
    .order("is_prior", { ascending: false })
    .order("created_at", { ascending: false });

  const items: NewsListItem[] = (posts ?? []).map((p) => {
    const content = p.content as { body?: string } | null;
    const body = typeof content === "object" && content !== null ? (content.body ?? "") : String(content ?? "");
    return {
      id: p.id,
      title: p.title,
      content: body,
      excerpt: p.excerpt,
      cover_image_url: p.cover_image_url,
      gallery_urls: Array.isArray(p.gallery_urls)
        ? (p.gallery_urls as string[]).filter((u) => typeof u === "string")
        : [],
      is_prior: p.is_prior,
      is_published: p.is_published,
      created_at: p.created_at,
    };
  });

  return (
    <div>
      <PageBreadcrumb pageTitle="Hírek" />
      <NewsManager posts={items} />
    </div>
  );
}
