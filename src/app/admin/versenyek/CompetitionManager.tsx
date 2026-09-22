"use client";
import React, { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import Alert from "@/components/ui/alert/Alert";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { deleteCompetition } from "./actions";
import { formatDateHu, toDateInputValue } from "@/lib/utils/format";
import { ChevronLeftIcon, PencilIcon, PlusIcon, TrashBinIcon } from "@/icons";
import type { Competition } from "@/types/database.coach.types";

interface CompetitionManagerProps {
  competitions: Competition[];
}

const HUNGARIAN_MONTHS = [
  "Január", "Február", "Március", "Április", "Május", "Június",
  "Július", "Augusztus", "Szeptember", "Október", "November", "December",
];

export default function CompetitionManager({ competitions }: CompetitionManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ variant: "success" | "error"; message: string } | null>(null);

  const [month, setMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const [deleteTarget, setDeleteTarget] = useState<Competition | null>(null);

  const calendarCells = useMemo(() => {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    const firstDay = new Date(year, monthIndex, 1);
    const startOffset = (firstDay.getDay() + 6) % 7; // hétfő = 0
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const cells: ({ date: Date; inMonth: boolean } | null)[] = [];
    for (let i = 0; i < startOffset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push({ date: new Date(year, monthIndex, d), inMonth: true });
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [month]);

  const competitionsForDay = (date: Date) => {
    const day = toDateInputValue(date);
    return competitions.filter((c) => {
      const start = c.starts_at.slice(0, 10);
      const end = c.ends_at ? c.ends_at.slice(0, 10) : start;
      return start <= day && day <= end;
    });
  };

  const monthCompetitions = useMemo(() => {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    const monthStart = toDateInputValue(new Date(year, monthIndex, 1));
    const monthEnd = toDateInputValue(new Date(year, monthIndex + 1, 0));
    return competitions.filter((c) => {
      const start = c.starts_at.slice(0, 10);
      const end = c.ends_at ? c.ends_at.slice(0, 10) : start;
      return start <= monthEnd && end >= monthStart;
    });
  }, [competitions, month]);

  const navigateMonth = (offset: number) => {
    setMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
  };

  const run = (
    fn: () => Promise<{ success: boolean; error?: string; data?: { id: string } }>,
    successMessage: string,
    navigateToId?: boolean
  ) => {
    setFeedback(null);
    startTransition(async () => {
      const result = await fn();
      if (result.success) {
        setFeedback({ variant: "success", message: successMessage });
        router.refresh();
        if (navigateToId && result.data?.id) {
          router.push(`/admin/versenyek/${result.data.id}`);
        }
      } else {
        setFeedback({ variant: "error", message: result.error ?? "Ismeretlen hiba történt." });
      }
    });
  };

  const today = toDateInputValue(new Date());

  return (
    <div className="space-y-6">
      {feedback && (
        <Alert
          variant={feedback.variant}
          title={feedback.variant === "success" ? "Sikeres művelet" : "Hiba"}
          message={feedback.message}
        />
      )}

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        {/* Hónap navigáció */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateMonth(-1)}
              className="rounded-lg border border-gray-300 p-2 text-gray-500 transition hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-white/[0.05]"
              title="Előző hónap"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <button
              onClick={() => navigateMonth(1)}
              className="rounded-lg border border-gray-300 p-2 text-gray-500 transition hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-white/[0.05]"
              title="Következő hónap"
            >
              <ChevronLeftIcon className="h-5 w-5 rotate-180" />
            </button>
            <h3 className="ml-2 text-base font-semibold text-gray-800 dark:text-white/90">
              {month.getFullYear()}. {HUNGARIAN_MONTHS[month.getMonth()]}
            </h3>
          </div>
          <Button
            size="sm"
            startIcon={<PlusIcon className="h-4 w-4" />}
            onClick={() => router.push("/admin/versenyek/uj")}
          >
            Új verseny
          </Button>
        </div>

        {/* Naptár rács */}
        <div className="grid grid-cols-7 gap-1">
          {["H", "K", "Sze", "Cs", "P", "Szo", "V"].map((d) => (
            <div
              key={d}
              className="py-2 text-center text-xs font-semibold uppercase text-gray-400"
            >
              {d}
            </div>
          ))}
          {calendarCells.map((cell, i) => {
            if (!cell) return <div key={`empty-${i}`} className="min-h-[72px]" />;
            const dateStr = toDateInputValue(cell.date);
            const dayComps = competitionsForDay(cell.date);
            return (
              <button
                key={dateStr}
                onClick={() => router.push(`/admin/versenyek/uj?datum=${dateStr}`)}
                className={`min-h-[72px] rounded-lg border p-1.5 text-left align-top transition hover:border-brand-300 dark:hover:border-brand-500/50 ${
                  dateStr === today
                    ? "border-brand-300 bg-brand-50/60 dark:border-brand-500/40 dark:bg-brand-500/[0.08]"
                    : "border-gray-100 dark:border-gray-800"
                }`}
                title="Új verseny ezen a napon"
              >
                <span
                  className={`text-xs ${dateStr === today ? "font-bold text-brand-500" : "text-gray-400"}`}
                >
                  {cell.date.getDate()}
                </span>
                <div className="mt-1 space-y-1">
                  {dayComps.slice(0, 2).map((c) => (
                    <Link
                      key={c.id}
                      href={`/admin/versenyek/${c.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="block truncate rounded bg-brand-500/10 px-1.5 py-0.5 text-[11px] font-medium text-brand-600 hover:bg-brand-500/20 dark:text-brand-400"
                    >
                      {c.is_public ? "" : "🔒 "}
                      {c.name}
                    </Link>
                  ))}
                  {dayComps.length > 2 && (
                    <span className="block px-1 text-[10px] text-gray-400">
                      +{dayComps.length - 2} további
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Havi lista */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <h4 className="mb-4 font-medium text-gray-800 dark:text-white/90">
          Versenyek ebben a hónapban
        </h4>
        {monthCompetitions.length === 0 ? (
          <p className="text-sm text-gray-500">
            Ebben a hónapban nincs verseny. Kattints egy napra a naptárban vagy az „Új verseny”
            gombra a létrehozáshoz.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {monthCompetitions.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/admin/versenyek/${c.id}`}
                    className="font-medium text-gray-800 hover:text-brand-500 dark:text-white/90"
                  >
                    {c.name}
                  </Link>
                  <p className="text-xs text-gray-500">
                    {formatDateHu(c.starts_at)}
                    {c.ends_at && c.ends_at.slice(0, 10) !== c.starts_at.slice(0, 10)
                      ? ` – ${formatDateHu(c.ends_at)}`
                      : ""}
                    {c.location ? ` · ${c.location}` : ""}
                  </p>
                </div>
                {c.type && (
                  <Badge variant="light" color="primary" size="sm">
                    {c.type}
                  </Badge>
                )}
                {!c.is_public && (
                  <Badge variant="light" color="warning" size="sm">
                    Privát
                  </Badge>
                )}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => router.push(`/admin/versenyek/${c.id}`)}
                    className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-brand-500 dark:hover:bg-white/[0.05]"
                    title="Szerkesztés"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(c)}
                    className="rounded-lg p-2 text-gray-400 transition hover:bg-error-50 hover:text-error-500 dark:hover:bg-error-500/10"
                    title="Törlés"
                  >
                    <TrashBinIcon className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        loading={isPending}
        title="Verseny törlése"
        message={
          <>
            Biztosan törlöd a(z) <strong>{deleteTarget?.name}</strong> versenyt? A művelet nem
            vonható vissza.
          </>
        }
        destructiveDetails={[
          "A verseny összes nevezése törlődik.",
          "A versenyhez tartozó fizetési adatok törlődnek.",
          "Az utazási járművek és utaslisták törlődnek.",
          "A versenyhez kapcsolt koreográfiák megmaradnak, csak leválasztódnak.",
        ]}
        onConfirm={() => {
          if (!deleteTarget) return;
          run(() => deleteCompetition(deleteTarget.id), "Verseny törölve.");
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}
