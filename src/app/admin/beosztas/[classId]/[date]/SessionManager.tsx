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
import { saveSession, type AttendanceEntry } from "../../actions";
import { formatDateHu } from "@/lib/utils/format";
import { CheckLineIcon, CloseLineIcon, PlusIcon } from "@/icons";

interface SessionManagerProps {
  classId: string;
  date: string;
  klass: {
    id: string;
    name: string;
    start_time: string;
    end_time: string;
    location: string | null;
    coach_name: string | null;
  };
  enrolled: { id: string; full_name: string }[];
  allMembers: { id: string; full_name: string }[];
  session: {
    status: string;
    note: string | null;
    override_start_time: string | null;
    override_end_time: string | null;
    override_coach: string | null;
    override_location: string | null;
  } | null;
  initialAttendance: AttendanceEntry[];
}

type Status = "present" | "absent" | "excused";

const STATUS_LABELS: Record<Status, string> = {
  present: "Jelen",
  absent: "Hiányzik",
  excused: "Igazolt",
};

const STATUS_COLORS: Record<Status, string> = {
  present: "bg-success-500 text-white",
  absent: "bg-error-500 text-white",
  excused: "bg-warning-500 text-white",
};

const timeShort = (t: string | null | undefined) => (t ? t.slice(0, 5) : "");

export default function SessionManager({
  classId,
  date,
  klass,
  enrolled,
  allMembers,
  session,
  initialAttendance,
}: SessionManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ variant: "success" | "error"; message: string } | null>(null);

  const [sessionStatus, setSessionStatus] = useState<"held" | "cancelled">(
    session?.status === "cancelled" ? "cancelled" : "held"
  );
  const [note, setNote] = useState(session?.note ?? "");
  const [overrideStart, setOverrideStart] = useState(session?.override_start_time?.slice(0, 5) ?? "");
  const [overrideEnd, setOverrideEnd] = useState(session?.override_end_time?.slice(0, 5) ?? "");
  const [overrideCoach, setOverrideCoach] = useState(session?.override_coach ?? "");
  const [overrideLocation, setOverrideLocation] = useState(session?.override_location ?? "");

  // Jelenlét állapota: tag id → státusz; vendégek külön listában
  const [memberStatus, setMemberStatus] = useState<Record<string, Status>>(() => {
    const map: Record<string, Status> = {};
    for (const m of enrolled) map[m.id] = "present";
    for (const a of initialAttendance) {
      if (a.member_id) map[a.member_id] = a.status;
    }
    return map;
  });

  const [guests, setGuests] = useState<{ key: string; label: string; memberId: string | null; status: Status }[]>(
    () =>
      initialAttendance
        .filter((a) => !enrolled.some((m) => m.id === a.member_id))
        .map((a, i) => ({
          key: a.member_id ?? `guest-${i}-${a.guest_name ?? ""}`,
          label: a.member_id
            ? (allMembers.find((m) => m.id === a.member_id)?.full_name ?? a.guest_name ?? "Vendég")
            : (a.guest_name ?? "Vendég"),
          memberId: a.member_id ?? null,
          status: a.status,
        }))
  );
  const [guestName, setGuestName] = useState("");
  const [guestMemberId, setGuestMemberId] = useState("");

  const guestCandidates = useMemo(
    () =>
      allMembers.filter(
        (m) => !enrolled.some((e) => e.id === m.id) && !guests.some((g) => g.memberId === m.id)
      ),
    [allMembers, enrolled, guests]
  );

  const setAll = (status: Status) => {
    setMemberStatus((prev) => {
      const next = { ...prev };
      for (const m of enrolled) next[m.id] = status;
      return next;
    });
  };

  const presentCount = Object.values(memberStatus).filter((s) => s === "present").length;

  const addGuestByName = () => {
    const name = guestName.trim();
    if (!name) return;
    setGuests((prev) => [
      ...prev,
      { key: `guest-${Date.now()}`, label: name, memberId: null, status: "present" },
    ]);
    setGuestName("");
  };

  const addGuestMember = () => {
    if (!guestMemberId) return;
    const member = allMembers.find((m) => m.id === guestMemberId);
    if (!member) return;
    setGuests((prev) => [
      ...prev,
      { key: member.id, label: member.full_name, memberId: member.id, status: "present" },
    ]);
    setGuestMemberId("");
  };

  const handleSave = () => {
    setFeedback(null);
    const attendance: AttendanceEntry[] = [
      ...enrolled.map((m) => ({ member_id: m.id, status: memberStatus[m.id] ?? "absent" })),
      ...guests.map((g) => ({
        member_id: g.memberId,
        guest_name: g.memberId ? null : g.label,
        status: g.status,
      })),
    ];
    startTransition(async () => {
      const result = await saveSession(classId, date, {
        status: sessionStatus,
        note: note || null,
        override_start_time: overrideStart || null,
        override_end_time: overrideEnd || null,
        override_coach: overrideCoach || null,
        override_location: overrideLocation || null,
        attendance,
      });
      if (result.success) {
        setFeedback({ variant: "success", message: "Alkalom és jelenlét elmentve." });
        router.refresh();
      } else {
        setFeedback({ variant: "error", message: result.error ?? "Ismeretlen hiba történt." });
      }
    });
  };

  return (
    <div className="space-y-6">
      {feedback && (
        <Alert
          variant={feedback.variant}
          title={feedback.variant === "success" ? "Sikeres mentés" : "Hiba"}
          message={feedback.message}
        />
      )}

      {/* Fejléc + státusz */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">{klass.name}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {formatDateHu(date)} · {timeShort(klass.start_time)} – {timeShort(klass.end_time)}
              {klass.location ? ` · ${klass.location}` : ""}
              {klass.coach_name ? ` · ${klass.coach_name}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSessionStatus("held")}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                sessionStatus === "held"
                  ? "bg-success-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-white/[0.05] dark:text-gray-400"
              }`}
            >
              <CheckLineIcon className="h-4 w-4" /> Megtartva
            </button>
            <button
              onClick={() => setSessionStatus("cancelled")}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                sessionStatus === "cancelled"
                  ? "bg-error-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-white/[0.05] dark:text-gray-400"
              }`}
            >
              <CloseLineIcon className="h-4 w-4" /> Elmarad
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Jelenlét */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6 xl:col-span-2">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h4 className="font-medium text-gray-800 dark:text-white/90">
              Jelenléti ív{" "}
              <span className="text-sm font-normal text-gray-500">
                ({presentCount}/{enrolled.length} jelen)
              </span>
            </h4>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setAll("present")}>
                Mindenki jelen
              </Button>
              <Button variant="outline" size="sm" onClick={() => setAll("absent")}>
                Mindenki hiányzik
              </Button>
            </div>
          </div>

          {enrolled.length === 0 ? (
            <p className="text-sm text-gray-500">
              Ehhez az órához nincsenek beosztott tagok. A beosztást az óra szerkesztésénél tudod
              módosítani.
            </p>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {enrolled.map((m) => (
                <li key={m.id} className="flex flex-wrap items-center gap-3 py-2.5">
                  <span className="flex-1 text-sm font-medium text-gray-800 dark:text-white/90">
                    {m.full_name}
                  </span>
                  <div className="flex gap-1">
                    {(["present", "absent", "excused"] as Status[]).map((s) => (
                      <button
                        key={s}
                        onClick={() => setMemberStatus((prev) => ({ ...prev, [m.id]: s }))}
                        className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                          memberStatus[m.id] === s
                            ? STATUS_COLORS[s]
                            : "bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-white/[0.05] dark:text-gray-400"
                        }`}
                      >
                        {STATUS_LABELS[s]}
                      </button>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* Vendégek */}
          <div className="mt-6 border-t border-gray-100 pt-4 dark:border-gray-800">
            <h5 className="mb-3 text-sm font-medium text-gray-800 dark:text-white/90">Vendégek</h5>
            {guests.length > 0 && (
              <ul className="mb-3 space-y-2">
                {guests.map((g) => (
                  <li key={g.key} className="flex flex-wrap items-center gap-2">
                    <Badge variant="light" color="info" size="sm">
                      Vendég
                    </Badge>
                    <span className="flex-1 text-sm text-gray-800 dark:text-white/90">{g.label}</span>
                    <div className="flex gap-1">
                      {(["present", "absent", "excused"] as Status[]).map((s) => (
                        <button
                          key={s}
                          onClick={() =>
                            setGuests((prev) =>
                              prev.map((x) => (x.key === g.key ? { ...x, status: s } : x))
                            )
                          }
                          className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                            g.status === s
                              ? STATUS_COLORS[s]
                              : "bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-white/[0.05] dark:text-gray-400"
                          }`}
                        >
                          {STATUS_LABELS[s]}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => setGuests((prev) => prev.filter((x) => x.key !== g.key))}
                      className="rounded-lg p-1.5 text-gray-400 transition hover:bg-error-50 hover:text-error-500 dark:hover:bg-error-500/10"
                      title="Eltávolítás"
                    >
                      <CloseLineIcon className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Vendég neve…"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                />
                <Button variant="outline" size="sm" onClick={addGuestByName} disabled={!guestName.trim()}>
                  <PlusIcon className="h-4 w-4" />
                </Button>
              </div>
              {guestCandidates.length > 0 && (
                <div className="flex gap-2">
                  <select
                    className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                    value={guestMemberId}
                    onChange={(e) => setGuestMemberId(e.target.value)}
                  >
                    <option value="">Meglévő tag hozzáadása…</option>
                    {guestCandidates.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.full_name}
                      </option>
                    ))}
                  </select>
                  <Button variant="outline" size="sm" onClick={addGuestMember} disabled={!guestMemberId}>
                    <PlusIcon className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Felülírások + megjegyzés */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
            <h4 className="mb-4 font-medium text-gray-800 dark:text-white/90">
              Alkalom felülírásai
            </h4>
            <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">
              Csak ezen az egy napon érvényesek. Ha üresen hagyod, az alapértelmezett érték marad.
            </p>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="ov-start">Kezdés</Label>
                  <Input
                    id="ov-start"
                    type="time"
                    value={overrideStart}
                    onChange={(e) => setOverrideStart(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="ov-end">Befejezés</Label>
                  <Input
                    id="ov-end"
                    type="time"
                    value={overrideEnd}
                    onChange={(e) => setOverrideEnd(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="ov-coach">Edző</Label>
                <Input
                  id="ov-coach"
                  placeholder={klass.coach_name ?? "Helyettes edző…"}
                  value={overrideCoach}
                  onChange={(e) => setOverrideCoach(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="ov-location">Helyszín</Label>
                <Input
                  id="ov-location"
                  placeholder={klass.location ?? "Eltérő helyszín…"}
                  value={overrideLocation}
                  onChange={(e) => setOverrideLocation(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
            <h4 className="mb-4 font-medium text-gray-800 dark:text-white/90">Megjegyzés</h4>
            <TextArea
              placeholder="pl. Felszerelést hozni, fotózás lesz…"
              value={note}
              onChange={setNote}
            />
          </div>
        </div>
      </div>

      {/* Mentés */}
      <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
        <Link href="/admin/beosztas" className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400">
          ← Vissza a beosztáshoz
        </Link>
        <Button size="sm" onClick={handleSave} disabled={isPending}>
          {isPending ? "Mentés…" : "Alkalom mentése"}
        </Button>
      </div>
    </div>
  );
}
