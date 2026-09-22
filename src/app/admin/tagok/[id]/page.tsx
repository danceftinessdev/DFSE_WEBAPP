import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { createClient } from "@/lib/supabase/server";
import { hasPermission } from "@/lib/supabase/guards";
import { notFound } from "next/navigation";
import React from "react";
import MemberDetail, {
  MemberAttendanceItem,
  MemberChoreoItem,
  MemberCompetitionItem,
  MemberCompPaymentItem,
} from "./MemberDetail";
import type { Group, Member, MemberPayment } from "@/types/database.coach.types";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function MemberDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const canViewPayments = await hasPermission(supabase, "payments.view");
  const canManageMembers = await hasPermission(supabase, "members.manage");

  const { data: member } = await supabase.from("members").select("*").eq("id", id).maybeSingle();
  if (!member) notFound();

  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const since = ninetyDaysAgo.toISOString().slice(0, 10);

  const [groupsRes, profilesRes, enrollmentsRes, paymentsRes, compPaymentsRes, attendanceRes, choreoRes] =
    await Promise.all([
      supabase.from("groups").select("id, name").eq("is_active", true).order("name"),
      supabase.from("profiles").select("id, display_name, email").eq("is_active", true).order("email"),
      supabase
        .from("enrollments")
        .select("id, group_id, status, fee_status, groups ( name )")
        .eq("member_id", id),
      canViewPayments
        ? supabase
        .from("member_payments")
        .select("*")
        .eq("member_id", id)
        .order("due_date", { ascending: false })
        : Promise.resolve({ data: [] as never[] }),
      canViewPayments
        ? supabase
        .from("competition_payments")
        .select("*, competitions ( id, name, starts_at )")
        .eq("member_id", id)
        : Promise.resolve({ data: [] as never[] }),
      supabase
        .from("class_attendance")
        .select("id, session_date, status, training_classes ( name )")
        .eq("member_id", id)
        .gte("session_date", since)
        .order("session_date", { ascending: false }),
      supabase
        .from("choreography_dancers")
        .select("choreography_id, choreographies ( id, name, type )")
        .eq("member_id", id),
    ]);

  const choreos: MemberChoreoItem[] = (choreoRes.data ?? [])
    .map((d) => (Array.isArray(d.choreographies) ? d.choreographies[0] : d.choreographies))
    .filter((c): c is { id: string; name: string; type: string | null } => Boolean(c));

  const competitions: MemberCompetitionItem[] = [];
  if (choreos.length > 0) {
    const { data: entries } = await supabase
      .from("competition_entries")
      .select("competitions ( id, name, starts_at, location )")
      .in(
        "choreography_id",
        choreos.map((c) => c.id)
      );
    const seen = new Set<string>();
    for (const e of entries ?? []) {
      const comp = Array.isArray(e.competitions) ? e.competitions[0] : e.competitions;
      if (comp && !seen.has(comp.id)) {
        seen.add(comp.id);
        competitions.push(comp);
      }
    }
    competitions.sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  }

  const compPayments: MemberCompPaymentItem[] = (compPaymentsRes.data ?? []).map((cp) => {
    const comp = Array.isArray(cp.competitions) ? cp.competitions[0] : cp.competitions;
    return {
      id: cp.id,
      competition_id: cp.competition_id,
      competition_name: comp?.name ?? "Verseny",
      competition_date: comp?.starts_at ?? null,
      entry_fee_amount: cp.entry_fee_amount,
      entry_fee_paid: cp.entry_fee_paid,
      travel_fee_amount: cp.travel_fee_amount,
      travel_fee_paid: cp.travel_fee_paid,
    };
  });

  const attendance: MemberAttendanceItem[] = (attendanceRes.data ?? []).map((a) => ({
    id: a.id,
    session_date: a.session_date,
    status: a.status,
    class_name: Array.isArray(a.training_classes)
      ? (a.training_classes[0]?.name ?? "Óra")
      : (a.training_classes?.name ?? "Óra"),
  }));

  return (
    <div>
      <PageBreadcrumb pageTitle={member.full_name} />
      <MemberDetail
        member={member as Member}
        groups={(groupsRes.data ?? []) as Pick<Group, "id" | "name">[]}
        profiles={profilesRes.data ?? []}
        initialGroupIds={(enrollmentsRes.data ?? []).map((e) => e.group_id)}
        payments={(paymentsRes.data ?? []) as MemberPayment[]}
        compPayments={compPayments}
        attendance={attendance}
        choreographies={choreos}
        competitions={competitions}
        canViewPayments={canViewPayments}
        canManageMembers={canManageMembers}
      />
    </div>
  );
}
