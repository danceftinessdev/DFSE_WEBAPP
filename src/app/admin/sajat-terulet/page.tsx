import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Saját területem",
  description: "Saját edzések, versenyek, koreográfiák és adatok.",
};

export const dynamic = "force-dynamic";

const dayNames = ["Hétfő", "Kedd", "Szerda", "Csütörtök", "Péntek", "Szombat", "Vasárnap"];

function formatDate(value: string | null) {
  if (!value) return "";
  return new Intl.DateTimeFormat("hu-HU", { dateStyle: "medium" }).format(new Date(value));
}

export default async function OwnAreaPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/signin?redirectedFrom=%2Fadmin%2Fsajat-terulet");

  const { data: member } = await supabase
    .from("members")
    .select("id, full_name, birth_date, email, phone, city, address, guardian_name, guardian_phone, status")
    .eq("profile_id", user.id)
    .maybeSingle();

  if (!member) {
    return (
      <div>
        <PageBreadcrumb pageTitle="Saját területem" />
        <div className="rounded-2xl border border-warning-200 bg-warning-50 p-6 text-sm text-warning-800">
          A fiókodhoz még nincs sportolói adatlap rendelve. Kérd meg az egyesület adminisztrátorát, hogy kapcsolja össze a fiókodat a tagi adatlapoddal.
        </div>
      </div>
    );
  }

  const [classesRes, choreosRes, paymentsRes, profileRes] = await Promise.all([
    supabase
      .from("class_enrollments")
      .select("training_classes ( id, name, class_type, day_of_week, specific_date, start_time, end_time, location, coach_name, description )")
      .eq("member_id", member.id),
    supabase
      .from("choreography_dancers")
      .select("choreographies ( id, name, type, target_group, music_url, costume, note )")
      .eq("member_id", member.id),
    supabase.from("competition_payments").select("competitions ( id, name, starts_at, location, description )").eq("member_id", member.id),
    supabase.from("profiles").select("first_name, last_name, email, phone, birth_date").eq("id", user.id).maybeSingle(),
  ]);

  const classes = (classesRes.data ?? [])
    .map((item) => Array.isArray(item.training_classes) ? item.training_classes[0] : item.training_classes)
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
  const choreographies = (choreosRes.data ?? [])
    .map((item) => Array.isArray(item.choreographies) ? item.choreographies[0] : item.choreographies)
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
  const choreographyIds = choreographies.map((item) => item.id);
  const entriesRes = choreographyIds.length > 0
    ? await supabase
      .from("competition_entries")
      .select("competitions ( id, name, starts_at, location, description )")
      .in("choreography_id", choreographyIds)
    : { data: [] };
  const competitions = [...(paymentsRes.data ?? []), ...(entriesRes.data ?? [])]
    .map((item) => Array.isArray(item.competitions) ? item.competitions[0] : item.competitions)
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
  const uniqueCompetitions = [...new Map(competitions.map((item) => [item.id, item])).values()];

  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Saját területem" />
      <div>
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">Szia, {member.full_name}!</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Itt találod a hozzád tartozó edzéseket, versenyeket és koreográfiákat.</p>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          ["Edzések", classes.length],
          ["Versenyek", uniqueCompetitions.length],
          ["Koreográfiák", choreographies.length],
        ].map(([label, count]) => (
          <div key={label} className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
            <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
            <p className="mt-2 text-3xl font-semibold text-gray-800 dark:text-white/90">{count}</p>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">Saját edzések</h2>
          <div className="space-y-3">
            {classes.length === 0 && <p className="text-sm text-gray-500">Nincs hozzád rendelt edzés.</p>}
            {classes.map((item) => (
              <div key={item.id} className="rounded-xl border border-gray-100 p-4 dark:border-gray-800">
                <p className="font-medium text-gray-800 dark:text-white/90">{item.name}</p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {item.class_type === "single" ? formatDate(item.specific_date) : dayNames[item.day_of_week ?? 0]} · {item.start_time.slice(0, 5)}–{item.end_time.slice(0, 5)}
                </p>
                {item.location && <p className="mt-1 text-xs text-gray-400">{item.location}</p>}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">Saját versenyek</h2>
          <div className="space-y-3">
            {uniqueCompetitions.length === 0 && <p className="text-sm text-gray-500">Nincs hozzád rendelt verseny.</p>}
            {uniqueCompetitions.map((item) => (
              <div key={item.id} className="rounded-xl border border-gray-100 p-4 dark:border-gray-800">
                <p className="font-medium text-gray-800 dark:text-white/90">{item.name}</p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{formatDate(item.starts_at)}{item.location ? ` · ${item.location}` : ""}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">Hozzám rendelt koreográfiák</h2>
          <div className="space-y-3">
            {choreographies.length === 0 && <p className="text-sm text-gray-500">Nincs hozzád rendelt koreográfia.</p>}
            {choreographies.map((item) => (
              <div key={item.id} className="rounded-xl border border-gray-100 p-4 dark:border-gray-800">
                <p className="font-medium text-gray-800 dark:text-white/90">{item.name}</p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{item.type}{item.target_group ? ` · ${item.target_group}` : ""}</p>
                {item.costume && <p className="mt-1 text-xs text-gray-400">Jelmez: {item.costume}</p>}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">Saját adataim</h2>
          <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
            {[
              ["Név", member.full_name],
              ["Születési dátum", formatDate(member.birth_date)],
              ["E-mail", profileRes.data?.email ?? member.email],
              ["Telefon", profileRes.data?.phone ?? member.phone],
              ["Lakóhely", [member.city, member.address].filter(Boolean).join(", ")],
              ["Gondviselő", [member.guardian_name, member.guardian_phone].filter(Boolean).join(" · ")],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-gray-500 dark:text-gray-400">{label}</dt>
                <dd className="mt-1 font-medium text-gray-800 dark:text-white/90">{value || "Nincs megadva"}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </div>
  );
}