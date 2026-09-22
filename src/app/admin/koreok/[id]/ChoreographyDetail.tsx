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
import ConfirmDialog from "@/components/common/ConfirmDialog";
import {
  deleteChoreography,
  saveChoreography,
  type ChoreographyInput,
} from "../actions";
import { CHOREO_TYPES } from "@/lib/constants";
import { formatDateHu, formatForint } from "@/lib/utils/format";
import { AngleDownIcon, AngleUpIcon, PlusIcon, TrashBinIcon } from "@/icons";
import type { Choreography, EntryElement } from "@/types/database.coach.types";

export interface LinkedCompetition {
  id: string;
  name: string;
  starts_at: string;
  location: string | null;
  entry_fee: number;
}

interface ChoreographyDetailProps {
  choreography: Choreography;
  initialDancerIds: string[];
  initialElements: EntryElement[];
  members: { id: string; full_name: string }[];
  groups: { id: string; name: string }[];
  linkedCompetitions: LinkedCompetition[];
}

const selectClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

export default function ChoreographyDetail({
  choreography,
  initialDancerIds,
  initialElements,
  members,
  groups,
  linkedCompetitions,
}: ChoreographyDetailProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ variant: "success" | "error"; message: string } | null>(null);

  const [form, setForm] = useState<ChoreographyInput>({
    name: choreography.name,
    type: choreography.type,
    costume: choreography.costume,
    music_url: choreography.music_url,
    note: choreography.note,
    target_group: choreography.target_group,
    duration_seconds: choreography.duration_seconds,
  });
  const [dancerIds, setDancerIds] = useState<Set<string>>(new Set(initialDancerIds));
  const [elements, setElements] = useState<EntryElement[]>(initialElements);
  const [dancerSearch, setDancerSearch] = useState("");
  const [newElement, setNewElement] = useState({ name: "", points: "0.2" });
  const [deleteOpen, setDeleteOpen] = useState(false);

  const isDirty = useMemo(() => {
    if (JSON.stringify(form.name) !== JSON.stringify(choreography.name)) return true;
    if (form.type !== choreography.type) return true;
    if ((form.costume ?? null) !== choreography.costume) return true;
    if ((form.music_url ?? null) !== choreography.music_url) return true;
    if ((form.note ?? null) !== choreography.note) return true;
    if ((form.target_group ?? null) !== choreography.target_group) return true;
    if ((form.duration_seconds ?? null) !== choreography.duration_seconds) return true;
    if (dancerIds.size !== initialDancerIds.length) return true;
    if (initialDancerIds.some((d) => !dancerIds.has(d))) return true;
    if (JSON.stringify(elements) !== JSON.stringify(initialElements)) return true;
    return false;
  }, [form, dancerIds, elements, choreography, initialDancerIds, initialElements]);

  const selectedMembers = members.filter((m) => dancerIds.has(m.id));
  const availableMembers = members.filter(
    (m) =>
      !dancerIds.has(m.id) &&
      m.full_name.toLowerCase().includes(dancerSearch.trim().toLowerCase())
  );

  const totalPoints = elements.reduce((s, e) => s + e.points, 0);

  const addElement = () => {
    const points = Number(newElement.points.replace(",", "."));
    if (!newElement.name.trim()) {
      setFeedback({ variant: "error", message: "Az elem neve kötelező." });
      return;
    }
    if (!Number.isFinite(points) || points < 0.2 || points > 1) {
      setFeedback({ variant: "error", message: "A pontérték 0,2 és 1,0 között lehet." });
      return;
    }
    setFeedback(null);
    setElements((prev) => [...prev, { name: newElement.name.trim(), points }]);
    setNewElement({ name: "", points: "0.2" });
  };

  const moveElement = (index: number, direction: -1 | 1) => {
    setElements((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const handleSave = () => {
    setFeedback(null);
    startTransition(async () => {
      const result = await saveChoreography(
        choreography.id,
        form,
        Array.from(dancerIds),
        elements
      );
      if (result.success) {
        setFeedback({ variant: "success", message: "Koreográfia elmentve." });
        router.refresh();
      } else {
        setFeedback({ variant: "error", message: result.error ?? "Ismeretlen hiba történt." });
      }
    });
  };

  const durationMinutes = form.duration_seconds
    ? String(Math.floor(form.duration_seconds / 60))
    : "";
  const durationSeconds = form.duration_seconds ? String(form.duration_seconds % 60) : "";

  return (
    <div className="space-y-6">
      {feedback && (
        <Alert
          variant={feedback.variant}
          title={feedback.variant === "success" ? "Sikeres mentés" : "Hiba"}
          message={feedback.message}
        />
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Alapadatok + elemek */}
        <div className="space-y-6 xl:col-span-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
            <h4 className="mb-4 font-medium text-gray-800 dark:text-white/90">Alapadatok</h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="c-name">Név *</Label>
                <Input
                  id="c-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  disabled={isPending}
                />
              </div>
              <div>
                <Label htmlFor="c-type">Típus</Label>
                <select
                  id="c-type"
                  className={selectClass}
                  value={form.type ?? "Csoportos"}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  disabled={isPending}
                >
                  {CHOREO_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="c-group">Célcsoport</Label>
                <select
                  id="c-group"
                  className={selectClass}
                  value={form.target_group ?? ""}
                  onChange={(e) => setForm({ ...form, target_group: e.target.value || null })}
                  disabled={isPending}
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
                <Label htmlFor="c-costume">Jelmez</Label>
                <Input
                  id="c-costume"
                  value={form.costume ?? ""}
                  onChange={(e) => setForm({ ...form, costume: e.target.value || null })}
                  disabled={isPending}
                />
              </div>
              <div>
                <Label htmlFor="c-music">Zene URL</Label>
                <Input
                  id="c-music"
                  placeholder="https://…"
                  value={form.music_url ?? ""}
                  onChange={(e) => setForm({ ...form, music_url: e.target.value || null })}
                  disabled={isPending}
                />
              </div>
              <div className="sm:col-span-2">
                <Label>Időtartam</Label>
                <div className="flex items-center gap-2">
                  <div className="w-28">
                    <Input
                      type="number"
                      min="0"
                      placeholder="perc"
                      value={durationMinutes}
                      onChange={(e) => {
                        const min = Number(e.target.value) || 0;
                        const sec = Number(durationSeconds) || 0;
                        setForm({
                          ...form,
                          duration_seconds: e.target.value === "" && durationSeconds === "" ? null : min * 60 + sec,
                        });
                      }}
                      disabled={isPending}
                    />
                  </div>
                  <span className="text-sm text-gray-500">perc</span>
                  <div className="w-28">
                    <Input
                      type="number"
                      min="0"
                      max="59"
                      placeholder="mp"
                      value={durationSeconds}
                      onChange={(e) => {
                        const min = Number(durationMinutes) || 0;
                        const sec = Math.min(59, Number(e.target.value) || 0);
                        setForm({
                          ...form,
                          duration_seconds: e.target.value === "" && durationMinutes === "" ? null : min * 60 + sec,
                        });
                      }}
                      disabled={isPending}
                    />
                  </div>
                  <span className="text-sm text-gray-500">mp</span>
                </div>
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="c-note">Megjegyzés</Label>
                <TextArea
                  value={form.note ?? ""}
                  onChange={(v) => setForm({ ...form, note: v || null })}
                  disabled={isPending}
                />
              </div>
            </div>
          </div>

          {/* Elemek */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
            <h4 className="mb-1 font-medium text-gray-800 dark:text-white/90">Elemek</h4>
            <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">
              Összesen {elements.length} elem · {totalPoints.toFixed(1).replace(".", ",")} pont
            </p>
            {elements.length > 0 && (
              <ul className="mb-3 space-y-1">
                {elements.map((el, i) => (
                  <li
                    key={`${el.name}-${i}`}
                    className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 dark:bg-white/[0.03]"
                  >
                    <span className="w-6 text-center text-xs text-gray-400">{i + 1}.</span>
                    <span className="flex-1 text-sm text-gray-800 dark:text-white/90">{el.name}</span>
                    <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                      {String(el.points).replace(".", ",")} p
                    </span>
                    <button
                      onClick={() => moveElement(i, -1)}
                      disabled={i === 0 || isPending}
                      className="rounded p-1 text-gray-400 hover:text-brand-500 disabled:opacity-30"
                      title="Feljebb"
                    >
                      <AngleUpIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => moveElement(i, 1)}
                      disabled={i === elements.length - 1 || isPending}
                      className="rounded p-1 text-gray-400 hover:text-brand-500 disabled:opacity-30"
                      title="Lejjebb"
                    >
                      <AngleDownIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setElements((prev) => prev.filter((_, idx) => idx !== i))}
                      disabled={isPending}
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
          </div>
        </div>

        {/* Táncosok + kapcsolt versenyek */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
            <h4 className="mb-3 font-medium text-gray-800 dark:text-white/90">
              Táncosok ({selectedMembers.length})
            </h4>
            {selectedMembers.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {selectedMembers.map((m) => (
                  <span
                    key={m.id}
                    className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"
                  >
                    {m.full_name}
                    <button
                      onClick={() =>
                        setDancerIds((prev) => {
                          const next = new Set(prev);
                          next.delete(m.id);
                          return next;
                        })
                      }
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
            <div className="mt-2 max-h-56 space-y-1 overflow-y-auto rounded-lg border border-gray-200 p-3 dark:border-gray-700">
              {availableMembers.map((m) => (
                <Checkbox
                  key={m.id}
                  label={m.full_name}
                  checked={false}
                  disabled={isPending}
                  onChange={(checked) => {
                    if (checked)
                      setDancerIds((prev) => {
                        const next = new Set(prev);
                        next.add(m.id);
                        return next;
                      });
                  }}
                />
              ))}
              {availableMembers.length === 0 && (
                <p className="text-sm text-gray-400">Nincs több hozzáadható tag.</p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
            <h4 className="mb-3 font-medium text-gray-800 dark:text-white/90">
              Kapcsolt versenyek ({linkedCompetitions.length})
            </h4>
            {linkedCompetitions.length === 0 ? (
              <p className="text-sm text-gray-500">
                Ez a koreográfia még nincs nevezve egyetlen versenyre sem.
              </p>
            ) : (
              <ul className="space-y-2">
                {linkedCompetitions.map((c) => (
                  <li key={c.id} className="flex items-center gap-2">
                    <Link
                      href={`/admin/versenyek/${c.id}`}
                      className="flex-1 text-sm font-medium text-brand-500 hover:text-brand-600"
                    >
                      {c.name}
                    </Link>
                    <span className="text-xs text-gray-500">{formatDateHu(c.starts_at)}</span>
                    <Badge variant="light" color="info" size="sm">
                      {formatForint(c.entry_fee)}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Alsó műveletsor */}
      <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex items-center gap-4">
          <Link href="/admin/koreok" className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400">
            ← Vissza a listához
          </Link>
          <Button variant="outline" size="sm" onClick={() => setDeleteOpen(true)}>
            <span className="flex items-center gap-2 text-error-500">
              <TrashBinIcon className="h-4 w-4" /> Törlés
            </span>
          </Button>
        </div>
        <div className="flex items-center gap-3">
          {isDirty && (
            <Badge variant="light" color="warning" size="sm">
              Nem mentett módosítások
            </Badge>
          )}
          <Button size="sm" onClick={handleSave} disabled={isPending || !isDirty}>
            {isPending ? "Mentés…" : "Mentés"}
          </Button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        loading={isPending}
        title="Koreográfia törlése"
        message={
          <>
            Biztosan törlöd a(z) <strong>{choreography.name}</strong> koreográfiát? A művelet nem
            vonható vissza.
          </>
        }
        destructiveDetails={[
          "A táncos-hozzárendelések és elemek törlődnek.",
          "A versenyeken a nevezések megmaradnak, de a koreográfia-hivatkozás megszűnik.",
        ]}
        onConfirm={() => {
          startTransition(async () => {
            const result = await deleteChoreography(choreography.id);
            if (result.success) {
              router.push("/admin/koreok");
              router.refresh();
            } else {
              setDeleteOpen(false);
              setFeedback({ variant: "error", message: result.error ?? "A törlés nem sikerült." });
            }
          });
        }}
      />
    </div>
  );
}
