"use server";

import { revalidatePath } from "next/cache";
import { requireStaff, ok, fail, type ActionResult } from "@/lib/supabase/guards";
import { logAudit } from "@/lib/audit";

export interface MemberInput {
  full_name: string;
  birth_date?: string | null;
  gender?: string | null;
  guardian_name?: string | null;
  guardian_phone?: string | null;
  email?: string | null;
  phone?: string | null;
  city?: string | null;
  address?: string | null;
  status?: string;
  notes?: string | null;
  license_expiry?: string | null;
  medical_expiry?: string | null;
}

const MEMBER_STATUSES = ["active", "pending", "inactive"] as const;

function normalize(input: MemberInput) {
  return {
    full_name: input.full_name.trim(),
    birth_date: input.birth_date || null,
    gender: input.gender || null,
    guardian_name: input.guardian_name?.trim() || null,
    guardian_phone: input.guardian_phone?.trim() || null,
    email: input.email?.trim() || null,
    phone: input.phone?.trim() || null,
    city: input.city?.trim() || "Jászberény",
    address: input.address?.trim() || null,
    status: MEMBER_STATUSES.includes(input.status as (typeof MEMBER_STATUSES)[number])
      ? (input.status as string)
      : "active",
    notes: input.notes?.trim() || null,
    license_expiry: input.license_expiry || null,
    medical_expiry: input.medical_expiry || null,
  };
}

function revalidateMembers(memberId?: string) {
  revalidatePath("/admin/tagok");
  if (memberId) revalidatePath(`/admin/tagok/${memberId}`);
}

export async function createMember(
  input: MemberInput,
  groupIds: string[]
): Promise<ActionResult<{ id: string }>> {
  const { supabase, user, error } = await requireStaff();
  if (error || !user) return fail(error ?? "Ismeretlen hiba.");
  if (!input.full_name?.trim()) return fail("A tag neve kötelező.");

  const payload = normalize(input);
  const { data, error: insertError } = await supabase
    .from("members")
    .insert(payload)
    .select("id")
    .single();

  if (insertError || !data) return fail(insertError?.message ?? "Nem sikerült létrehozni a tagot.");

  if (groupIds.length > 0) {
    const { error: enrollError } = await supabase.from("enrollments").insert(
      groupIds.map((group_id) => ({
        member_id: data.id,
        group_id,
        status: "active",
        fee_status: "pending",
      }))
    );
    if (enrollError) return fail(`A tag létrejött, de a csoportbeosztás nem sikerült: ${enrollError.message}`);
  }

  await logAudit(supabase, user.id, "Tag létrehozása", "members", data.id, undefined, payload);
  revalidateMembers();
  return ok({ id: data.id });
}

export async function updateMember(id: string, input: MemberInput): Promise<ActionResult> {
  const { supabase, user, error } = await requireStaff();
  if (error || !user) return fail(error ?? "Ismeretlen hiba.");
  if (!input.full_name?.trim()) return fail("A tag neve kötelező.");

  const { data: before } = await supabase.from("members").select("*").eq("id", id).maybeSingle();
  if (!before) return fail("A tag nem található.");

  const payload = normalize(input);
  const { error: updateError } = await supabase.from("members").update(payload).eq("id", id);
  if (updateError) return fail(updateError.message);

  await logAudit(supabase, user.id, "Tag módosítása", "members", id, before, payload);
  revalidateMembers(id);
  return ok();
}

export async function deleteMember(id: string): Promise<ActionResult> {
  const { supabase, user, error } = await requireStaff();
  if (error || !user) return fail(error ?? "Ismeretlen hiba.");

  const { data: before } = await supabase
    .from("members")
    .select("id, full_name")
    .eq("id", id)
    .maybeSingle();
  if (!before) return fail("A tag nem található.");

  const { error: deleteError } = await supabase.from("members").delete().eq("id", id);
  if (deleteError) return fail(deleteError.message);

  await logAudit(supabase, user.id, "Tag törlése", "members", id, before);
  revalidateMembers();
  return ok();
}

/** Csoportbeosztások teljes felülírása (diff alapú törlés/beszúrás). */
export async function setMemberGroups(memberId: string, groupIds: string[]): Promise<ActionResult> {
  const { supabase, user, error } = await requireStaff();
  if (error || !user) return fail(error ?? "Ismeretlen hiba.");

  const { data: current } = await supabase
    .from("enrollments")
    .select("id, group_id")
    .eq("member_id", memberId);

  const currentIds = new Set((current ?? []).map((e) => e.group_id));
  const targetIds = new Set(groupIds);

  const toDelete = (current ?? []).filter((e) => !targetIds.has(e.group_id)).map((e) => e.id);
  const toInsert = groupIds.filter((g) => !currentIds.has(g));

  if (toDelete.length > 0) {
    const { error: delError } = await supabase.from("enrollments").delete().in("id", toDelete);
    if (delError) return fail(delError.message);
  }
  if (toInsert.length > 0) {
    const { error: insError } = await supabase.from("enrollments").insert(
      toInsert.map((group_id) => ({
        member_id: memberId,
        group_id,
        status: "active",
        fee_status: "pending",
      }))
    );
    if (insError) return fail(insError.message);
  }

  await logAudit(supabase, user.id, "Csoportbeosztás módosítása", "enrollments", memberId, undefined, {
    groupIds,
  });
  revalidateMembers(memberId);
  return ok();
}

export interface PaymentInput {
  title: string;
  amount: number;
  due_date: string;
}

function validatePayment(input: PaymentInput): string | null {
  if (!input.title?.trim()) return "A befizetés megnevezése kötelező.";
  if (!Number.isFinite(input.amount) || input.amount <= 0) return "Az összegnek pozitív számnak kell lennie.";
  if (!input.due_date) return "A határidő kötelező.";
  return null;
}

export async function addMemberPayment(memberId: string, input: PaymentInput): Promise<ActionResult> {
  const { supabase, user, error } = await requireStaff();
  if (error || !user) return fail(error ?? "Ismeretlen hiba.");
  const validationError = validatePayment(input);
  if (validationError) return fail(validationError);

  const payload = {
    member_id: memberId,
    title: input.title.trim(),
    amount: Math.round(input.amount),
    due_date: input.due_date,
    is_paid: false,
  };
  const { data, error: insertError } = await supabase
    .from("member_payments")
    .insert(payload)
    .select("id")
    .single();
  if (insertError || !data) return fail(insertError?.message ?? "Nem sikerült rögzíteni a befizetést.");

  await logAudit(supabase, user.id, "Befizetés felvétele", "member_payments", data.id, undefined, payload);
  revalidateMembers(memberId);
  return ok();
}

export async function setPaymentPaid(paymentId: string, paid: boolean): Promise<ActionResult> {
  const { supabase, user, error } = await requireStaff();
  if (error || !user) return fail(error ?? "Ismeretlen hiba.");

  const { data: before } = await supabase
    .from("member_payments")
    .select("id, member_id, is_paid")
    .eq("id", paymentId)
    .maybeSingle();
  if (!before) return fail("A befizetés nem található.");

  const payload = { is_paid: paid, paid_at: paid ? new Date().toISOString().slice(0, 10) : null };
  const { error: updateError } = await supabase
    .from("member_payments")
    .update(payload)
    .eq("id", paymentId);
  if (updateError) return fail(updateError.message);

  await logAudit(
    supabase,
    user.id,
    paid ? "Befizetés törlesztve" : "Befizetés visszanyitva",
    "member_payments",
    paymentId,
    before,
    payload
  );
  revalidateMembers(before.member_id);
  return ok();
}

export async function deleteMemberPayment(paymentId: string): Promise<ActionResult> {
  const { supabase, user, error } = await requireStaff();
  if (error || !user) return fail(error ?? "Ismeretlen hiba.");

  const { data: before } = await supabase
    .from("member_payments")
    .select("id, member_id, title, amount")
    .eq("id", paymentId)
    .maybeSingle();
  if (!before) return fail("A befizetés nem található.");

  const { error: deleteError } = await supabase.from("member_payments").delete().eq("id", paymentId);
  if (deleteError) return fail(deleteError.message);

  await logAudit(supabase, user.id, "Befizetés törlése", "member_payments", paymentId, before);
  revalidateMembers(before.member_id);
  return ok();
}

/** Tömeges befizetés-kiírás több kijelölt tagnak egyszerre. */
export async function bulkCreatePayments(
  memberIds: string[],
  input: PaymentInput
): Promise<ActionResult<{ count: number }>> {
  const { supabase, user, error } = await requireStaff();
  if (error || !user) return fail(error ?? "Ismeretlen hiba.");
  if (memberIds.length === 0) return fail("Jelölj ki legalább egy tagot.");
  const validationError = validatePayment(input);
  if (validationError) return fail(validationError);

  const rows = memberIds.map((member_id) => ({
    member_id,
    title: input.title.trim(),
    amount: Math.round(input.amount),
    due_date: input.due_date,
    is_paid: false,
  }));
  const { error: insertError } = await supabase.from("member_payments").insert(rows);
  if (insertError) return fail(insertError.message);

  await logAudit(supabase, user.id, "Tömeges kiírás", "member_payments", "bulk", undefined, {
    title: input.title,
    amount: input.amount,
    due_date: input.due_date,
    count: memberIds.length,
  });
  revalidateMembers();
  return ok({ count: memberIds.length });
}
