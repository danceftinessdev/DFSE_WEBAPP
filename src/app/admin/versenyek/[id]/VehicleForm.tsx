"use client";
import React, { useState } from "react";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import Label from "@/components/form/Label";
import Checkbox from "@/components/form/input/Checkbox";
import type { VehicleInput } from "../actions";
import type { VehiclePassenger } from "@/types/database.coach.types";
import type { VehicleItem } from "./CompetitionDetail";

const VEHICLE_TYPES = ["Autó", "Busz", "Tömegközlekedés"];

const selectClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

interface VehicleFormProps {
  onCancel: () => void;
  onSubmit: (input: VehicleInput) => void;
  loading: boolean;
  participants: { id: string; name: string }[];
  initial?: VehicleItem | null;
}

/** Jármű létrehozó / szerkesztő űrlap utaslistával. */
export default function VehicleForm({
  onCancel,
  onSubmit,
  loading,
  participants,
  initial,
}: VehicleFormProps) {
  const [form, setForm] = useState(() =>
    initial
      ? {
          type: initial.type,
          driver_name: initial.driver_name ?? "",
          capacity: String(initial.capacity),
          note: initial.note ?? "",
        }
      : { type: "Autó", driver_name: "", capacity: "4", note: "" }
  );
  const [passengers, setPassengers] = useState<Set<string>>(
    () => new Set(initial?.passengers.map((p) => p.id) ?? [])
  );

  const capacity = Number(form.capacity) || 0;

  const handleSubmit = () => {
    const passengerList: VehiclePassenger[] = participants
      .filter((p) => passengers.has(p.id))
      .map((p) => ({ id: p.id, name: p.name }));
    onSubmit({
      type: form.type,
      driver_name: form.driver_name || null,
      capacity,
      note: form.note || null,
      passengers: passengerList,
    });
  };

  return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <h4 className="mb-6 text-xl font-semibold text-gray-800 dark:text-white/90">
          {initial ? "Jármű szerkesztése" : "Új jármű"}
        </h4>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="veh-type">Típus</Label>
            <select
              id="veh-type"
              className={selectClass}
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              disabled={loading}
            >
              {VEHICLE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="veh-driver">Sofőr / szervező</Label>
            <Input
              id="veh-driver"
              value={form.driver_name}
              onChange={(e) => setForm({ ...form, driver_name: e.target.value })}
              disabled={loading}
            />
          </div>
          <div>
            <Label htmlFor="veh-capacity">Kapacitás (fő)</Label>
            <Input
              id="veh-capacity"
              type="number"
              min="1"
              value={form.capacity}
              onChange={(e) => setForm({ ...form, capacity: e.target.value })}
              disabled={loading}
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="veh-note">Megjegyzés</Label>
            <TextArea
              placeholder="pl. Rendszám, találkozási pont…"
              value={form.note}
              onChange={(v) => setForm({ ...form, note: v })}
              disabled={loading}
            />
          </div>
        </div>

        {participants.length > 0 && (
          <div className="mt-5">
            <Label>
              Utasok ({passengers.size}/{capacity || "?"})
            </Label>
            <div className="grid max-h-48 grid-cols-1 gap-1 overflow-y-auto rounded-lg border border-gray-200 p-3 dark:border-gray-700 sm:grid-cols-2">
              {participants.map((p) => (
                <Checkbox
                  key={p.id}
                  label={p.name}
                  checked={passengers.has(p.id)}
                  disabled={loading}
                  onChange={() =>
                    setPassengers((prev) => {
                      const next = new Set(prev);
                      if (next.has(p.id)) next.delete(p.id);
                      else next.add(p.id);
                      return next;
                    })
                  }
                />
              ))}
            </div>
            {passengers.size > capacity && capacity > 0 && (
              <p className="mt-1 text-xs text-error-500">
                Több utast jelöltél ki, mint a kapacitás!
              </p>
            )}
          </div>
        )}

        <div className="mt-6 flex items-center justify-end gap-3">
          <Button variant="outline" size="sm" onClick={onCancel} disabled={loading}>
            Mégsem
          </Button>
          <Button size="sm" onClick={handleSubmit} disabled={loading}>
            {loading ? "Mentés…" : "Mentés"}
          </Button>
        </div>
      </div>
  );
}
