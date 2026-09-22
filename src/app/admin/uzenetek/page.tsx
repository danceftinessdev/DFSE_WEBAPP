import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { createClient } from "@/lib/supabase/server";
import { Metadata } from "next";
import AnnouncementManager, { type AnnouncementListItem, type ProfileOption } from "./AnnouncementManager";

export const metadata: Metadata = { title: "Felugró üzenetek" };
export const dynamic = "force-dynamic";

export default async function AnnouncementsPage() {
  const supabase = await createClient();
  const [{ data: announcements }, { data: profiles }] = await Promise.all([
    supabase.from("announcements").select("*").order("created_at", { ascending: false }),
    supabase.from("profiles").select("id, email, display_name, first_name, last_name").order("last_name").order("first_name"),
  ]);

  const profileOptions: ProfileOption[] = (profiles ?? []).map((profile) => ({
    id: profile.id,
    name: profile.display_name || `${profile.last_name ?? ""} ${profile.first_name ?? ""}`.trim() || profile.email || profile.id,
    email: profile.email,
  }));

  const items: AnnouncementListItem[] = (announcements ?? []).map((item) => ({
    id: item.id,
    title: item.title,
    message: item.message,
    display_mode: item.display_mode,
    pages: item.pages ?? [],
    target_profile_ids: item.target_profile_ids,
    is_active: item.is_active,
    starts_at: item.starts_at,
    ends_at: item.ends_at,
    created_at: item.created_at,
  }));

  return <div><PageBreadcrumb pageTitle="Felugró üzenetek" /><AnnouncementManager announcements={items} profiles={profileOptions} /></div>;
}