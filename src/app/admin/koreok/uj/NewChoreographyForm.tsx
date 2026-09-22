"use client";
import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/button/Button";
import Alert from "@/components/ui/alert/Alert";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import Label from "@/components/form/Label";
import { createChoreography, type ChoreographyInput } from "../actions";
import { CHOREO_TYPES } from "@/lib/constants";

const selectClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

const emptyForm: ChoreographyInput = {
  name: "",
  type: "Csoportos",
  costume: "",
  music_url: "",
  note: "",
  target_group: "",
  duration_seconds: null,
};

interface NewChoreographyFormProps {
  groups: { id: string; name: string }[];
}

/** Új koreográfia létrehozó űrlap (önálló oldal, nem popup). */
export default function NewChoreographyForm({ groups }: NewChoreographyFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ variant: "success" | "error"; message: string } | null>(null);
  const [form, setForm] = useState<ChoreographyInput>(emptyForm);

  const handleCreate = () => {
    setFeedback(null);
    startTransition(async () => {
      const result = await createChoreography(form);
      if (result.success) {
        router.push(result.data?.id ? `/admin/koreok/${result.data.id}` : "/admin/koreok");
      } else {
        setFeedback({ variant: "error", message: result.error ?? "Ismeretlen hiba történt." });
      }
    });
  };

  return (
    <div className="space-y-6">
      {feedback && <Alert variant={feedback.variant} title="Hiba" message={feedback.message} />}

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="choreo-name">Név *</Label>
            <Input
              id="choreo-name"
              placeholder="pl. Tavaszi nyitó"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              disabled={isPending}
            />
          </div>
          <div>
            <Label htmlFor="choreo-type">Típus</Label>
            <select
              id="choreo-type"
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
            <Label htmlFor="choreo-group">Célcsoport</Label>
            <select
              id="choreo-group"
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
            <Label htmlFor="choreo-costume">Jelmez</Label>
            <Input
              id="choreo-costume"
              value={form.costume ?? ""}
              onChange={(e) => setForm({ ...form, costume: e.target.value || null })}
              disabled={isPending}
            />
          </div>
          <div>
            <Label htmlFor="choreo-music">Zene URL</Label>
            <Input
              id="choreo-music"
              placeholder="https://…"
              value={form.music_url ?? ""}
              onChange={(e) => setForm({ ...form, music_url: e.target.value || null })}
              disabled={isPending}
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="choreo-note">Megjegyzés</Label>
            <TextArea
              placeholder="Belső megjegyzés…"
              value={form.note ?? ""}
              onChange={(v) => setForm({ ...form, note: v || null })}
              disabled={isPending}
            />
          </div>
        </div>
        <p className="mt-3 text-xs text-gray-400">
          A táncosokat és elemeket a létrehozás után, a részletes oldalon tudod hozzáadni.
        </p>
        <div className="mt-6 flex items-center justify-end gap-3">
          <Button variant="outline" size="sm" onClick={() => router.push("/admin/koreok")} disabled={isPending}>
            Mégsem
          </Button>
          <Button size="sm" onClick={handleCreate} disabled={isPending}>
            {isPending ? "Létrehozás…" : "Létrehozás"}
          </Button>
        </div>
      </div>
    </div>
  );
}
