"use server";

import { revalidatePath } from "next/cache";
import { requireStaff, ok, fail, type ActionResult } from "@/lib/supabase/guards";
import { logAudit } from "@/lib/audit";
import type { EntryElement } from "@/types/database.coach.types";

export interface ChoreographyInput {
  name: string;
  type?: string | null;
  costume?: string | null;
  music_url?: string | null;
  note?: string | null;
  target_group?: string | null;
  duration_seconds?: number | null;
}

function validateChoreography(input: ChoreographyInput): string | null {
  if (!input.name?.trim()) return "A koreográfia neve kötelező.";
  if (input.duration_seconds !== null && input.duration_seconds !== undefined) {
    if (!Number.isFinite(input.duration_seconds) || input.duration_seconds < 0)
      return "Az időtartam nem lehet negatív.";
  }
  return null;
}

function choreoPayload(input: ChoreographyInput) {
  return {
    name: input.name.trim(),
    type: input.type || "Csoportos",
    costume: input.costume?.trim() || null,
    music_url: input.music_url?.trim() || null,
    note: input.note?.trim() || null,
    target_group: input.target_group?.trim() || null,
    duration_seconds: input.duration_seconds ?? null,
    updated_at: new Date().toISOString(),
  };
}

function revalidateChoreos(id?: string) {
  revalidatePath("/admin/koreok");
  if (id) revalidatePath(`/admin/koreok/${id}`);
}

export async function createChoreography(input: ChoreographyInput): Promise<ActionResult<{ id: string }>> {
  const { supabase, user, error } = await requireStaff();
  if (error || !user) return fail(error ?? "Ismeretlen hiba.");
  const validationError = validateChoreography(input);
  if (validationError) return fail(validationError);

  const payload = choreoPayload(input);
  const { data, error: insertError } = await supabase
    .from("choreographies")
    .insert(payload)
    .select("id")
    .single();
  if (insertError || !data)
    return fail(insertError?.message ?? "Nem sikerült létrehozni a koreográfiát.");

  await logAudit(supabase, user.id, "Új koreográfia", "choreographies", data.id, undefined, payload);
  revalidateChoreos();
  return ok({ id: data.id });
}

/** Teljes mentés: alapadatok + táncosok + elemek (pontokkal, sorrenddel). */
export async function saveChoreography(
  id: string,
  input: ChoreographyInput,
  dancerIds: string[],
  elements: EntryElement[]
): Promise<ActionResult> {
  const { supabase, user, error } = await requireStaff();
  if (error || !user) return fail(error ?? "Ismeretlen hiba.");
  const validationError = validateChoreography(input);
  if (validationError) return fail(validationError);

  for (const el of elements) {
    if (!el.name?.trim()) return fail("Minden elemnek kell név.");
    if (!Number.isFinite(el.points) || el.points < 0.2 || el.points > 1)
      return fail("Az elemek pontértéke 0,2 és 1,0 között kell legyen.");
  }

  const { data: before } = await supabase
    .from("choreographies")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!before) return fail("A koreográfia nem található.");

  const payload = choreoPayload(input);
  const { error: updateError } = await supabase.from("choreographies").update(payload).eq("id", id);
  if (updateError) return fail(updateError.message);

  // Táncosok szinkronizálása
  const { data: currentDancers } = await supabase
    .from("choreography_dancers")
    .select("id, member_id")
    .eq("choreography_id", id);
  const currentIds = new Set((currentDancers ?? []).map((d) => d.member_id));
  const targetIds = new Set(dancerIds);
  const dancersToDelete = (currentDancers ?? []).filter((d) => !targetIds.has(d.member_id)).map((d) => d.id);
  const dancersToInsert = dancerIds.filter((m) => !currentIds.has(m));

  if (dancersToDelete.length > 0) {
    const { error: delError } = await supabase
      .from("choreography_dancers")
      .delete()
      .in("id", dancersToDelete);
    if (delError) return fail(delError.message);
  }
  if (dancersToInsert.length > 0) {
    const { error: insError } = await supabase
      .from("choreography_dancers")
      .insert(dancersToInsert.map((member_id) => ({ choreography_id: id, member_id })));
    if (insError) return fail(insError.message);
  }

  // Elemek teljes újraírása (sorrenddel)
  const { error: partsDeleteError } = await supabase
    .from("choreography_parts")
    .delete()
    .eq("choreography_id", id);
  if (partsDeleteError) return fail(partsDeleteError.message);

  if (elements.length > 0) {
    const { error: partsInsertError } = await supabase.from("choreography_parts").insert(
      elements.map((el, i) => ({
        choreography_id: id,
        name: el.name.trim(),
        points: el.points,
        sort_order: i,
      }))
    );
    if (partsInsertError) return fail(partsInsertError.message);
  }

  await logAudit(supabase, user.id, "Koreográfia módosítása", "choreographies", id, before, {
    ...payload,
    dancerCount: dancerIds.length,
    elementCount: elements.length,
  });
  revalidateChoreos(id);
  return ok();
}

export async function deleteChoreography(id: string): Promise<ActionResult> {
  const { supabase, user, error } = await requireStaff();
  if (error || !user) return fail(error ?? "Ismeretlen hiba.");

  const { data: before } = await supabase
    .from("choreographies")
    .select("id, name")
    .eq("id", id)
    .maybeSingle();
  if (!before) return fail("A koreográfia nem található.");

  // A verseny-nevezésekben a hivatkozás set null-t kap, a nevezések megmaradnak.
  const { error: deleteError } = await supabase.from("choreographies").delete().eq("id", id);
  if (deleteError) return fail(deleteError.message);

  await logAudit(supabase, user.id, "Koreográfia törlése", "choreographies", id, before);
  revalidateChoreos();
  return ok();
}
