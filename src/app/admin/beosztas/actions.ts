"use server";

import { revalidatePath } from "next/cache";
import { requireStaff, ok, fail, type ActionResult } from "@/lib/supabase/guards";
import { logAudit } from "@/lib/audit";

export interface ClassInput {
  name: string;
  class_type: "weekly" | "single";
  day_of_week?: number | null;
  specific_date?: string | null;
  start_time: string;
  end_time: string;
  location?: string | null;
  coach_name?: string | null;
  description?: string | null;
  group_id?: string | null;
}

export interface AttendanceEntry {
  member_id?: string | null;
  guest_name?: string | null;
  status: "present" | "absent" | "excused";
}

export interface SessionInput {
  status: "held" | "cancelled";
  note?: string | null;
  override_start_time?: string | null;
  override_end_time?: string | null;
  override_coach?: string | null;
  override_location?: string | null;
  attendance: AttendanceEntry[];
}

function validateClass(input: ClassInput): string | null {
  if (!input.name?.trim()) return "Az óra neve kötelező.";
  if (!input.start_time || !input.end_time) return "A kezdés és befejezés időpontja kötelező.";
  if (input.start_time >= input.end_time) return "A befejezésnek később kell lennie a kezdésnél.";
  if (input.class_type === "weekly" && (input.day_of_week === null || input.day_of_week === undefined))
    return "Heti órához a nap kiválasztása kötelező.";
  if (input.class_type === "single" && !input.specific_date)
    return "Egyszeri órához a dátum megadása kötelező.";
  return null;
}

function classPayload(input: ClassInput) {
  return {
    name: input.name.trim(),
    class_type: input.class_type,
    day_of_week: input.class_type === "weekly" ? (input.day_of_week ?? null) : null,
    specific_date: input.class_type === "single" ? (input.specific_date ?? null) : null,
    start_time: input.start_time,
    end_time: input.end_time,
    location: input.location?.trim() || null,
    coach_name: input.coach_name?.trim() || null,
    description: input.description?.trim() || null,
    group_id: input.group_id || null,
  };
}

function revalidateSchedule(classId?: string) {
  revalidatePath("/admin/beosztas");
  if (classId) revalidatePath(`/admin/beosztas/${classId}`);
}

/** Beosztások (résztvevők) felülírása egy órához. */
async function syncEnrollments(
  supabase: Awaited<ReturnType<typeof requireStaff>>["supabase"],
  classId: string,
  memberIds: string[]
): Promise<string | null> {
  const { data: current } = await supabase
    .from("class_enrollments")
    .select("id, member_id")
    .eq("class_id", classId);

  const currentIds = new Set((current ?? []).map((e) => e.member_id));
  const targetIds = new Set(memberIds);

  const toDelete = (current ?? []).filter((e) => !targetIds.has(e.member_id)).map((e) => e.id);
  const toInsert = memberIds.filter((m) => !currentIds.has(m));

  if (toDelete.length > 0) {
    const { error } = await supabase.from("class_enrollments").delete().in("id", toDelete);
    if (error) return error.message;
  }
  if (toInsert.length > 0) {
    const { error } = await supabase
      .from("class_enrollments")
      .insert(toInsert.map((member_id) => ({ class_id: classId, member_id })));
    if (error) return error.message;
  }
  return null;
}

export async function createClass(
  input: ClassInput,
  memberIds: string[]
): Promise<ActionResult<{ id: string }>> {
  const { supabase, user, error } = await requireStaff("schedule.manage");
  if (error || !user) return fail(error ?? "Ismeretlen hiba.");
  const validationError = validateClass(input);
  if (validationError) return fail(validationError);

  const payload = classPayload(input);
  const { data, error: insertError } = await supabase
    .from("training_classes")
    .insert(payload)
    .select("id")
    .single();
  if (insertError || !data) return fail(insertError?.message ?? "Nem sikerült létrehozni az órát.");

  const enrollError = await syncEnrollments(supabase, data.id, memberIds);
  if (enrollError) return fail(`Az óra létrejött, de a résztvevők mentése nem sikerült: ${enrollError}`);

  await logAudit(supabase, user.id, "Új óra", "training_classes", data.id, undefined, payload);
  revalidateSchedule();
  return ok({ id: data.id });
}

export async function updateClass(
  id: string,
  input: ClassInput,
  memberIds: string[]
): Promise<ActionResult> {
  const { supabase, user, error } = await requireStaff("schedule.manage");
  if (error || !user) return fail(error ?? "Ismeretlen hiba.");
  const validationError = validateClass(input);
  if (validationError) return fail(validationError);

  const { data: before } = await supabase
    .from("training_classes")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!before) return fail("Az óra nem található.");

  const payload = classPayload(input);
  const { error: updateError } = await supabase.from("training_classes").update(payload).eq("id", id);
  if (updateError) return fail(updateError.message);

  const enrollError = await syncEnrollments(supabase, id, memberIds);
  if (enrollError) return fail(`Az óra mentve, de a résztvevők mentése nem sikerült: ${enrollError}`);

  await logAudit(supabase, user.id, "Óra módosítása", "training_classes", id, before, payload);
  revalidateSchedule(id);
  return ok();
}

export async function deleteClass(id: string): Promise<ActionResult> {
  const { supabase, user, error } = await requireStaff("schedule.manage");
  if (error || !user) return fail(error ?? "Ismeretlen hiba.");

  const { data: before } = await supabase
    .from("training_classes")
    .select("id, name")
    .eq("id", id)
    .maybeSingle();
  if (!before) return fail("Az óra nem található.");

  // A kapcsolódó beosztások, alkalom-státuszok és jelenlétek cascade törlődnek.
  const { error: deleteError } = await supabase.from("training_classes").delete().eq("id", id);
  if (deleteError) return fail(deleteError.message);

  await logAudit(supabase, user.id, "Óra törlése", "training_classes", id, before);
  revalidateSchedule();
  return ok();
}

/**
 * Alkalom mentése: státusz + felülírások + jelenléti ív egy tranzakció-szerű lépéssorban.
 * A jelenléti ív teljesen felülírja az adott napra rögzített korábbi adatokat.
 */
export async function saveSession(
  classId: string,
  sessionDate: string,
  input: SessionInput
): Promise<ActionResult> {
  const { supabase, user, error } = await requireStaff("schedule.manage");
  if (error || !user) return fail(error ?? "Ismeretlen hiba.");
  if (!sessionDate) return fail("A dátum kötelező.");

  const { data: klass } = await supabase
    .from("training_classes")
    .select("id, name")
    .eq("id", classId)
    .maybeSingle();
  if (!klass) return fail("Az óra nem található.");

  const statusPayload = {
    class_id: classId,
    session_date: sessionDate,
    status: input.status,
    note: input.note?.trim() || null,
    override_start_time: input.override_start_time || null,
    override_end_time: input.override_end_time || null,
    override_coach: input.override_coach?.trim() || null,
    override_location: input.override_location?.trim() || null,
  };

  const { error: statusError } = await supabase
    .from("session_status")
    .upsert(statusPayload, { onConflict: "class_id,session_date" });
  if (statusError) return fail(statusError.message);

  const { error: deleteError } = await supabase
    .from("class_attendance")
    .delete()
    .eq("class_id", classId)
    .eq("session_date", sessionDate);
  if (deleteError) return fail(deleteError.message);

  if (input.attendance.length > 0) {
    const rows = input.attendance
      .filter((a) => a.member_id || a.guest_name?.trim())
      .map((a) => ({
        class_id: classId,
        session_date: sessionDate,
        member_id: a.member_id ?? null,
        guest_name: a.guest_name?.trim() || null,
        status: a.status,
      }));
    if (rows.length > 0) {
      const { error: insertError } = await supabase.from("class_attendance").insert(rows);
      if (insertError) return fail(insertError.message);
    }
  }

  await logAudit(supabase, user.id, "Jelenlét mentés", "class_attendance", `${classId}/${sessionDate}`, undefined, {
    status: input.status,
    count: input.attendance.length,
  });
  revalidateSchedule(classId);
  return ok();
}
