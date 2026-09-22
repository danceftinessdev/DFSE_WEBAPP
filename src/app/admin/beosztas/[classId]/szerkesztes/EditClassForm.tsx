"use client";
import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Alert from "@/components/ui/alert/Alert";
import ClassForm, { type ClassFormInitial } from "../../ClassForm";
import { updateClass, type ClassInput } from "../../actions";

interface EditClassFormProps {
  classId: string;
  initial: ClassFormInitial;
  members: { id: string; full_name: string }[];
  groups: { id: string; name: string }[];
}

/** Óra szerkesztő űrlap (önálló oldal, nem popup). */
export default function EditClassForm({ classId, initial, members, groups }: EditClassFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ variant: "success" | "error"; message: string } | null>(null);

  const handleSubmit = (input: ClassInput, memberIds: string[]) => {
    setFeedback(null);
    startTransition(async () => {
      const result = await updateClass(classId, input, memberIds);
      if (result.success) {
        router.push("/admin/beosztas");
      } else {
        setFeedback({ variant: "error", message: result.error ?? "Ismeretlen hiba történt." });
      }
    });
  };

  return (
    <div className="space-y-6">
      {feedback && <Alert variant={feedback.variant} title="Hiba" message={feedback.message} />}
      <ClassForm
        onCancel={() => router.push("/admin/beosztas")}
        onSubmit={handleSubmit}
        loading={isPending}
        groups={groups}
        members={members}
        initial={initial}
      />
    </div>
  );
}
