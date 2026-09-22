"use client";
import React, { useState } from "react";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import Label from "@/components/form/Label";
import Checkbox from "@/components/form/input/Checkbox";
import { HUNGARIAN_DAYS } from "@/lib/utils/format";
import type { ClassInput } from "./actions";

export interface ClassFormInitial {
  input: ClassInput;
  memberIds: string[];
}

const selectClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

interface ClassFormProps {
  onCancel: () => void;
  onSubmit: (input: ClassInput, memberIds: string[]) => void;
  loading: boolean;
  groups: { id: string; name: string }[];
  members: { id: string; full_name: string }[];
  initial?: ClassFormInitial | null;
}

export const emptyClassInput: ClassInput = {
  name: "",
  class_type: "weekly",
  day_of_week: 0,
  specific_date: null,
  start_time: "17:00",
  end_time: "18:30",
  location: "DFSE Terem - Jászberény",
  coach_name: "",
  description: "",
  group_id: null,
};

/** Óra létrehozó / szerkesztő űrlap (heti ismétlődő vagy egyszeri alkalom). */
export default function ClassForm({
  onCancel,
  onSubmit,
  loading,
  groups,
  members,
  initial,
}: ClassFormProps) {
  const [form, setForm] = useState<ClassInput>(initial?.input ?? emptyClassInput);
  const [memberIds, setMemberIds] = useState<Set<string>>(new Set(initial?.memberIds ?? []));
  const [memberSearch, setMemberSearch] = useState("");

  const set = <K extends keyof ClassInput>(key: K, v: ClassInput[K]) =>
    setForm((prev) => ({ ...prev, [key]: v }));

  const filteredMembers = members.filter((m) =>
    m.full_name.toLowerCase().includes(memberSearch.trim().toLowerCase())
  );

  return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="class-name">Óra neve *</Label>
            <Input
              id="class-name"
              placeholder="pl. Hip-Hop versenyző edzés"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              disabled={loading}
            />
          </div>
          <div>
            <Label htmlFor="class-type">Típus</Label>
            <select
              id="class-type"
              className={selectClass}
              value={form.class_type}
              onChange={(e) => set("class_type", e.target.value as "weekly" | "single")}
              disabled={loading}
            >
              <option value="weekly">Heti ismétlődő</option>
              <option value="single">Egyszeri alkalom</option>
            </select>
          </div>
          {form.class_type === "weekly" ? (
            <div>
              <Label htmlFor="class-day">Hét napja *</Label>
              <select
                id="class-day"
                className={selectClass}
                value={String(form.day_of_week ?? 0)}
                onChange={(e) => set("day_of_week", Number(e.target.value))}
                disabled={loading}
              >
                {HUNGARIAN_DAYS.map((d, i) => (
                  <option key={d} value={i}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <Label htmlFor="class-date">Dátum *</Label>
              <Input
                id="class-date"
                type="date"
                value={form.specific_date ?? ""}
                onChange={(e) => set("specific_date", e.target.value || null)}
                disabled={loading}
              />
            </div>
          )}
          <div>
            <Label htmlFor="class-start">Kezdés *</Label>
            <Input
              id="class-start"
              type="time"
              value={form.start_time}
              onChange={(e) => set("start_time", e.target.value)}
              disabled={loading}
            />
          </div>
          <div>
            <Label htmlFor="class-end">Befejezés *</Label>
            <Input
              id="class-end"
              type="time"
              value={form.end_time}
              onChange={(e) => set("end_time", e.target.value)}
              disabled={loading}
            />
          </div>
          <div>
            <Label htmlFor="class-location">Helyszín</Label>
            <Input
              id="class-location"
              value={form.location ?? ""}
              onChange={(e) => set("location", e.target.value || null)}
              disabled={loading}
            />
          </div>
          <div>
            <Label htmlFor="class-coach">Edző</Label>
            <Input
              id="class-coach"
              value={form.coach_name ?? ""}
              onChange={(e) => set("coach_name", e.target.value || null)}
              disabled={loading}
            />
          </div>
          {groups.length > 0 && (
            <div className="sm:col-span-2">
              <Label htmlFor="class-group">Kapcsolódó csoport</Label>
              <select
                id="class-group"
                className={selectClass}
                value={form.group_id ?? ""}
                onChange={(e) => set("group_id", e.target.value || null)}
                disabled={loading}
              >
                <option value="">– Nincs –</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="sm:col-span-2">
            <Label htmlFor="class-desc">Leírás</Label>
            <TextArea
              placeholder="Rövid leírás az óráról…"
              value={form.description ?? ""}
              onChange={(v) => set("description", v || null)}
              disabled={loading}
            />
          </div>
        </div>

        {members.length > 0 && (
          <div className="mt-5">
            <Label>Résztvevők ({memberIds.size} kijelölve)</Label>
            <Input
              placeholder="Tag keresése…"
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
            />
            <div className="mt-2 grid max-h-48 grid-cols-1 gap-1 overflow-y-auto rounded-lg border border-gray-200 p-3 dark:border-gray-700 sm:grid-cols-2">
              {filteredMembers.map((m) => (
                <Checkbox
                  key={m.id}
                  label={m.full_name}
                  checked={memberIds.has(m.id)}
                  disabled={loading}
                  onChange={() =>
                    setMemberIds((prev) => {
                      const next = new Set(prev);
                      if (next.has(m.id)) next.delete(m.id);
                      else next.add(m.id);
                      return next;
                    })
                  }
                />
              ))}
              {filteredMembers.length === 0 && (
                <p className="col-span-2 text-sm text-gray-400">Nincs találat.</p>
              )}
            </div>
          </div>
        )}

        <div className="mt-6 flex items-center justify-end gap-3">
          <Button variant="outline" size="sm" onClick={onCancel} disabled={loading}>
            Mégsem
          </Button>
          <Button size="sm" onClick={() => onSubmit(form, Array.from(memberIds))} disabled={loading}>
            {loading ? "Mentés…" : "Mentés"}
          </Button>
        </div>
      </div>
  );
}
