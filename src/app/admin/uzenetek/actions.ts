"use server";

import { revalidatePath } from "next/cache";
import { fail, ok, requirePermission, type ActionResult } from "@/lib/supabase/guards";

export type AnnouncementInput = {
  title: string;
  message: string;
  display_mode: "login" | "all_pages" | "selected_pages";
  pages: string[];
  target_profile_ids: string[] | null;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
};

export async function createAnnouncement(input: AnnouncementInput): Promise<ActionResult> {
  const { supabase, user, error } = await requirePermission("announcements.manage");
  if (error || !user) return fail(error ?? "Nincs jogosultságod.");
  if (!input.title.trim() || !input.message.trim()) return fail("A cím és az üzenet kötelező.");
  if (input.display_mode === "selected_pages" && input.pages.length === 0) return fail("Adj meg legalább egy oldalt.");
  if (input.starts_at && input.ends_at && new Date(input.ends_at) <= new Date(input.starts_at)) return fail("A kikapcsolás időpontjának későbbinek kell lennie a kezdésnél.");

  const { error: insertError } = await supabase.from("announcements").insert({
    ...input,
    title: input.title.trim(),
    message: input.message.trim(),
    created_by: user.id,
  });
  if (insertError) return fail(insertError.message);
  revalidatePath("/admin/uzenetek");
  return ok();
}

export async function updateAnnouncement(id: string, input: AnnouncementInput): Promise<ActionResult> {
  const { supabase, error } = await requirePermission("announcements.manage");
  if (error) return fail(error);
  if (!input.title.trim() || !input.message.trim()) return fail("A cím és az üzenet kötelező.");
  if (input.starts_at && input.ends_at && new Date(input.ends_at) <= new Date(input.starts_at)) return fail("A kikapcsolás időpontjának későbbinek kell lennie a kezdésnél.");
  const { error: updateError } = await supabase.from("announcements").update({
    ...input,
    title: input.title.trim(),
    message: input.message.trim(),
    updated_at: new Date().toISOString(),
  }).eq("id", id);
  if (updateError) return fail(updateError.message);
  revalidatePath("/admin/uzenetek");
  return ok();
}

export async function deleteAnnouncement(id: string): Promise<ActionResult> {
  const { supabase, error } = await requirePermission("announcements.manage");
  if (error) return fail(error);
  const { error: deleteError } = await supabase.from("announcements").delete().eq("id", id);
  if (deleteError) return fail(deleteError.message);
  revalidatePath("/admin/uzenetek");
  return ok();
}