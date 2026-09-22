"use server";

import { revalidatePath } from "next/cache";
import { requireStaff, ok, fail, type ActionResult } from "@/lib/supabase/guards";
import { logAudit } from "@/lib/audit";
import type { EntryDancer, EntryElement, VehiclePassenger } from "@/types/database.coach.types";

// ---------------------------------------------------------------------------
// Verseny alapadatok
// ---------------------------------------------------------------------------

export interface CompetitionInput {
  name: string;
  type?: string | null;
  location?: string | null;
  start_date: string; // YYYY-MM-DD
  end_date?: string | null;
  description?: string | null;
  is_public?: boolean;
}

function validateCompetition(input: CompetitionInput): string | null {
  if (!input.name?.trim()) return "A verseny neve kötelező.";
  if (!input.start_date) return "A kezdő dátum kötelező.";
  if (input.end_date && input.end_date < input.start_date)
    return "A befejező dátum nem lehet korábbi a kezdőnél.";
  return null;
}

function competitionPayload(input: CompetitionInput) {
  return {
    name: input.name.trim(),
    type: input.type?.trim() || null,
    location: input.location?.trim() || null,
    starts_at: `${input.start_date}T00:00:00`,
    ends_at: (input.end_date || input.start_date) + "T00:00:00",
    description: input.description?.trim() || null,
    is_public: input.is_public ?? true,
  };
}

function revalidateCompetitions(id?: string) {
  revalidatePath("/admin/versenyek");
  if (id) revalidatePath(`/admin/versenyek/${id}`);
}

export async function createCompetition(input: CompetitionInput): Promise<ActionResult<{ id: string }>> {
  const { supabase, user, error } = await requireStaff();
  if (error || !user) return fail(error ?? "Ismeretlen hiba.");
  const validationError = validateCompetition(input);
  if (validationError) return fail(validationError);

  const payload = competitionPayload(input);
  const { data, error: insertError } = await supabase
    .from("competitions")
    .insert(payload)
    .select("id")
    .single();
  if (insertError || !data) return fail(insertError?.message ?? "Nem sikerült létrehozni a versenyt.");

  await logAudit(supabase, user.id, "Új verseny", "competitions", data.id, undefined, payload);
  revalidateCompetitions();
  return ok({ id: data.id });
}

export async function updateCompetition(id: string, input: CompetitionInput): Promise<ActionResult> {
  const { supabase, user, error } = await requireStaff();
  if (error || !user) return fail(error ?? "Ismeretlen hiba.");
  const validationError = validateCompetition(input);
  if (validationError) return fail(validationError);

  const { data: before } = await supabase.from("competitions").select("*").eq("id", id).maybeSingle();
  if (!before) return fail("A verseny nem található.");

  const payload = competitionPayload(input);
  const { error: updateError } = await supabase.from("competitions").update(payload).eq("id", id);
  if (updateError) return fail(updateError.message);

  await logAudit(supabase, user.id, "Verseny módosítása", "competitions", id, before, payload);
  revalidateCompetitions(id);
  return ok();
}

export async function deleteCompetition(id: string): Promise<ActionResult> {
  const { supabase, user, error } = await requireStaff();
  if (error || !user) return fail(error ?? "Ismeretlen hiba.");

  const { data: before } = await supabase
    .from("competitions")
    .select("id, name")
    .eq("id", id)
    .maybeSingle();
  if (!before) return fail("A verseny nem található.");

  // A hivatkozó koreográfiák ne akadályozzák a törlést – csak leválasztjuk őket.
  await supabase.from("choreographies").update({ competition_id: null }).eq("competition_id", id);

  // competition_entries / competition_payments / travel_vehicles cascade törlődnek.
  const { error: deleteError } = await supabase.from("competitions").delete().eq("id", id);
  if (deleteError) return fail(deleteError.message);

  await logAudit(supabase, user.id, "Verseny törlése", "competitions", id, before);
  revalidateCompetitions();
  return ok();
}

// ---------------------------------------------------------------------------
// Indulás és szállás
// ---------------------------------------------------------------------------

export async function saveTravelInfo(
  competitionId: string,
  input: { departure_location?: string | null; departure_time?: string | null }
): Promise<ActionResult> {
  const { supabase, user, error } = await requireStaff();
  if (error || !user) return fail(error ?? "Ismeretlen hiba.");

  const payload = {
    departure_location: input.departure_location?.trim() || null,
    departure_time: input.departure_time || null,
  };
  const { error: updateError } = await supabase
    .from("competitions")
    .update(payload)
    .eq("id", competitionId);
  if (updateError) return fail(updateError.message);

  await logAudit(supabase, user.id, "Utazási infó mentése", "competitions", competitionId, undefined, payload);
  revalidateCompetitions(competitionId);
  return ok();
}

export async function saveAccommodation(
  competitionId: string,
  input: {
    accommodation_address?: string | null;
    accommodation_price?: number | null;
    accommodation_note?: string | null;
    check_in_time?: string | null;
    check_out_time?: string | null;
  }
): Promise<ActionResult> {
  const { supabase, user, error } = await requireStaff();
  if (error || !user) return fail(error ?? "Ismeretlen hiba.");

  const payload = {
    accommodation_address: input.accommodation_address?.trim() || null,
    accommodation_price: input.accommodation_price ?? null,
    accommodation_note: input.accommodation_note?.trim() || null,
    check_in_time: input.check_in_time || null,
    check_out_time: input.check_out_time || null,
  };
  const { error: updateError } = await supabase
    .from("competitions")
    .update(payload)
    .eq("id", competitionId);
  if (updateError) return fail(updateError.message);

  await logAudit(supabase, user.id, "Szállásinfó mentése", "competitions", competitionId, undefined, payload);
  revalidateCompetitions(competitionId);
  return ok();
}

// ---------------------------------------------------------------------------
// Nevezések (koreográfia-verseny kapcsolat)
// ---------------------------------------------------------------------------

export interface EntryInput {
  choreography_id?: string | null;
  temp_name?: string | null;
  temp_type?: string | null;
  temp_category?: string | null;
  temp_music_url?: string | null;
  temp_costume?: string | null;
  temp_dancers: EntryDancer[];
  temp_elements: EntryElement[];
  entry_fee: number;
  entry_note?: string | null;
  /** Ha új koreót hozunk létre a versenyen, elmenthetjük globálisan is. */
  saveToGlobal?: boolean;
}

function validateEntry(input: EntryInput): string | null {
  if (!input.choreography_id && !input.temp_name?.trim())
    return "Válassz koreográfiát vagy adj meg nevet az új nevezéshez.";
  if (!Number.isFinite(input.entry_fee) || input.entry_fee < 0)
    return "A nevezési díj nem lehet negatív.";
  for (const el of input.temp_elements) {
    if (!el.name?.trim()) return "Minden elemnek kell név.";
    if (!Number.isFinite(el.points) || el.points < 0.2 || el.points > 1)
      return "Az elemek pontértéke 0,2 és 1,0 között kell legyen.";
  }
  return null;
}

export async function saveEntry(
  competitionId: string,
  input: EntryInput,
  entryId?: string
): Promise<ActionResult> {
  const { supabase, user, error } = await requireStaff();
  if (error || !user) return fail(error ?? "Ismeretlen hiba.");
  const validationError = validateEntry(input);
  if (validationError) return fail(validationError);

  let choreographyId = input.choreography_id ?? null;

  // Új, versenyhez kötött koreográfia globális mentése
  if (!choreographyId && input.saveToGlobal && input.temp_name?.trim()) {
    const { data: newChoreo, error: choreoError } = await supabase
      .from("choreographies")
      .insert({
        name: input.temp_name.trim(),
        type: input.temp_type || "Csoportos",
        target_group: input.temp_category || null,
        music_url: input.temp_music_url || null,
        costume: input.temp_costume || null,
        competition_id: competitionId,
      })
      .select("id")
      .single();
    if (choreoError) return fail(choreoError.message);
    choreographyId = newChoreo.id;

    if (input.temp_dancers.length > 0) {
      await supabase.from("choreography_dancers").insert(
        input.temp_dancers.map((d) => ({ choreography_id: newChoreo.id, member_id: d.id }))
      );
    }
    if (input.temp_elements.length > 0) {
      await supabase.from("choreography_parts").insert(
        input.temp_elements.map((el, i) => ({
          choreography_id: newChoreo.id,
          name: el.name.trim(),
          points: el.points,
          sort_order: i,
        }))
      );
    }
    await logAudit(supabase, user.id, "Új koreográfia (versenyből)", "choreographies", newChoreo.id, undefined, {
      name: input.temp_name,
    });
  }

  const payload = {
    competition_id: competitionId,
    choreography_id: choreographyId,
    temp_name: input.temp_name?.trim() || null,
    temp_type: input.temp_type || null,
    temp_category: input.temp_category || null,
    temp_music_url: input.temp_music_url || null,
    temp_costume: input.temp_costume || null,
    temp_dancers: JSON.parse(JSON.stringify(input.temp_dancers)),
    temp_elements: JSON.parse(JSON.stringify(input.temp_elements)),
    entry_fee: Math.round(input.entry_fee),
    entry_note: input.entry_note?.trim() || null,
  };

  if (entryId) {
    const { data: before } = await supabase
      .from("competition_entries")
      .select("*")
      .eq("id", entryId)
      .maybeSingle();
    if (!before) return fail("A nevezés nem található.");
    const { error: updateError } = await supabase
      .from("competition_entries")
      .update(payload)
      .eq("id", entryId);
    if (updateError) return fail(updateError.message);
    await logAudit(supabase, user.id, "Nevezés módosítása", "competition_entries", entryId, before, payload);
  } else {
    const { data, error: insertError } = await supabase
      .from("competition_entries")
      .insert(payload)
      .select("id")
      .single();
    if (insertError || !data) return fail(insertError?.message ?? "Nem sikerült menteni a nevezést.");
    await logAudit(supabase, user.id, "Nevezés létrehozása", "competition_entries", data.id, undefined, payload);
  }

  revalidateCompetitions(competitionId);
  return ok();
}

export async function deleteEntry(entryId: string, competitionId: string): Promise<ActionResult> {
  const { supabase, user, error } = await requireStaff();
  if (error || !user) return fail(error ?? "Ismeretlen hiba.");

  const { data: before } = await supabase
    .from("competition_entries")
    .select("id, temp_name")
    .eq("id", entryId)
    .maybeSingle();
  if (!before) return fail("A nevezés nem található.");

  const { error: deleteError } = await supabase.from("competition_entries").delete().eq("id", entryId);
  if (deleteError) return fail(deleteError.message);

  await logAudit(supabase, user.id, "Nevezés törlése", "competition_entries", entryId, before);
  revalidateCompetitions(competitionId);
  return ok();
}

// ---------------------------------------------------------------------------
// Versenyfizetések (nevezési + utazási díj tagonként)
// ---------------------------------------------------------------------------

export interface CompetitionPaymentInput {
  entry_fee_amount: number;
  entry_fee_paid: boolean;
  entry_fee_note?: string | null;
  travel_fee_amount: number;
  travel_fee_paid: boolean;
  travel_fee_note?: string | null;
}

export async function upsertCompetitionPayment(
  competitionId: string,
  memberId: string,
  input: CompetitionPaymentInput
): Promise<ActionResult> {
  const { supabase, user, error } = await requireStaff();
  if (error || !user) return fail(error ?? "Ismeretlen hiba.");
  if (input.entry_fee_amount < 0 || input.travel_fee_amount < 0)
    return fail("Az összegek nem lehetnek negatívak.");

  const payload = {
    competition_id: competitionId,
    member_id: memberId,
    entry_fee_amount: Math.round(input.entry_fee_amount),
    entry_fee_paid: input.entry_fee_paid,
    entry_fee_note: input.entry_fee_note?.trim() || null,
    travel_fee_amount: Math.round(input.travel_fee_amount),
    travel_fee_paid: input.travel_fee_paid,
    travel_fee_note: input.travel_fee_note?.trim() || null,
  };

  const { error: upsertError } = await supabase
    .from("competition_payments")
    .upsert(payload, { onConflict: "competition_id,member_id" });
  if (upsertError) return fail(upsertError.message);

  await logAudit(supabase, user.id, "Versenyfizetés mentése", "competition_payments", `${competitionId}/${memberId}`, undefined, payload);
  revalidateCompetitions(competitionId);
  revalidatePath("/admin/tagok");
  return ok();
}

export async function deleteCompetitionPayment(
  competitionId: string,
  memberId: string
): Promise<ActionResult> {
  const { supabase, user, error } = await requireStaff();
  if (error || !user) return fail(error ?? "Ismeretlen hiba.");

  const { error: deleteError } = await supabase
    .from("competition_payments")
    .delete()
    .eq("competition_id", competitionId)
    .eq("member_id", memberId);
  if (deleteError) return fail(deleteError.message);

  await logAudit(supabase, user.id, "Versenyfizetés törlése", "competition_payments", `${competitionId}/${memberId}`);
  revalidateCompetitions(competitionId);
  revalidatePath("/admin/tagok");
  return ok();
}

// ---------------------------------------------------------------------------
// Utazás – járművek
// ---------------------------------------------------------------------------

export interface VehicleInput {
  type: string;
  driver_name?: string | null;
  capacity: number;
  note?: string | null;
  passengers: VehiclePassenger[];
}

const VEHICLE_TYPES = ["Autó", "Busz", "Tömegközlekedés"];

export async function saveVehicle(
  competitionId: string,
  input: VehicleInput,
  vehicleId?: string
): Promise<ActionResult> {
  const { supabase, user, error } = await requireStaff();
  if (error || !user) return fail(error ?? "Ismeretlen hiba.");
  if (!VEHICLE_TYPES.includes(input.type)) return fail("Érvénytelen járműtípus.");
  if (!Number.isFinite(input.capacity) || input.capacity < 1) return fail("A kapacitás legalább 1 legyen.");
  if (input.passengers.length > input.capacity)
    return fail("Több utast választottál ki, mint a jármű kapacitása.");

  const payload = {
    competition_id: competitionId,
    type: input.type,
    driver_name: input.driver_name?.trim() || null,
    capacity: Math.round(input.capacity),
    note: input.note?.trim() || null,
    passengers: JSON.parse(JSON.stringify(input.passengers)),
  };

  if (vehicleId) {
    const { error: updateError } = await supabase
      .from("travel_vehicles")
      .update(payload)
      .eq("id", vehicleId);
    if (updateError) return fail(updateError.message);
    await logAudit(supabase, user.id, "Jármű módosítása", "travel_vehicles", vehicleId, undefined, payload);
  } else {
    const { data, error: insertError } = await supabase
      .from("travel_vehicles")
      .insert(payload)
      .select("id")
      .single();
    if (insertError || !data) return fail(insertError?.message ?? "Nem sikerült menteni a járművet.");
    await logAudit(supabase, user.id, "Jármű létrehozása", "travel_vehicles", data.id, undefined, payload);
  }

  revalidateCompetitions(competitionId);
  return ok();
}

export async function deleteVehicle(vehicleId: string, competitionId: string): Promise<ActionResult> {
  const { supabase, user, error } = await requireStaff();
  if (error || !user) return fail(error ?? "Ismeretlen hiba.");

  const { data: before } = await supabase
    .from("travel_vehicles")
    .select("id, driver_name, type")
    .eq("id", vehicleId)
    .maybeSingle();
  if (!before) return fail("A jármű nem található.");

  const { error: deleteError } = await supabase.from("travel_vehicles").delete().eq("id", vehicleId);
  if (deleteError) return fail(deleteError.message);

  await logAudit(supabase, user.id, "Jármű törlése", "travel_vehicles", vehicleId, before);
  revalidateCompetitions(competitionId);
  return ok();
}
