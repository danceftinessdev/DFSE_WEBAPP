"use client";
import React from "react";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import { AlertIcon } from "@/icons";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  /** Visszafordíthatatlan művelet esetén extra figyelmeztetés jelenik meg. */
  destructiveDetails?: string[];
}

/**
 * Egységes megerősítő dialógus törlésekhez és visszafordíthatatlan műveletekhez.
 */
export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Törlés",
  cancelLabel = "Mégsem",
  loading = false,
  destructiveDetails,
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={loading ? () => undefined : onClose} className="max-w-[500px] m-4">
      <div className="relative w-full max-w-[500px] rounded-3xl bg-white p-6 dark:bg-gray-900 lg:p-8">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-error-50 text-error-500 dark:bg-error-500/15">
            <AlertIcon className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h4 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white/90">
              {title}
            </h4>
            <div className="text-sm text-gray-500 dark:text-gray-400">{message}</div>
            {destructiveDetails && destructiveDetails.length > 0 && (
              <ul className="mt-3 list-disc space-y-1 rounded-lg bg-error-50 px-4 py-3 pl-8 text-xs text-error-700 dark:bg-error-500/10 dark:text-error-400">
                {destructiveDetails.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <div className="mt-6 flex items-center justify-end gap-3">
          <Button variant="outline" size="sm" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-error-500 px-4 py-3 text-sm font-medium text-white shadow-theme-xs transition hover:bg-error-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Folyamatban…" : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
