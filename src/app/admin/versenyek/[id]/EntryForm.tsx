"use client";
import React, { useMemo, useState } from "react";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Checkbox from "@/components/form/input/Checkbox";
import type { EntryInput } from "../actions";
import type { EntryDancer, EntryElement } from "@/types/database.coach.types";
import { PlusIcon, TrashBinIcon } from "@/icons";
import type { ChoreoOption, EntryItem } from "./CompetitionDetail";

const CHOREO_TYPES = ["Egyéni", "Duó", "Trió", "Kiscsoport", "Formáció", "Csoportos"];

const selectClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

interface EntryFormProps {
  onCancel: () => void;
  onSubmit: (input: EntryInput) => void;
  loading: boolean;
  choreographies: ChoreoOption[];
  members: { id: string; full_name: string }[];
  groups: { id: string; name: string }[];
  initial?: EntryItem | null;
}

/** Nevezés (koreográfia egy versenyen) létrehozó / szerkesztő űrlap. */
export default function EntryForm({
  onCancel,
  onSubmit,
  loading,
  choreographies,
  members,
  groups,
  initial,
}: EntryFormProps) {
  const [mode, setMode] = useState<"existing" | "new">(
    initial ? (initial.choreography_id ? "existing" : "new") : "existing"
  );
  const [choreographyId, setChoreographyId] = useState(initial?.choreography_id ?? "");
  const [form, setForm] = useState(() =>
    initial
      ? {
          name: initial.choreography_id ? "" : initial.name,
          type: initial.type ?? "Csoportos",
          category: initial.category ?? "",
          music_url: initial.music_url ?? "",
          costume: initial.costume ?? "",
        }
      : { name: "", type: "Csoportos", category: "", music_url: "", costume: "" }
  );
  const [dancers, setDancers] = useState<EntryDancer[]>(initial?.dancers ?? []);
  const [elements, setElements] = useState<EntryElement[]>(initial?.elements ?? []);
  const [entryFee, setEntryFee] = useState(String(initial?.entry_fee ?? 0));
  const [entryNote, setEntryNote] = useState(initial?.entry_note ?? "");
  const [saveToGlobal, setSaveToGlobal] = useState(false);
  const [dancerSearch, setDancerSearch] = useState("");
  const [newElement, setNewElement] = useState({ name: "", points: "0.2" });

  const handleChoreoSelect = (id: string) => {
    setChoreographyId(id);
    const choreo = choreographies.find((c) => c.id === id);
    if (choreo && !initial) {
      setDancers(choreo.dancers);
      setElements(choreo.elements);
    }
  };

  const filteredMembers = useMemo(
    () =>
      members.filter(
        (m) =>
          !dancers.some((d) => d.id === m.id) &&
          m.full_name.toLowerCase().includes(dancerSearch.trim().toLowerCase())
      ),
    [members, dancers, dancerSearch]
  );

  const addElement = () => {
    const points = Number(newElement.points.replace(",", "."));
    if (!newElement.name.trim()) return;
    if (!Number.isFinite(points) || points < 0.2 || points > 1) return;
    setElements((prev) => [...prev, { name: newElement.name.trim(), points }]);
    setNewElement({ name: "", points: "0.2" });
  };

  const totalPoints = elements.reduce((sum, e) => sum + e.points, 0);

  const handleSubmit = () => {
    onSubmit({
      choreography_id: mode === "existing" ? choreographyId || null : null,
      temp_name: mode === "new" ? form.name : null,
      temp_type: mode === "new" ? form.type : null,
      temp_category: mode === "new" ? form.category || null : null,
      temp_music_url: mode === "new" ? form.music_url || null : null,
      temp_costume: mode === "new" ? form.costume || null : null,
      temp_dancers: dancers,
      temp_elements: elements,
      entry_fee: Number(entryFee) || 0,
      entry_note: entryNote || null,
      saveToGlobal: mode === "new" ? saveToGlobal : false,
    });
  };

  return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <h4 className="mb-6 text-xl font-semibold text-gray-800 dark:text-white/90">
          {initial ? "Nevezés szerkesztése" : "Új nevezés"}
        </h4>

        {/* Módválasztó */}
        <div className="mb-5 flex gap-2">
          <button
            onClick={() => setMode("existing")}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              mode === "existing"
                ? "bg-brand-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-white/[0.05] dark:text-gray-400"
            }`}
          >
            Meglévő koreográfia
          </button>
          <button
            onClick={() => setMode("new")}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              mode === "new"
                ? "bg-brand-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-white/[0.05] dark:text-gray-400"
            }`}
          >
            Új koreográfia
          </button>
        </div>

        {mode === "existing" ? (
          <div>
            <Label htmlFor="entry-choreo">Koreográfia *</Label>
            <select
              id="entry-choreo"
              className={selectClass}
              value={choreographyId}
              onChange={(e) => handleChoreoSelect(e.target.value)}
              disabled={loading}
            >
              <option value="">– Válassz –</option>
              {choreographies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="entry-name">Koreográfia neve *</Label>
              <Input
                id="entry-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                disabled={loading}
              />
            </div>
            <div>
              <Label htmlFor="entry-type">Típus</Label>
              <select
                id="entry-type"
                className={selectClass}
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                disabled={loading}
              >
                {CHOREO_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="entry-category">Célcsoport</Label>
              <select
                id="entry-category"
                className={selectClass}
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                disabled={loading}
              >
                <option value="">– Nincs –</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.name}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="entry-music">Zene URL</Label>
              <Input
                id="entry-music"
                placeholder="https://…"
                value={form.music_url}
                onChange={(e) => setForm({ ...form, music_url: e.target.value })}
                disabled={loading}
              />
            </div>
            <div>
              <Label htmlFor="entry-costume">Jelmez</Label>
              <Input
                id="entry-costume"
                value={form.costume}
                onChange={(e) => setForm({ ...form, costume: e.target.value })}
                disabled={loading}
              />
            </div>
            {!initial && (
              <div className="sm:col-span-2">
                <Checkbox
                  label="Mentés a globális koreográfiák közé is (később újrafelhasználható)"
                  checked={saveToGlobal}
                  onChange={setSaveToGlobal}
                  disabled={loading}
                />
              </div>
            )}
          </div>
        )}

        {/* Táncosok */}
        <div className="mt-5">
          <Label>Táncosok ({dancers.length})</Label>
          {dancers.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {dancers.map((d) => (
                <span
                  key={d.id}
                  className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"
                >
                  {d.name}
                  <button
                    onClick={() => setDancers((prev) => prev.filter((x) => x.id !== d.id))}
                    className="text-brand-400 hover:text-brand-600"
                    title="Eltávolítás"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
          <Input
            placeholder="Tag keresése…"
            value={dancerSearch}
            onChange={(e) => setDancerSearch(e.target.value)}
          />
          <div className="mt-2 grid max-h-40 grid-cols-1 gap-1 overflow-y-auto rounded-lg border border-gray-200 p-3 dark:border-gray-700 sm:grid-cols-2">
            {filteredMembers.map((m) => (
              <Checkbox
                key={m.id}
                label={m.full_name}
                checked={false}
                disabled={loading}
                onChange={(checked) => {
                  if (checked) setDancers((prev) => [...prev, { id: m.id, name: m.full_name }]);
                }}
              />
            ))}
            {filteredMembers.length === 0 && (
              <p className="col-span-2 text-sm text-gray-400">Nincs több hozzáadható tag.</p>
            )}
          </div>
        </div>

        {/* Elemek */}
        <div className="mt-5">
          <Label>
            Elemek{" "}
            <span className="font-normal text-gray-500">
              (összesen {totalPoints.toFixed(1).replace(".", ",")} pont)
            </span>
          </Label>
          {elements.length > 0 && (
            <ul className="mb-2 space-y-1">
              {elements.map((el, i) => (
                <li
                  key={`${el.name}-${i}`}
                  className="flex items-center gap-3 rounded-lg bg-gray-50 px-3 py-2 dark:bg-white/[0.03]"
                >
                  <span className="flex-1 text-sm text-gray-800 dark:text-white/90">{el.name}</span>
                  <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                    {String(el.points).replace(".", ",")} p
                  </span>
                  <button
                    onClick={() => setElements((prev) => prev.filter((_, idx) => idx !== i))}
                    className="rounded p-1 text-gray-400 hover:text-error-500"
                    title="Elem törlése"
                  >
                    <TrashBinIcon className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="Elem neve (pl. lábemelés)"
                value={newElement.name}
                onChange={(e) => setNewElement({ ...newElement, name: e.target.value })}
              />
            </div>
            <div className="w-28">
              <Input
                placeholder="0,2 – 1,0"
                value={newElement.points}
                onChange={(e) => setNewElement({ ...newElement, points: e.target.value })}
              />
            </div>
            <Button variant="outline" size="sm" onClick={addElement}>
              <PlusIcon className="h-4 w-4" />
            </Button>
          </div>
          <p className="mt-1 text-xs text-gray-400">A pontérték 0,2 és 1,0 között lehet.</p>
        </div>

        {/* Díj + megjegyzés */}
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="entry-fee">Nevezési díj (Ft)</Label>
            <Input
              id="entry-fee"
              type="number"
              min="0"
              value={entryFee}
              onChange={(e) => setEntryFee(e.target.value)}
              disabled={loading}
            />
          </div>
          <div>
            <Label htmlFor="entry-note">Megjegyzés</Label>
            <Input
              id="entry-note"
              value={entryNote}
              onChange={(e) => setEntryNote(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>

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
