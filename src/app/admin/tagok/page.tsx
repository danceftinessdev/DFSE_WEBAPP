import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { createClient } from "@/lib/supabase/server";
import { hasPermission } from "@/lib/supabase/guards";
import { Metadata } from "next";
import React from "react";
import MemberManager, { MemberListItem, PaymentExportRow } from "./MemberManager";

export const metadata: Metadata = {
  title: "Tagok kezelése",
  description: "Az egyesület tagjainak kezelése, befizetések, tömeges kiírások és export.",
};

export const dynamic = "force-dynamic";

export default async function MembersPage() {
  const supabase = await createClient();
  const canViewPayments = await hasPermission(supabase, "payments.view");
  const canManagePayments = await hasPermission(supabase, "payments.manage");

  const [membersRes, groupsRes, unpaidPaymentsRes, unpaidCompRes, allPaymentsRes, allCompPaymentsRes] =
    await Promise.all([
      supabase
        .from("members")
        .select(
          `id, full_name, status, city, phone, email, license_expiry, medical_expiry,
           enrollments ( group_id, status, groups ( name ) )`
        )
        .order("full_name"),
      supabase.from("groups").select("id, name").eq("is_active", true).order("name"),
      canViewPayments
        ? supabase.from("member_payments").select("member_id").eq("is_paid", false)
        : Promise.resolve({ data: [] as { member_id: string }[] }),
      canViewPayments
        ? supabase
        .from("competition_payments")
        .select("member_id, entry_fee_amount, entry_fee_paid, travel_fee_amount, travel_fee_paid")
        : Promise.resolve({ data: [] as { member_id: string; entry_fee_amount: number; entry_fee_paid: boolean; travel_fee_amount: number; travel_fee_paid: boolean }[] }),
      canViewPayments
        ? supabase
        .from("member_payments")
        .select("member_id, title, amount, due_date, is_paid, paid_at, members ( full_name )")
        .order("due_date", { ascending: false })
        : Promise.resolve({ data: [] as never[] }),
      canViewPayments
        ? supabase
        .from("competition_payments")
        .select(
          `member_id, entry_fee_amount, entry_fee_paid, travel_fee_amount, travel_fee_paid,
           members ( full_name ), competitions ( name, starts_at )`
        )
        : Promise.resolve({ data: [] as never[] }),
    ]);

  const debtCounts = new Map<string, number>();
  for (const p of unpaidPaymentsRes.data ?? []) {
    debtCounts.set(p.member_id, (debtCounts.get(p.member_id) ?? 0) + 1);
  }
  for (const cp of unpaidCompRes.data ?? []) {
    let extra = 0;
    if (!cp.entry_fee_paid && cp.entry_fee_amount > 0) extra += 1;
    if (!cp.travel_fee_paid && cp.travel_fee_amount > 0) extra += 1;
    if (extra > 0) debtCounts.set(cp.member_id, (debtCounts.get(cp.member_id) ?? 0) + extra);
  }

  const members: MemberListItem[] = (membersRes.data ?? []).map((m) => {
    const activeEnrollments = (m.enrollments ?? []).filter((e) => e.status !== "cancelled");
    return {
      id: m.id,
      full_name: m.full_name,
      status: m.status,
      city: m.city,
      phone: m.phone,
      email: m.email,
      license_expiry: m.license_expiry,
      medical_expiry: m.medical_expiry,
      groups: activeEnrollments
        .map((e) => (Array.isArray(e.groups) ? e.groups[0]?.name : e.groups?.name))
        .filter((n): n is string => Boolean(n)),
      groupIds: activeEnrollments.map((e) => e.group_id),
      debtCount: debtCounts.get(m.id) ?? 0,
    };
  });

  const groupNameByMember = new Map(members.map((m) => [m.id, m.groups.join(", ")]));

  const exportRows: PaymentExportRow[] = [];
  for (const p of allPaymentsRes.data ?? []) {
    const memberName = Array.isArray(p.members) ? p.members[0]?.full_name : p.members?.full_name;
    exportRows.push({
      name: memberName ?? "Ismeretlen",
      group: groupNameByMember.get(p.member_id) ?? "",
      title: p.title,
      amount: p.amount,
      date: p.is_paid ? (p.paid_at ?? p.due_date) : p.due_date,
      status: p.is_paid ? "FIZETVE" : "TARTOZÁS",
    });
  }
  for (const cp of allCompPaymentsRes.data ?? []) {
    const memberName = Array.isArray(cp.members) ? cp.members[0]?.full_name : cp.members?.full_name;
    const comp = Array.isArray(cp.competitions) ? cp.competitions[0] : cp.competitions;
    const compName = comp?.name ?? "Verseny";
    const compDate = comp?.starts_at?.slice(0, 10) ?? "";
    if (cp.entry_fee_amount > 0) {
      exportRows.push({
        name: memberName ?? "Ismeretlen",
        group: groupNameByMember.get(cp.member_id) ?? "",
        title: `Verseny: ${compName} – Nevezés`,
        amount: cp.entry_fee_amount,
        date: compDate,
        status: cp.entry_fee_paid ? "FIZETVE" : "TARTOZÁS",
      });
    }
    if (cp.travel_fee_amount > 0) {
      exportRows.push({
        name: memberName ?? "Ismeretlen",
        group: groupNameByMember.get(cp.member_id) ?? "",
        title: `Verseny: ${compName} – Utazás`,
        amount: cp.travel_fee_amount,
        date: compDate,
        status: cp.travel_fee_paid ? "FIZETVE" : "TARTOZÁS",
      });
    }
  }

  return (
    <div>
      <PageBreadcrumb pageTitle="Tagok" />
      <MemberManager
        members={members}
        groups={(groupsRes.data ?? []).map((g) => ({ id: g.id, name: g.name }))}
        exportRows={canViewPayments ? exportRows : []}
        canViewPayments={canViewPayments}
        canManagePayments={canManagePayments}
      />
    </div>
  );
}
