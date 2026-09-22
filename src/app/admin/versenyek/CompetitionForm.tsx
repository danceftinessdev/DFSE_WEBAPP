"use client";
import React, { useState } from "react";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import Label from "@/components/form/Label";
import Checkbox from "@/components/form/input/Checkbox";
import type { CompetitionInput } from "./actions";
import type { Competition } from "@/types/database.coach.types";

export const COMPETITION_TYPES = [
  "Országos bajnokság",
  "Regionális verseny",
  "Kupaverseny",
  "Bemutató",
  "Fesztivál",
];

interface CompetitionFormProps {
  onCancel: () => void;
  onSubmit: (input: CompetitionInput) => void;
  loading: boolean;
  initial?: Competition | null;
  defaultDate?: string | null;
}

const emptyInput: CompetitionInput = {
  name: "",
  type: null,
  location: "",
  start_date: "",
  end_date: null,
  description: "",
  is_public: true,
};

/** Verseny létrehozó űrlap. */
export default function CompetitionForm({
  onCancel,
  onSubmit,
  loading,
  initial,
  defaultDate,
}: CompetitionFormProps) {
  const [form, setForm] = useState<CompetitionInput>(() => {
    if (initial) {
      return {
        name: initial.name,
        type: initial.type,
        location: initial.location,
        start_date: initial.starts_at.slice(0, 10),
        end_date: initial.ends_at ? initial.ends_at.slice(0, 10) : null,
        description: initial.description,
        is_public: initial.is_public,
      };
    }
    return { ...emptyInput, start_date: defaultDate ?? "" };
  });

  const set = <K extends keyof CompetitionInput>(key: K, v: CompetitionInput[K]) =>
    setForm((prev) => ({ ...prev, [key]: v }));

  return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="comp-name">Verseny neve *</Label>
            <Input
              id="comp-name"
              placeholder="pl. Fitness Országos Bajnokság"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              disabled={loading}
            />
          </div>
          <div>
            <Label htmlFor="comp-type">Típus</Label>
            <Input
              id="comp-type"
              placeholder="pl. Országos bajnokság"
              value={form.type ?? ""}
              onChange={(e) => set("type", e.target.value || null)}
              disabled={loading}
            />
          </div>
          <div>
            <Label htmlFor="comp-location">Helyszín</Label>
            <Input
              id="comp-location"
              placeholder="pl. Jászberény, Városi Sportcsarnok"
              value={form.location ?? ""}
              onChange={(e) => set("location", e.target.value || null)}
              disabled={loading}
            />
          </div>
          <div>
            <Label htmlFor="comp-start">Kezdő dátum *</Label>
            <Input
              id="comp-start"
              type="date"
              value={form.start_date}
              onChange={(e) => set("start_date", e.target.value)}
              disabled={loading}
            />
          </div>
          <div>
            <Label htmlFor="comp-end">Befejező dátum</Label>
            <Input
              id="comp-end"
              type="date"
              min={form.start_date}
              value={form.end_date ?? ""}
              onChange={(e) => set("end_date", e.target.value || null)}
              disabled={loading}
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="comp-desc">Leírás</Label>
            <TextArea
              placeholder="Rövid leírás a versenyről…"
              value={form.description ?? ""}
              onChange={(v) => set("description", v || null)}
              disabled={loading}
            />
          </div>
          <div className="sm:col-span-2">
            <Checkbox
              label="Nyilvános verseny (megjelenhet a weboldalon)"
              checked={form.is_public ?? true}
              onChange={(checked) => set("is_public", checked)}
              disabled={loading}
            />
          </div>
        </div>
        <div className="mt-6 flex items-center justify-end gap-3">
          <Button variant="outline" size="sm" onClick={onCancel} disabled={loading}>
            Mégsem
          </Button>
          <Button size="sm" onClick={() => onSubmit(form)} disabled={loading}>
            {loading ? "Mentés…" : "Mentés"}
          </Button>
        </div>
      </div>
  );
}
