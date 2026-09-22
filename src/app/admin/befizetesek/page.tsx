import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { createClient } from "@/lib/supabase/server";
import { hasPermission } from "@/lib/supabase/guards";
import { Metadata } from "next";
import React from "react";
import PaymentMatrix, { type PaymentMatrixMember } from "./PaymentMatrix";

export const metadata: Metadata = {
  title: "Befizetések",
  description: "A tagok havi tagdíjainak áttekintése és kezelése.",
};

export const dynamic = "force-dynamic";

function getYearBounds() {
  const year = new Date().getFullYear();
  return { year, from: `${year}-01-01`, to: `${year}-12-31` };
}

export default async function PaymentsPage() {
  const supabase = await createClient();
  const { year, from, to } = getYearBounds();
  const canManagePayments = await hasPermission(supabase, "payments.manage");

  const [membersRes, groupsRes, classesRes, paymentsRes] = await Promise.all([
    supabase
      .from("members")
      .select("id, full_name, status, enrollments ( group_id, status, groups ( id, name, age_group ) )")
      .order("full_name"),
    supabase.from("groups").select("id, name, age_group").eq("is_active", true).order("name"),
    supabase.from("training_classes").select("id, name, class_enrollments ( member_id )").eq("is_active", true).order("name"),
    supabase
      .from("member_payments")
      .select("id, member_id, title, amount, due_date, is_paid, paid_at")
      .gte("due_date", from)
      .lte("due_date", to)
      .order("due_date"),
  ]);

  const classNamesByMember = new Map<string, string[]>();
  for (const trainingClass of classesRes.data ?? []) {
    for (const enrollment of trainingClass.class_enrollments ?? []) {
      const names = classNamesByMember.get(enrollment.member_id) ?? [];
      names.push(trainingClass.name);
      classNamesByMember.set(enrollment.member_id, names);
    }
  }

  const members: PaymentMatrixMember[] = (membersRes.data ?? []).map((member) => {
    const enrollments = (member.enrollments ?? []).filter((enrollment) => enrollment.status !== "cancelled");
    const groups = enrollments
      .map((enrollment) => (Array.isArray(enrollment.groups) ? enrollment.groups[0] : enrollment.groups))
      .filter((group): group is { id: string; name: string; age_group: string | null } => Boolean(group));

    return {
      id: member.id,
      full_name: member.full_name,
      status: member.status,
      groupIds: groups.map((group) => group.id),
      groupNames: groups.map((group) => group.name),
      ageGroups: Array.from(new Set(groups.map((group) => group.age_group).filter(Boolean))) as string[],
      classNames: classNamesByMember.get(member.id) ?? [],
      payments: (paymentsRes.data ?? []).filter((payment) => payment.member_id === member.id),
    };
  });

  return (
    <div>
      <PageBreadcrumb pageTitle="Befizetések" />
      <PaymentMatrix
        year={year}
        canManagePayments={canManagePayments}
        members={members}
        groups={(groupsRes.data ?? []).map((group) => ({ id: group.id, name: group.name, age_group: group.age_group }))}
        classes={(classesRes.data ?? []).map((trainingClass) => ({ id: trainingClass.id, name: trainingClass.name }))}
      />
    </div>
  );
}