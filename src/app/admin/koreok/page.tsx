import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { createClient } from "@/lib/supabase/server";
import { Metadata } from "next";
import React from "react";
import ChoreographyList, { ChoreoListItem } from "./ChoreographyList";

export const metadata: Metadata = {
  title: "Koreográfiák",
  description: "Koreográfiák kezelése, táncosok és elemek.",
};

export const dynamic = "force-dynamic";

export default async function ChoreographiesPage() {
  const supabase = await createClient();

  const [choreosRes, dancersRes, partsRes] = await Promise.all([
    supabase.from("choreographies").select("*").eq("is_active", true).order("name"),
    supabase.from("choreography_dancers").select("choreography_id, member_id"),
    supabase.from("choreography_parts").select("choreography_id, points"),
  ]);

  const dancerCounts = new Map<string, number>();
  for (const d of dancersRes.data ?? []) {
    dancerCounts.set(d.choreography_id, (dancerCounts.get(d.choreography_id) ?? 0) + 1);
  }
  const pointSums = new Map<string, number>();
  for (const p of partsRes.data ?? []) {
    pointSums.set(p.choreography_id, (pointSums.get(p.choreography_id) ?? 0) + Number(p.points));
  }

  const choreographies: ChoreoListItem[] = (choreosRes.data ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    type: c.type,
    costume: c.costume,
    target_group: c.target_group,
    dancerCount: dancerCounts.get(c.id) ?? 0,
    totalPoints: pointSums.get(c.id) ?? 0,
  }));

  return (
    <div>
      <PageBreadcrumb pageTitle="Koreográfiák" />
      <ChoreographyList choreographies={choreographies} />
    </div>
  );
}
