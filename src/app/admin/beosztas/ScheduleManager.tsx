"use client";
import React, { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import Alert from "@/components/ui/alert/Alert";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { deleteClass } from "./actions";
import {
  HUNGARIAN_DAYS_SHORT,
  addDays,
  formatDateShortHu,
  startOfWeekMonday,
  toDateInputValue,
  todayInputValue,
} from "@/lib/utils/format";
import { ChevronLeftIcon, PencilIcon, PlusIcon, TrashBinIcon } from "@/icons";

export interface ScheduleClass {
  id: string;
  name: string;
  class_type: "weekly" | "single";
  day_of_week: number | null;
  specific_date: string | null;
  start_time: string;
  end_time: string;
  location: string | null;
  coach_name: string | null;
  description: string | null;
  group_id: string | null;
  memberIds: string[];
}

export interface SessionOverride {
  class_id: string;
  session_date: string;
  status: "held" | "cancelled";
  note: string | null;
  override_start_time: string | null;
  override_end_time: string | null;
  override_coach: string | null;
  override_location: string | null;
}

interface ScheduleManagerProps {
  classes: ScheduleClass[];
  sessions: SessionOverride[];
  weekStart: string; // YYYY-MM-DD (hétfő)
}

const timeShort = (t: string | null) => (t ? t.slice(0, 5) : "");

export default function ScheduleManager({
  classes,
  sessions,
  weekStart,
}: ScheduleManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ variant: "success" | "error"; message: string } | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<ScheduleClass | null>(null);

  const weekStartDate = useMemo(() => new Date(`${weekStart}T00:00:00`), [weekStart]);
  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStartDate, i)),
    [weekStartDate]
  );

  const sessionMap = useMemo(() => {
    const map = new Map<string, SessionOverride>();
    for (const s of sessions) map.set(`${s.class_id}|${s.session_date}`, s);
    return map;
  }, [sessions]);

  const classesForDay = (date: Date) => {
    const dateStr = toDateInputValue(date);
    const dayIndex = (date.getDay() + 6) % 7;
    return classes.filter((c) =>
      c.class_type === "weekly" ? c.day_of_week === dayIndex : c.specific_date === dateStr
    );
  };

  const navigateWeek = (offset: number | "today") => {
    const base =
      offset === "today" ? new Date() : addDays(weekStartDate, offset * 7);
    const monday = startOfWeekMonday(base);
    router.push(`/admin/beosztas?het=${toDateInputValue(monday)}`);
  };

  const run = (fn: () => Promise<{ success: boolean; error?: string }>, successMessage: string) => {
    setFeedback(null);
    startTransition(async () => {
      const result = await fn();
      if (result.success) {
        setFeedback({ variant: "success", message: successMessage });
        router.refresh();
      } else {
        setFeedback({ variant: "error", message: result.error ?? "Ismeretlen hiba történt." });
      }
    });
  };

  const today = todayInputValue();

  return (
    <div className="space-y-6">
      {feedback && (
        <Alert
          variant={feedback.variant}
          title={feedback.variant === "success" ? "Sikeres művelet" : "Hiba"}
          message={feedback.message}
        />
      )}

      {/* Hét navigáció */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigateWeek(-1)}
            className="rounded-lg border border-gray-300 p-2 text-gray-500 transition hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-white/[0.05]"
            title="Előző hét"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => navigateWeek(1)}
            className="rounded-lg border border-gray-300 p-2 text-gray-500 transition hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-white/[0.05]"
            title="Következő hét"
          >
            <ChevronLeftIcon className="h-5 w-5 rotate-180" />
          </button>
          <Button variant="outline" size="sm" onClick={() => navigateWeek("today")}>
            Ma
          </Button>
          <h3 className="ml-2 text-base font-semibold text-gray-800 dark:text-white/90">
            {formatDateShortHu(days[0])} – {formatDateShortHu(days[6])}
          </h3>
        </div>
        <Button
          size="sm"
          startIcon={<PlusIcon className="h-4 w-4" />}
          onClick={() => router.push("/admin/beosztas/uj")}
        >
          Új óra
        </Button>
      </div>

      {/* Heti rács */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        {days.map((day, i) => {
          const dateStr = toDateInputValue(day);
          const dayClasses = classesForDay(day);
          const isToday = dateStr === today;
          return (
            <div
              key={dateStr}
              className={`min-h-[140px] rounded-2xl border p-3 ${
                isToday
                  ? "border-brand-300 bg-brand-50/50 dark:border-brand-500/40 dark:bg-brand-500/[0.06]"
                  : "border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]"
              }`}
            >
              <div className="mb-2 flex items-center justify-between">
                <span
                  className={`text-xs font-semibold uppercase ${
                    isToday ? "text-brand-500" : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {HUNGARIAN_DAYS_SHORT[i]}
                </span>
                <span
                  className={`text-xs ${isToday ? "font-bold text-brand-500" : "text-gray-400"}`}
                >
                  {formatDateShortHu(day)}
                </span>
              </div>
              <div className="space-y-2">
                {dayClasses.length === 0 && (
                  <p className="pt-2 text-center text-xs text-gray-300 dark:text-gray-600">–</p>
                )}
                {dayClasses.map((c) => {
                  const session = sessionMap.get(`${c.id}|${dateStr}`);
                  const cancelled = session?.status === "cancelled";
                  const start = session?.override_start_time ?? c.start_time;
                  const end = session?.override_end_time ?? c.end_time;
                  return (
                    <div
                      key={c.id}
                      className={`group relative rounded-xl border p-2.5 transition ${
                        cancelled
                          ? "border-error-200 bg-error-50/60 dark:border-error-500/30 dark:bg-error-500/[0.08]"
                          : "border-gray-200 bg-gray-50 hover:border-brand-300 dark:border-gray-700 dark:bg-white/[0.03]"
                      }`}
                    >
                      <Link href={`/admin/beosztas/${c.id}/${dateStr}`} className="block">
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                          {timeShort(start)} – {timeShort(end)}
                        </p>
                        <p
                          className={`mt-0.5 text-sm font-medium ${
                            cancelled
                              ? "text-error-500 line-through"
                              : "text-gray-800 dark:text-white/90"
                          }`}
                        >
                          {c.name}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-gray-400">
                          {session?.override_coach ?? c.coach_name ?? ""}
                          {(session?.override_location ?? c.location)
                            ? ` · ${session?.override_location ?? c.location}`
                            : ""}
                        </p>
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {cancelled && (
                            <Badge variant="light" color="error" size="sm">
                              Elmarad
                            </Badge>
                          )}
                          {session?.status === "held" && (
                            <Badge variant="light" color="success" size="sm">
                              Megtartva
                            </Badge>
                          )}
                          <Badge variant="light" color="light" size="sm">
                            {c.memberIds.length} fő
                          </Badge>
                        </div>
                      </Link>
                      <div className="absolute right-1.5 top-1.5 hidden gap-1 group-hover:flex">
                        <button
                          onClick={() => router.push(`/admin/beosztas/${c.id}/szerkesztes`)}
                          className="rounded-md bg-white p-1 text-gray-400 shadow-sm transition hover:text-brand-500 dark:bg-gray-800"
                          title="Szerkesztés"
                        >
                          <PencilIcon className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(c)}
                          className="rounded-md bg-white p-1 text-gray-400 shadow-sm transition hover:text-error-500 dark:bg-gray-800"
                          title="Törlés"
                        >
                          <TrashBinIcon className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {classes.length === 0 && (
        <div className="rounded-2xl border border-dashed border-gray-300 p-10 text-center dark:border-gray-700">
          <p className="text-sm text-gray-500">
            Még nincs felvett óra. Hozd létre az elsőt az „Új óra” gombbal!
          </p>
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        loading={isPending}
        title="Óra törlése"
        message={
          <>
            Biztosan törlöd a(z) <strong>{deleteTarget?.name}</strong> órát? Az összes jövőbeli és
            múltbeli alkalmával együtt törlődik.
          </>
        }
        destructiveDetails={[
          "A résztvevői beosztások törlődnek.",
          "Az alkalmankénti státuszok és jelenléti ívek törlődnek.",
        ]}
        onConfirm={() => {
          if (!deleteTarget) return;
          run(() => deleteClass(deleteTarget.id), "Óra törölve.");
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}
