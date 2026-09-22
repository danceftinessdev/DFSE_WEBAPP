import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import React from "react";
import CompetitionDetail, {
  ChoreoOption,
  EntryItem,
  ParticipantPayment,
  VehicleItem,
} from "./CompetitionDetail";
import type { Competition } from "@/types/database.coach.types";
import type { EntryDancer, EntryElement, VehiclePassenger } from "@/types/database.coach.types";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

function asDancers(value: unknown): EntryDancer[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (v): v is EntryDancer =>
      typeof v === "object" && v !== null && "id" in v && "name" in v
  );
}

function asElements(value: unknown): EntryElement[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (v): v is EntryElement =>
      typeof v === "object" && v !== null && "name" in v && "points" in v
  );
}

function asPassengers(value: unknown): VehiclePassenger[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (v): v is VehiclePassenger =>
      typeof v === "object" && v !== null && "id" in v && "name" in v
  );
}

export default async function CompetitionDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: competition } = await supabase
    .from("competitions")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!competition) notFound();

  const [entriesRes, choreosRes, choreoDancersRes, choreoPartsRes, membersRes, groupsRes, paymentsRes, vehiclesRes] =
    await Promise.all([
      supabase
        .from("competition_entries")
        .select("*, choreographies ( id, name, type, target_group, music_url, costume )")
        .eq("competition_id", id)
        .order("created_at"),
      supabase
        .from("choreographies")
        .select("id, name, type, target_group, music_url, costume")
        .eq("is_active", true)
        .order("name"),
      supabase.from("choreography_dancers").select("choreography_id, member_id, members ( full_name )"),
      supabase.from("choreography_parts").select("choreography_id, name, points, sort_order"),
      supabase.from("members").select("id, full_name").neq("status", "inactive").order("full_name"),
      supabase.from("groups").select("id, name").eq("is_active", true).order("name"),
      supabase
        .from("competition_payments")
        .select("*, members ( full_name )")
        .eq("competition_id", id),
      supabase.from("travel_vehicles").select("*").eq("competition_id", id).order("created_at"),
    ]);

  const entries: EntryItem[] = (entriesRes.data ?? []).map((e) => {
    const choreo = Array.isArray(e.choreographies) ? e.choreographies[0] : e.choreographies;
    return {
      id: e.id,
      choreography_id: e.choreography_id,
      name: e.temp_name || choreo?.name || "Névtelen nevezés",
      type: e.temp_type || choreo?.type || null,
      category: e.temp_category || choreo?.target_group || null,
      music_url: e.temp_music_url || choreo?.music_url || null,
      costume: e.temp_costume || choreo?.costume || null,
      dancers: asDancers(e.temp_dancers),
      elements: asElements(e.temp_elements),
      entry_fee: e.entry_fee,
      entry_note: e.entry_note,
    };
  });

  const choreoOptions: ChoreoOption[] = (choreosRes.data ?? []).map((c) => {
    const dancers = (choreoDancersRes.data ?? [])
      .filter((d) => d.choreography_id === c.id)
      .map((d) => {
        const m = Array.isArray(d.members) ? d.members[0] : d.members;
        return { id: d.member_id, name: m?.full_name ?? "Ismeretlen" };
      });
    const elements = (choreoPartsRes.data ?? [])
      .filter((p) => p.choreography_id === c.id)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((p) => ({ name: p.name, points: Number(p.points) }));
    return { ...c, dancers, elements };
  });

  const payments: ParticipantPayment[] = (paymentsRes.data ?? []).map((p) => ({
    id: p.id,
    member_id: p.member_id,
    member_name: Array.isArray(p.members)
      ? (p.members[0]?.full_name ?? "Ismeretlen")
      : (p.members?.full_name ?? "Ismeretlen"),
    entry_fee_amount: p.entry_fee_amount,
    entry_fee_paid: p.entry_fee_paid,
    entry_fee_note: p.entry_fee_note,
    travel_fee_amount: p.travel_fee_amount,
    travel_fee_paid: p.travel_fee_paid,
    travel_fee_note: p.travel_fee_note,
  }));

  const vehicles: VehicleItem[] = (vehiclesRes.data ?? []).map((v) => ({
    id: v.id,
    type: v.type,
    driver_name: v.driver_name,
    capacity: v.capacity,
    note: v.note,
    passengers: asPassengers(v.passengers),
  }));

  return (
    <div>
      <PageBreadcrumb pageTitle={competition.name} />
      <CompetitionDetail
        competition={competition as Competition}
        entries={entries}
        choreographies={choreoOptions}
        members={membersRes.data ?? []}
        groups={groupsRes.data ?? []}
        payments={payments}
        vehicles={vehicles}
      />
    </div>
  );
}
