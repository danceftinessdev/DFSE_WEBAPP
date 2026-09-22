"use client";
import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/button/Button";
import Alert from "@/components/ui/alert/Alert";
import Label from "@/components/form/Label";
import Checkbox from "@/components/form/input/Checkbox";
import MemberForm, { emptyMemberInput } from "../MemberForm";
import { createMember } from "../actions";

interface NewMemberFormProps {
  groups: { id: string; name: string }[];
}

/** Új tag felvételi űrlap (önálló oldal, nem popup). */
export default function NewMemberForm({ groups }: NewMemberFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ variant: "success" | "error"; message: string } | null>(null);
  const [form, setForm] = useState(emptyMemberInput);
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());

  const handleCreate = () => {
    if (!form.full_name.trim()) {
      setFeedback({ variant: "error", message: "A tag neve kötelező." });
      return;
    }
    setFeedback(null);
    startTransition(async () => {
      const result = await createMember(form, Array.from(selectedGroups));
      if (result.success) {
        router.push(result.data?.id ? `/admin/tagok/${result.data.id}` : "/admin/tagok");
      } else {
        setFeedback({ variant: "error", message: result.error ?? "Ismeretlen hiba történt." });
      }
    });
  };

  return (
    <div className="space-y-6">
      {feedback && <Alert variant={feedback.variant} title="Hiba" message={feedback.message} />}

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <MemberForm value={form} onChange={setForm} disabled={isPending} />
        {groups.length > 0 && (
          <div className="mt-4">
            <Label>Csoportbeosztás</Label>
            <div className="mt-1 flex flex-wrap gap-3">
              {groups.map((g) => (
                <Checkbox
                  key={g.id}
                  label={g.name}
                  checked={selectedGroups.has(g.id)}
                  disabled={isPending}
                  onChange={() =>
                    setSelectedGroups((prev) => {
                      const next = new Set(prev);
                      if (next.has(g.id)) next.delete(g.id);
                      else next.add(g.id);
                      return next;
                    })
                  }
                />
              ))}
            </div>
          </div>
        )}
        <div className="mt-6 flex items-center justify-end gap-3">
          <Button variant="outline" size="sm" onClick={() => router.push("/admin/tagok")} disabled={isPending}>
            Mégsem
          </Button>
          <Button size="sm" onClick={handleCreate} disabled={isPending}>
            {isPending ? "Mentés…" : "Mentés"}
          </Button>
        </div>
      </div>
    </div>
  );
}
