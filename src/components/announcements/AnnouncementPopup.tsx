"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";

type Announcement = {
  id: string;
  title: string;
  message: string;
  display_mode: "login" | "all_pages" | "selected_pages";
  pages: string[];
};

export default function AnnouncementPopup() {
  const pathname = usePathname();
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [closed, setClosed] = useState(false);

  const loadAnnouncements = useCallback(async (user: { id: string }) => {
    setUserId(user.id);
    const supabase = createClient();
    const { data } = await supabase
        .from("announcements")
        .select("id, title, message, display_mode, pages")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(20);
    const first = (data ?? []).find((item) => {
        if (item.display_mode === "all_pages") return true;
        if (item.display_mode === "selected_pages") return item.pages.some((page) => pathname === page || pathname.startsWith(`${page}/`));
        return sessionStorage.getItem(`dfse-announcement-${user.id}-${item.id}`) !== "shown";
    });
    setAnnouncement(first ?? null);
    if (first) setClosed(false);
  }, [pathname]);

  useEffect(() => {
    const supabase = createClient();
    const clearLoginAnnouncements = (userId: string) => {
      Object.keys(sessionStorage)
        .filter((key) => key.startsWith(`dfse-announcement-${userId}-`))
        .forEach((key) => sessionStorage.removeItem(key));
    };
    const handleAuthChange = (event: string, session: { user?: { id: string } } | null) => {
      if (event === "SIGNED_OUT") {
        setAnnouncement(null);
        setUserId(null);
        return;
      }
      if (session?.user) {
        if (event === "SIGNED_IN") clearLoginAnnouncements(session.user.id);
        void loadAnnouncements(session.user);
      }
    };

    void supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) void loadAnnouncements(user);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthChange);
    return () => subscription.unsubscribe();
  }, [loadAnnouncements]);

  const close = () => {
    if (announcement?.display_mode === "login" && userId) {
      sessionStorage.setItem(`dfse-announcement-${userId}-${announcement.id}`, "shown");
    }
    setClosed(true);
  };

  if (!announcement || closed) return null;
  return <Modal isOpen onClose={close} className="m-4 max-w-[520px]"><div className="rounded-3xl bg-white p-7 dark:bg-gray-900 sm:p-9"><div className="mb-4 inline-flex rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-600 dark:bg-brand-500/10 dark:text-brand-300">DFSE közlemény</div><h2 className="text-2xl font-semibold text-gray-900 dark:text-white">{announcement.title}</h2><p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-gray-600 dark:text-gray-300">{announcement.message}</p><div className="mt-7 flex justify-end"><Button onClick={close}>Rendben</Button></div></div></Modal>;
}