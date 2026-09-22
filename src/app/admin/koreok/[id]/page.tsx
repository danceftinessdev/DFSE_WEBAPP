import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import React from "react";
import ChoreographyDetail, { LinkedCompetition } from "./ChoreographyDetail";
import type { Choreography } from "@/types/database.coach.types";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ChoreographyDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: choreography } = await supabase
    .from("choreographies")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!choreography) notFound();

  const [dancersRes, partsRes, membersRes, groupsRes, entriesRes] = await Promise.all([
    supabase.from("choreography_dancers").select("member_id").eq("choreography_id", id),
    supabase
      .from("choreography_parts")
      .select("name, points, sort_order")
      .eq("choreography_id", id)
      .order("sort_order"),
    supabase.from("members").select("id, full_name").neq("status", "inactive").order("full_name"),
    supabase.from("groups").select("id, name").eq("is_active", true).order("name"),
    supabase
      .from("competition_entries")
      .select("id, entry_fee, competitions ( id, name, starts_at, location )")
      .eq("choreography_id", id),
  ]);

  const linkedCompetitions: LinkedCompetition[] = [];
  const seen = new Set<string>();
  for (const e of entriesRes.data ?? []) {
    const comp = Array.isArray(e.competitions) ? e.competitions[0] : e.competitions;
    if (comp && !seen.has(comp.id)) {
      seen.add(comp.id);
      linkedCompetitions.push({
        id: comp.id,
        name: comp.name,
        starts_at: comp.starts_at,
        location: comp.location,
        entry_fee: e.entry_fee,
      });
    }
  }
  linkedCompetitions.sort((a, b) => a.starts_at.localeCompare(b.starts_at));

  return (
    <div>
      <PageBreadcrumb pageTitle={choreography.name} />
      <ChoreographyDetail
        choreography={choreography as Choreography}
        initialDancerIds={(dancersRes.data ?? []).map((d) => d.member_id)}
        initialElements={(partsRes.data ?? []).map((p) => ({
          name: p.name,
          points: Number(p.points),
        }))}
        members={membersRes.data ?? []}
        groups={groupsRes.data ?? []}
        linkedCompetitions={linkedCompetitions}
      />
    </div>
  );
}
