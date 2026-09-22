"use server";

import { revalidatePath } from "next/cache";
import { requireStaff, ok, fail, type ActionResult } from "@/lib/supabase/guards";
import { logAudit } from "@/lib/audit";
import { NEWS_BUCKET } from "@/lib/constants";

export interface NewsInput {
  title: string;
  content: string;
  excerpt?: string | null;
  cover_image_url?: string | null;
  gallery_urls?: string[];
  is_prior?: boolean;
  is_published?: boolean;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function validateNews(input: NewsInput): string | null {
  if (!input.title?.trim()) return "A cím kötelező.";
  if (!input.content?.trim()) return "A tartalom kötelező.";
  return null;
}

function newsPayload(input: NewsInput) {
  return {
    title: input.title.trim(),
    content: { body: input.content.trim() },
    excerpt: input.excerpt?.trim() || input.content.trim().slice(0, 260),
    cover_image_url: input.cover_image_url || null,
    gallery_urls: input.gallery_urls ?? [],
    is_prior: input.is_prior ?? false,
    is_published: input.is_published ?? true,
    updated_at: new Date().toISOString(),
  };
}

function revalidateNews() {
  revalidatePath("/admin/hirek");
}

/** Publikus kép-URL-ből storage path kinyerése. */
function storagePathFromUrl(url: string): string | null {
  const marker = `/${NEWS_BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return url.slice(idx + marker.length);
}

async function removeImages(
  supabase: Awaited<ReturnType<typeof requireStaff>>["supabase"],
  urls: string[]
) {
  const paths = urls.map(storagePathFromUrl).filter((p): p is string => Boolean(p));
  if (paths.length > 0) {
    try {
      await supabase.storage.from(NEWS_BUCKET).remove(paths);
    } catch {
      // az árva fájlok nem blokkolják a műveletet
    }
  }
}

export async function createNews(input: NewsInput): Promise<ActionResult<{ id: string }>> {
  const { supabase, user, error } = await requireStaff("news.manage");
  if (error || !user) return fail(error ?? "Ismeretlen hiba.");
  const validationError = validateNews(input);
  if (validationError) return fail(validationError);

  const payload = {
    ...newsPayload(input),
    slug: `${slugify(input.title) || "hir"}-${Date.now().toString(36)}`,
    author_id: user.id,
    published_at: input.is_published === false ? null : new Date().toISOString(),
  };

  const { data, error: insertError } = await supabase
    .from("news_posts")
    .insert(payload)
    .select("id")
    .single();
  if (insertError || !data) return fail(insertError?.message ?? "Nem sikerült létrehozni a hírt.");

  await logAudit(supabase, user.id, "Hír létrehozása", "news_posts", data.id, undefined, {
    title: payload.title,
  });
  revalidateNews();
  return ok({ id: data.id });
}

export async function updateNews(id: string, input: NewsInput): Promise<ActionResult> {
  const { supabase, user, error } = await requireStaff("news.manage");
  if (error || !user) return fail(error ?? "Ismeretlen hiba.");
  const validationError = validateNews(input);
  if (validationError) return fail(validationError);

  const { data: before } = await supabase
    .from("news_posts")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!before) return fail("A hír nem található.");

  const payload = newsPayload(input);
  // Publikálás időpontjának beállítása első publikáláskor
  const published_at =
    input.is_published === false
      ? null
      : before.published_at ?? new Date().toISOString();

  const { error: updateError } = await supabase
    .from("news_posts")
    .update({ ...payload, published_at })
    .eq("id", id);
  if (updateError) return fail(updateError.message);

  // Eltávolított képek törlése a storage-ból
  const oldImages = [before.cover_image_url, ...((before.gallery_urls as string[] | null) ?? [])].filter(
    (u): u is string => Boolean(u)
  );
  const newImages = [payload.cover_image_url, ...payload.gallery_urls].filter((u): u is string =>
    Boolean(u)
  );
  const removed = oldImages.filter((u) => !newImages.includes(u));
  await removeImages(supabase, removed);

  await logAudit(supabase, user.id, "Hír szerkesztése", "news_posts", id, { title: before.title }, { title: payload.title });
  revalidateNews();
  return ok();
}

export async function deleteNews(id: string): Promise<ActionResult> {
  const { supabase, user, error } = await requireStaff("news.manage");
  if (error || !user) return fail(error ?? "Ismeretlen hiba.");

  const { data: before } = await supabase
    .from("news_posts")
    .select("id, title, cover_image_url, gallery_urls")
    .eq("id", id)
    .maybeSingle();
  if (!before) return fail("A hír nem található.");

  const { error: deleteError } = await supabase.from("news_posts").delete().eq("id", id);
  if (deleteError) return fail(deleteError.message);

  await removeImages(
    supabase,
    [before.cover_image_url, ...((before.gallery_urls as string[] | null) ?? [])].filter(
      (u): u is string => Boolean(u)
    )
  );

  await logAudit(supabase, user.id, "Hír törlése", "news_posts", id, { title: before.title });
  revalidateNews();
  return ok();
}
