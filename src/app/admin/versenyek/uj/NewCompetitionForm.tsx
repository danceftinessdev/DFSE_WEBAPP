"use client";
import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Alert from "@/components/ui/alert/Alert";
import CompetitionForm from "../CompetitionForm";
import { createCompetition, type CompetitionInput } from "../actions";

interface NewCompetitionFormProps {
  defaultDate: string | null;
}

/** Új verseny létrehozó űrlap (önálló oldal, nem popup). */
export default function NewCompetitionForm({ defaultDate }: NewCompetitionFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ variant: "success" | "error"; message: string } | null>(null);

  const handleSubmit = (input: CompetitionInput) => {
    setFeedback(null);
    startTransition(async () => {
      const result = await createCompetition(input);
      if (result.success) {
        router.push(result.data?.id ? `/admin/versenyek/${result.data.id}` : "/admin/versenyek");
      } else {
        setFeedback({ variant: "error", message: result.error ?? "Ismeretlen hiba történt." });
      }
    });
  };

  return (
    <div className="space-y-6">
      {feedback && <Alert variant={feedback.variant} title="Hiba" message={feedback.message} />}
      <CompetitionForm
        onCancel={() => router.push("/admin/versenyek")}
        onSubmit={handleSubmit}
        loading={isPending}
        initial={null}
        defaultDate={defaultDate}
      />
    </div>
  );
}
