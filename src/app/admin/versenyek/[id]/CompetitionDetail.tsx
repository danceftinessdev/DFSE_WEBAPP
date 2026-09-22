"use client";
import React, { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import Alert from "@/components/ui/alert/Alert";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import Label from "@/components/form/Label";
import Checkbox from "@/components/form/input/Checkbox";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import EntryForm from "./EntryForm";
import VehicleForm from "./VehicleForm";
import PaymentModal from "./PaymentModal";
import {
  deleteCompetition,
  deleteCompetitionPayment,
  deleteEntry,
  deleteVehicle,
  saveAccommodation,
  saveEntry,
  saveTravelInfo,
  saveVehicle,
  updateCompetition,
  upsertCompetitionPayment,
  type CompetitionInput,
  type EntryInput,
  type VehicleInput,
} from "../actions";
import { formatDateHu, formatForint } from "@/lib/utils/format";
import { PencilIcon, PlusIcon, TrashBinIcon } from "@/icons";
import type { Competition, EntryDancer, EntryElement, VehiclePassenger } from "@/types/database.coach.types";

export interface EntryItem {
  id: string;
  choreography_id: string | null;
  name: string;
  type: string | null;
  category: string | null;
  music_url: string | null;
  costume: string | null;
  dancers: EntryDancer[];
  elements: EntryElement[];
  entry_fee: number;
  entry_note: string | null;
}

export interface ChoreoOption {
  id: string;
  name: string;
  type: string | null;
  target_group: string | null;
  music_url: string | null;
  costume: string | null;
  dancers: EntryDancer[];
  elements: EntryElement[];
}

export interface ParticipantPayment {
  id: string;
  member_id: string;
  member_name: string;
  entry_fee_amount: number;
  entry_fee_paid: boolean;
  entry_fee_note: string | null;
  travel_fee_amount: number;
  travel_fee_paid: boolean;
  travel_fee_note: string | null;
}

export interface VehicleItem {
  id: string;
  type: string;
  driver_name: string | null;
  capacity: number;
  note: string | null;
  passengers: VehiclePassenger[];
}

interface CompetitionDetailProps {
  competition: Competition;
  entries: EntryItem[];
  choreographies: ChoreoOption[];
  members: { id: string; full_name: string }[];
  groups: { id: string; name: string }[];
  payments: ParticipantPayment[];
  vehicles: VehicleItem[];
}

const TABS = [
  { id: "info", label: "Információk" },
  { id: "nevezesek", label: "Nevezések" },
  { id: "utazas", label: "Utazás és szállás" },
  { id: "resztvevok", label: "Résztvevők" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function CompetitionDetail({
  competition,
  entries,
  choreographies,
  members,
  groups,
  payments,
  vehicles,
}: CompetitionDetailProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<TabId>("info");
  const [feedback, setFeedback] = useState<{ variant: "success" | "error"; message: string } | null>(null);

  // Infó űrlap
  const [infoForm, setInfoForm] = useState<CompetitionInput>({
    name: competition.name,
    type: competition.type,
    location: competition.location,
    start_date: competition.starts_at.slice(0, 10),
    end_date: competition.ends_at ? competition.ends_at.slice(0, 10) : null,
    description: competition.description,
    is_public: competition.is_public,
  });

  // Utazás + szállás űrlapok
  const [travelForm, setTravelForm] = useState({
    departure_location: competition.departure_location ?? "",
    departure_time: competition.departure_time ?? "",
  });
  const [accommodationForm, setAccommodationForm] = useState({
    accommodation_address: competition.accommodation_address ?? "",
    accommodation_price: competition.accommodation_price ? String(competition.accommodation_price) : "",
    accommodation_note: competition.accommodation_note ?? "",
    check_in_time: competition.check_in_time ?? "",
    check_out_time: competition.check_out_time ?? "",
  });

  // Modals
  const [entryModalOpen, setEntryModalOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<EntryItem | null>(null);
  const [deleteEntryTarget, setDeleteEntryTarget] = useState<EntryItem | null>(null);

  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);
  const [editVehicle, setEditVehicle] = useState<VehicleItem | null>(null);
  const [deleteVehicleTarget, setDeleteVehicleTarget] = useState<VehicleItem | null>(null);

  const [paymentTarget, setPaymentTarget] = useState<{ id: string; name: string } | null>(null);
  const [deletePaymentTarget, setDeletePaymentTarget] = useState<ParticipantPayment | null>(null);
  const [deleteCompetitionOpen, setDeleteCompetitionOpen] = useState(false);

  const [participantSearch, setParticipantSearch] = useState("");

  const run = (fn: () => Promise<{ success: boolean; error?: string }>, successMessage: string) => {
    setFeedback(null);
    startTransition(async () => {
      const result = await fn();
      if (result.success) {
        setFeedback({ variant: "success", message: successMessage });
        router.refresh();
      } else {
        setFeedback({ variant: "error", message: result.error ?? "Ismeretlen hiba történt." });
      }
    });
  };

  // Résztvevők összeállítása a nevezések táncosaiból + fizetésekből
  const participants = useMemo(() => {
    const map = new Map<
      string,
      { id: string; name: string; choreos: string[]; payment?: ParticipantPayment; vehicle?: string }
    >();
    for (const entry of entries) {
      for (const d of entry.dancers) {
        const existing = map.get(d.id) ?? { id: d.id, name: d.name, choreos: [] };
        if (!existing.choreos.includes(entry.name)) existing.choreos.push(entry.name);
        map.set(d.id, existing);
      }
    }
    for (const p of payments) {
      const existing = map.get(p.member_id) ?? { id: p.member_id, name: p.member_name, choreos: [] };
      existing.payment = p;
      map.set(p.member_id, existing);
    }
    for (const v of vehicles) {
      for (const passenger of v.passengers) {
        const existing = map.get(passenger.id);
        if (existing) {
          existing.vehicle = `${v.type}${v.driver_name ? ` – ${v.driver_name}` : ""}`;
        }
      }
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, "hu"));
  }, [entries, payments, vehicles]);

  const filteredParticipants = useMemo(() => {
    const q = participantSearch.trim().toLowerCase();
    if (!q) return participants;
    return participants.filter(
      (p) => p.name.toLowerCase().includes(q) || p.choreos.some((c) => c.toLowerCase().includes(q))
    );
  }, [participants, participantSearch]);

  const entryFeeFor = (memberId: string) =>
    entries
      .filter((e) => e.dancers.some((d) => d.id === memberId))
      .reduce((sum, e) => sum + e.entry_fee, 0);

  const paymentFor = (memberId: string) => payments.find((p) => p.member_id === memberId) ?? null;

  return (
    <div className="space-y-6">
      {feedback && (
        <Alert
          variant={feedback.variant}
          title={feedback.variant === "success" ? "Sikeres művelet" : "Hiba"}
          message={feedback.message}
        />
      )}

      {/* Fejléc */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">{competition.name}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {formatDateHu(competition.starts_at)}
              {competition.ends_at && competition.ends_at.slice(0, 10) !== competition.starts_at.slice(0, 10)
                ? ` – ${formatDateHu(competition.ends_at)}`
                : ""}
              {competition.location ? ` · ${competition.location}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {competition.type && (
              <Badge variant="light" color="primary">{competition.type}</Badge>
            )}
            <Badge variant="light" color={competition.is_public ? "success" : "warning"}>
              {competition.is_public ? "Nyilvános" : "Privát"}
            </Badge>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2 border-t border-gray-100 pt-4 dark:border-gray-800">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                activeTab === tab.id
                  ? "bg-brand-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-white/[0.05] dark:text-gray-400 dark:hover:bg-white/[0.08]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* INFORMÁCIÓK */}
      {activeTab === "info" && (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="info-name">Verseny neve *</Label>
              <Input
                id="info-name"
                value={infoForm.name}
                onChange={(e) => setInfoForm({ ...infoForm, name: e.target.value })}
                disabled={isPending}
              />
            </div>
            <div>
              <Label htmlFor="info-type">Típus</Label>
              <Input
                id="info-type"
                value={infoForm.type ?? ""}
                onChange={(e) => setInfoForm({ ...infoForm, type: e.target.value || null })}
                disabled={isPending}
              />
            </div>
            <div>
              <Label htmlFor="info-location">Helyszín</Label>
              <Input
                id="info-location"
                value={infoForm.location ?? ""}
                onChange={(e) => setInfoForm({ ...infoForm, location: e.target.value || null })}
                disabled={isPending}
              />
            </div>
            <div>
              <Label htmlFor="info-start">Kezdő dátum *</Label>
              <Input
                id="info-start"
                type="date"
                value={infoForm.start_date}
                onChange={(e) => setInfoForm({ ...infoForm, start_date: e.target.value })}
                disabled={isPending}
              />
            </div>
            <div>
              <Label htmlFor="info-end">Befejező dátum</Label>
              <Input
                id="info-end"
                type="date"
                min={infoForm.start_date}
                value={infoForm.end_date ?? ""}
                onChange={(e) => setInfoForm({ ...infoForm, end_date: e.target.value || null })}
                disabled={isPending}
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="info-desc">Leírás</Label>
              <TextArea
                value={infoForm.description ?? ""}
                onChange={(v) => setInfoForm({ ...infoForm, description: v || null })}
                disabled={isPending}
              />
            </div>
            <div className="sm:col-span-2">
              <Checkbox
                label="Nyilvános verseny (megjelenhet a weboldalon)"
                checked={infoForm.is_public ?? true}
                onChange={(v) => setInfoForm({ ...infoForm, is_public: v })}
                disabled={isPending}
              />
            </div>
          </div>
          <div className="mt-6 flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={() => setDeleteCompetitionOpen(true)}>
              <span className="flex items-center gap-2 text-error-500">
                <TrashBinIcon className="h-4 w-4" /> Verseny törlése
              </span>
            </Button>
            <Button
              size="sm"
              disabled={isPending}
              onClick={() =>
                run(() => updateCompetition(competition.id, infoForm), "Verseny adatai elmentve.")
              }
            >
              {isPending ? "Mentés…" : "Mentés"}
            </Button>
          </div>
        </div>
      )}

      {/* NEVEZÉSEK */}
      {activeTab === "nevezesek" && (
        entryModalOpen ? (
          <EntryForm
            onCancel={() => {
              setEntryModalOpen(false);
              setEditEntry(null);
            }}
            loading={isPending}
            choreographies={choreographies}
            members={members}
            groups={groups}
            initial={editEntry}
            onSubmit={(input: EntryInput) => {
              run(
                () => saveEntry(competition.id, input, editEntry?.id),
                editEntry ? "Nevezés frissítve." : "Nevezés rögzítve."
              );
              setEntryModalOpen(false);
              setEditEntry(null);
            }}
          />
        ) : (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h4 className="font-medium text-gray-800 dark:text-white/90">
              Nevezések ({entries.length})
            </h4>
            <Button
              size="sm"
              startIcon={<PlusIcon className="h-4 w-4" />}
              onClick={() => {
                setEditEntry(null);
                setEntryModalOpen(true);
              }}
            >
              Új nevezés
            </Button>
          </div>
          {entries.length === 0 ? (
            <p className="text-sm text-gray-500">
              Még nincs nevezés erre a versenyre. Adj hozzá meglévő vagy új koreográfiát!
            </p>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {entries.map((entry) => (
                <li key={entry.id} className="py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-gray-800 dark:text-white/90">{entry.name}</span>
                        {entry.type && (
                          <Badge variant="light" color="primary" size="sm">{entry.type}</Badge>
                        )}
                        {entry.category && (
                          <Badge variant="light" color="light" size="sm">{entry.category}</Badge>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        {entry.dancers.length} táncos:{" "}
                        {entry.dancers.map((d) => d.name).join(", ") || "–"}
                      </p>
                      {entry.elements.length > 0 && (
                        <p className="mt-0.5 text-xs text-gray-500">
                          {entry.elements.length} elem, összesen{" "}
                          {entry.elements.reduce((s, e) => s + e.points, 0).toFixed(1).replace(".", ",")} pont
                        </p>
                      )}
                      {entry.entry_note && (
                        <p className="mt-0.5 text-xs italic text-gray-400">{entry.entry_note}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="light" color="info" size="sm">
                        {formatForint(entry.entry_fee)}
                      </Badge>
                      <button
                        onClick={() => {
                          setEditEntry(entry);
                          setEntryModalOpen(true);
                        }}
                        className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-brand-500 dark:hover:bg-white/[0.05]"
                        title="Szerkesztés"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteEntryTarget(entry)}
                        className="rounded-lg p-2 text-gray-400 transition hover:bg-error-50 hover:text-error-500 dark:hover:bg-error-500/10"
                        title="Nevezés törlése"
                      >
                        <TrashBinIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        )
      )}

      {/* UTAZÁS ÉS SZÁLLÁS */}
      {activeTab === "utazas" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
            <h4 className="mb-4 font-medium text-gray-800 dark:text-white/90">Indulás</h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="dep-location">Indulási hely</Label>
                <Input
                  id="dep-location"
                  placeholder="pl. DFSE Terem parkoló"
                  value={travelForm.departure_location}
                  onChange={(e) =>
                    setTravelForm({ ...travelForm, departure_location: e.target.value })
                  }
                  disabled={isPending}
                />
              </div>
              <div>
                <Label htmlFor="dep-time">Indulási idő</Label>
                <Input
                  id="dep-time"
                  type="time"
                  value={travelForm.departure_time}
                  onChange={(e) => setTravelForm({ ...travelForm, departure_time: e.target.value })}
                  disabled={isPending}
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button
                size="sm"
                disabled={isPending}
                onClick={() =>
                  run(
                    () =>
                      saveTravelInfo(competition.id, {
                        departure_location: travelForm.departure_location,
                        departure_time: travelForm.departure_time,
                      }),
                    "Indulási adatok elmentve."
                  )
                }
              >
                Mentés
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
            {vehicleModalOpen ? (
              <VehicleForm
                onCancel={() => {
                  setVehicleModalOpen(false);
                  setEditVehicle(null);
                }}
                loading={isPending}
                participants={participants.map((p) => ({ id: p.id, name: p.name }))}
                initial={editVehicle}
                onSubmit={(input: VehicleInput) => {
                  run(
                    () => saveVehicle(competition.id, input, editVehicle?.id),
                    editVehicle ? "Jármű frissítve." : "Jármű létrehozva."
                  );
                  setVehicleModalOpen(false);
                  setEditVehicle(null);
                }}
              />
            ) : (
              <>
            <div className="mb-4 flex items-center justify-between">
              <h4 className="font-medium text-gray-800 dark:text-white/90">
                Járművek ({vehicles.length})
              </h4>
              <Button
                size="sm"
                startIcon={<PlusIcon className="h-4 w-4" />}
                onClick={() => {
                  setEditVehicle(null);
                  setVehicleModalOpen(true);
                }}
              >
                Új jármű
              </Button>
            </div>
            {vehicles.length === 0 ? (
              <p className="text-sm text-gray-500">Még nincs rögzített jármű.</p>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                {vehicles.map((v) => (
                  <li key={v.id} className="flex flex-wrap items-start gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-gray-800 dark:text-white/90">{v.type}</span>
                        {v.driver_name && (
                          <span className="text-sm text-gray-500">– {v.driver_name}</span>
                        )}
                        <Badge
                          variant="light"
                          color={v.passengers.length > v.capacity ? "error" : "info"}
                          size="sm"
                        >
                          {v.passengers.length}/{v.capacity} fő
                        </Badge>
                      </div>
                      {v.passengers.length > 0 && (
                        <p className="mt-1 text-xs text-gray-500">
                          Utasok: {v.passengers.map((p) => p.name).join(", ")}
                        </p>
                      )}
                      {v.note && <p className="mt-0.5 text-xs italic text-gray-400">{v.note}</p>}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditVehicle(v);
                          setVehicleModalOpen(true);
                        }}
                        className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-brand-500 dark:hover:bg-white/[0.05]"
                        title="Szerkesztés"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteVehicleTarget(v)}
                        className="rounded-lg p-2 text-gray-400 transition hover:bg-error-50 hover:text-error-500 dark:hover:bg-error-500/10"
                        title="Jármű törlése"
                      >
                        <TrashBinIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
              </>
            )}
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
            <h4 className="mb-4 font-medium text-gray-800 dark:text-white/90">Szállás</h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="acc-address">Szállás címe</Label>
                <Input
                  id="acc-address"
                  value={accommodationForm.accommodation_address}
                  onChange={(e) =>
                    setAccommodationForm({ ...accommodationForm, accommodation_address: e.target.value })
                  }
                  disabled={isPending}
                />
              </div>
              <div>
                <Label htmlFor="acc-price">Ár (Ft / fő)</Label>
                <Input
                  id="acc-price"
                  type="number"
                  min="0"
                  value={accommodationForm.accommodation_price}
                  onChange={(e) =>
                    setAccommodationForm({ ...accommodationForm, accommodation_price: e.target.value })
                  }
                  disabled={isPending}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="acc-checkin">Bejelentkezés</Label>
                  <Input
                    id="acc-checkin"
                    type="time"
                    value={accommodationForm.check_in_time}
                    onChange={(e) =>
                      setAccommodationForm({ ...accommodationForm, check_in_time: e.target.value })
                    }
                    disabled={isPending}
                  />
                </div>
                <div>
                  <Label htmlFor="acc-checkout">Kijelentkezés</Label>
                  <Input
                    id="acc-checkout"
                    type="time"
                    value={accommodationForm.check_out_time}
                    onChange={(e) =>
                      setAccommodationForm({ ...accommodationForm, check_out_time: e.target.value })
                    }
                    disabled={isPending}
                  />
                </div>
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="acc-note">Megjegyzés</Label>
                <TextArea
                  value={accommodationForm.accommodation_note}
                  onChange={(v) =>
                    setAccommodationForm({ ...accommodationForm, accommodation_note: v })
                  }
                  disabled={isPending}
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button
                size="sm"
                disabled={isPending}
                onClick={() =>
                  run(
                    () =>
                      saveAccommodation(competition.id, {
                        accommodation_address: accommodationForm.accommodation_address,
                        accommodation_price: accommodationForm.accommodation_price
                          ? Number(accommodationForm.accommodation_price)
                          : null,
                        accommodation_note: accommodationForm.accommodation_note,
                        check_in_time: accommodationForm.check_in_time,
                        check_out_time: accommodationForm.check_out_time,
                      }),
                    "Szállásadatok elmentve."
                  )
                }
              >
                Mentés
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* RÉSZTVEVŐK */}
      {activeTab === "resztvevok" && (
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 p-5 dark:border-gray-800">
            <h4 className="font-medium text-gray-800 dark:text-white/90">
              Résztvevők ({participants.length})
            </h4>
            <div className="w-full sm:w-64">
              <Input
                placeholder="Keresés név vagy koreográfia alapján…"
                value={participantSearch}
                onChange={(e) => setParticipantSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="max-w-full overflow-x-auto">
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  <TableCell isHeader className="px-5 py-3 text-start text-sm font-medium text-gray-500 dark:text-gray-400">Név</TableCell>
                  <TableCell isHeader className="px-5 py-3 text-start text-sm font-medium text-gray-500 dark:text-gray-400">Koreográfiák</TableCell>
                  <TableCell isHeader className="px-5 py-3 text-start text-sm font-medium text-gray-500 dark:text-gray-400">Jármű</TableCell>
                  <TableCell isHeader className="px-5 py-3 text-start text-sm font-medium text-gray-500 dark:text-gray-400">Nevezési díj</TableCell>
                  <TableCell isHeader className="px-5 py-3 text-start text-sm font-medium text-gray-500 dark:text-gray-400">Utazási díj</TableCell>
                  <TableCell isHeader className="px-5 py-3 text-end text-sm font-medium text-gray-500 dark:text-gray-400">Műveletek</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredParticipants.length === 0 && (
                  <TableRow>
                    <TableCell className="px-5 py-10 text-center text-sm text-gray-500" colSpan={6}>
                      Nincs résztvevő. A résztvevők a nevezések táncosaiból állnak össze.
                    </TableCell>
                  </TableRow>
                )}
                {filteredParticipants.map((p) => {
                  const payment = p.payment;
                  return (
                    <TableRow key={p.id} className="border-b border-gray-50 dark:border-white/[0.03]">
                      <TableCell className="px-5 py-4">
                        <Link
                          href={`/admin/tagok/${p.id}`}
                          className="font-medium text-gray-800 hover:text-brand-500 dark:text-white/90"
                        >
                          {p.name}
                        </Link>
                      </TableCell>
                      <TableCell className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {p.choreos.join(", ") || "–"}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {p.vehicle ?? "–"}
                      </TableCell>
                      <TableCell className="px-5 py-4">
                        {payment ? (
                          <Badge variant="light" color={payment.entry_fee_paid ? "success" : "error"} size="sm">
                            {formatForint(payment.entry_fee_amount)} {payment.entry_fee_paid ? "✓" : ""}
                          </Badge>
                        ) : (
                          <span className="text-xs text-gray-400">–</span>
                        )}
                      </TableCell>
                      <TableCell className="px-5 py-4">
                        {payment ? (
                          <Badge variant="light" color={payment.travel_fee_paid ? "success" : "error"} size="sm">
                            {formatForint(payment.travel_fee_amount)} {payment.travel_fee_paid ? "✓" : ""}
                          </Badge>
                        ) : (
                          <span className="text-xs text-gray-400">–</span>
                        )}
                      </TableCell>
                      <TableCell className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPaymentTarget({ id: p.id, name: p.name })}
                          >
                            Fizetés
                          </Button>
                          {payment && (
                            <button
                              onClick={() => setDeletePaymentTarget(payment)}
                              className="rounded-lg p-2 text-gray-400 transition hover:bg-error-50 hover:text-error-500 dark:hover:bg-error-500/10"
                              title="Fizetési adat törlése"
                            >
                              <TrashBinIcon className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Fizetés modal */}
      <PaymentModal
        isOpen={paymentTarget !== null}
        onClose={() => setPaymentTarget(null)}
        loading={isPending}
        memberName={paymentTarget?.name ?? ""}
        suggestedEntryFee={paymentTarget ? entryFeeFor(paymentTarget.id) : 0}
        initial={paymentTarget ? paymentFor(paymentTarget.id) : null}
        onSubmit={(input) => {
          if (!paymentTarget) return;
          run(
            () => upsertCompetitionPayment(competition.id, paymentTarget.id, input),
            "Fizetési adatok elmentve."
          );
          setPaymentTarget(null);
        }}
      />

      <ConfirmDialog
        isOpen={deleteEntryTarget !== null}
        onClose={() => setDeleteEntryTarget(null)}
        loading={isPending}
        title="Nevezés törlése"
        message={<>Törlöd a(z) <strong>{deleteEntryTarget?.name}</strong> nevezést erről a versenyről?</>}
        onConfirm={() => {
          if (!deleteEntryTarget) return;
          run(() => deleteEntry(deleteEntryTarget.id, competition.id), "Nevezés törölve.");
          setDeleteEntryTarget(null);
        }}
      />

      <ConfirmDialog
        isOpen={deleteVehicleTarget !== null}
        onClose={() => setDeleteVehicleTarget(null)}
        loading={isPending}
        title="Jármű törlése"
        message={
          <>
            Törlöd a(z) <strong>{deleteVehicleTarget?.type}</strong>
            {deleteVehicleTarget?.driver_name ? ` (${deleteVehicleTarget.driver_name})` : ""} járművet
            az utaslistával együtt?
          </>
        }
        onConfirm={() => {
          if (!deleteVehicleTarget) return;
          run(() => deleteVehicle(deleteVehicleTarget.id, competition.id), "Jármű törölve.");
          setDeleteVehicleTarget(null);
        }}
      />

      <ConfirmDialog
        isOpen={deletePaymentTarget !== null}
        onClose={() => setDeletePaymentTarget(null)}
        loading={isPending}
        title="Fizetési adat törlése"
        message={
          <>
            Törlöd <strong>{deletePaymentTarget?.member_name}</strong> fizetési adatait erről a
            versenyről?
          </>
        }
        onConfirm={() => {
          if (!deletePaymentTarget) return;
          run(
            () => deleteCompetitionPayment(competition.id, deletePaymentTarget.member_id),
            "Fizetési adat törölve."
          );
          setDeletePaymentTarget(null);
        }}
      />

      <ConfirmDialog
        isOpen={deleteCompetitionOpen}
        onClose={() => setDeleteCompetitionOpen(false)}
        loading={isPending}
        title="Verseny törlése"
        message={
          <>
            Biztosan törlöd a(z) <strong>{competition.name}</strong> versenyt? A művelet nem vonható
            vissza.
          </>
        }
        destructiveDetails={[
          "Az összes nevezés, fizetési adat és jármű törlődik.",
          "A kapcsolt koreográfiák megmaradnak, csak leválasztódnak.",
        ]}
        onConfirm={() => {
          startTransition(async () => {
            const result = await deleteCompetition(competition.id);
            if (result.success) {
              router.push("/admin/versenyek");
              router.refresh();
            } else {
              setDeleteCompetitionOpen(false);
              setFeedback({ variant: "error", message: result.error ?? "A törlés nem sikerült." });
            }
          });
        }}
      />
    </div>
  );
}
