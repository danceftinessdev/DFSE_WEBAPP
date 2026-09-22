"use client";
import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Checkbox from "@/components/form/input/Checkbox";
import type { CompetitionPaymentInput } from "../actions";
import type { ParticipantPayment } from "./CompetitionDetail";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: CompetitionPaymentInput) => void;
  loading: boolean;
  memberName: string;
  suggestedEntryFee: number;
  initial?: ParticipantPayment | null;
}

/** Egy résztvevő versenyfizetéseinek (nevezési + utazási díj) beállítása. */
export default function PaymentModal(props: PaymentModalProps) {
  if (!props.isOpen) return null;
  return <PaymentFormContent {...props} />;
}

function PaymentFormContent({
  onClose,
  onSubmit,
  loading,
  memberName,
  suggestedEntryFee,
  initial,
}: PaymentModalProps) {
  const [form, setForm] = useState<CompetitionPaymentInput>({
    entry_fee_amount: initial?.entry_fee_amount ?? suggestedEntryFee,
    entry_fee_paid: initial?.entry_fee_paid ?? false,
    entry_fee_note: initial?.entry_fee_note ?? null,
    travel_fee_amount: initial?.travel_fee_amount ?? 0,
    travel_fee_paid: initial?.travel_fee_paid ?? false,
    travel_fee_note: initial?.travel_fee_note ?? null,
  });

  const set = <K extends keyof CompetitionPaymentInput>(key: K, v: CompetitionPaymentInput[K]) =>
    setForm((prev) => ({ ...prev, [key]: v }));

  return (
    <Modal isOpen onClose={onClose} className="max-w-[520px] m-4">
      <div className="relative w-full max-w-[520px] rounded-3xl bg-white p-6 dark:bg-gray-900 lg:p-8">
        <h4 className="mb-1 text-xl font-semibold text-gray-800 dark:text-white/90">Fizetések</h4>
        <p className="mb-5 text-sm text-gray-500 dark:text-gray-400">{memberName}</p>

        <div className="space-y-5">
          <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
            <div className="mb-3 flex items-center justify-between">
              <Label className="mb-0">Nevezési díj</Label>
              <Checkbox
                label="Befizetve"
                checked={form.entry_fee_paid}
                onChange={(v) => set("entry_fee_paid", v)}
                disabled={loading}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                type="number"
                min="0"
                value={String(form.entry_fee_amount)}
                onChange={(e) => set("entry_fee_amount", Number(e.target.value) || 0)}
                disabled={loading}
              />
              <Input
                placeholder="Megjegyzés"
                value={form.entry_fee_note ?? ""}
                onChange={(e) => set("entry_fee_note", e.target.value || null)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
            <div className="mb-3 flex items-center justify-between">
              <Label className="mb-0">Utazási díj</Label>
              <Checkbox
                label="Befizetve"
                checked={form.travel_fee_paid}
                onChange={(v) => set("travel_fee_paid", v)}
                disabled={loading}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                type="number"
                min="0"
                value={String(form.travel_fee_amount)}
                onChange={(e) => set("travel_fee_amount", Number(e.target.value) || 0)}
                disabled={loading}
              />
              <Input
                placeholder="Megjegyzés"
                value={form.travel_fee_note ?? ""}
                onChange={(e) => set("travel_fee_note", e.target.value || null)}
                disabled={loading}
              />
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <Button variant="outline" size="sm" onClick={onClose} disabled={loading}>
            Mégsem
          </Button>
          <Button size="sm" onClick={() => onSubmit(form)} disabled={loading}>
            {loading ? "Mentés…" : "Mentés"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
