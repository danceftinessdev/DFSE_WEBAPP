"use client";
import React, { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import Alert from "@/components/ui/alert/Alert";
import Input from "@/components/form/input/InputField";
import Checkbox from "@/components/form/input/Checkbox";
import Label from "@/components/form/Label";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import MemberForm from "../MemberForm";
import {
  addMemberPayment,
  deleteMember,
  deleteMemberPayment,
  setMemberGroups,
  setPaymentPaid,
  updateMember,
  type MemberInput,
} from "../actions";
import { formatDateHu, formatForint, todayInputValue } from "@/lib/utils/format";
import { TrashBinIcon } from "@/icons";
import type { Member, MemberPayment } from "@/types/database.coach.types";

export interface MemberCompPaymentItem {
  id: string;
  competition_id: string;
  competition_name: string;
  competition_date: string | null;
  entry_fee_amount: number;
  entry_fee_paid: boolean;
  travel_fee_amount: number;
  travel_fee_paid: boolean;
}

export interface MemberAttendanceItem {
  id: string;
  session_date: string;
  status: string;
  class_name: string;
}

export interface MemberChoreoItem {
  id: string;
  name: string;
  type: string | null;
}

export interface MemberCompetitionItem {
  id: string;
  name: string;
  starts_at: string;
  location: string | null;
}

interface MemberDetailProps {
  member: Member;
  groups: { id: string; name: string }[];
  profiles: { id: string; display_name: string | null; email: string }[];
  initialGroupIds: string[];
  payments: MemberPayment[];
  compPayments: MemberCompPaymentItem[];
  attendance: MemberAttendanceItem[];
  choreographies: MemberChoreoItem[];
  competitions: MemberCompetitionItem[];
  canViewPayments: boolean;
  canManageMembers: boolean;
}

const TABS = [
  { id: "adatok", label: "Adatok" },
  { id: "befizetesek", label: "Befizetések" },
  { id: "jelenlet", label: "Jelenlét (90 nap)" },
  { id: "koreok", label: "Koreográfiák" },
  { id: "versenyek", label: "Versenyek" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function MemberDetail({
  member,
  groups,
  profiles,
  initialGroupIds,
  payments,
  compPayments,
  attendance,
  choreographies,
  competitions,
  canViewPayments,
  canManageMembers,
}: MemberDetailProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<TabId>("adatok");
  const [feedback, setFeedback] = useState<{ variant: "success" | "error"; message: string } | null>(null);

  const [form, setForm] = useState<MemberInput>({
    profile_id: member.profile_id,
    full_name: member.full_name,
    birth_date: member.birth_date,
    gender: member.gender,
    guardian_name: member.guardian_name,
    guardian_phone: member.guardian_phone,
    email: member.email,
    phone: member.phone,
    city: member.city,
    address: member.address,
    status: member.status,
    notes: member.notes,
    license_expiry: member.license_expiry,
    medical_expiry: member.medical_expiry,
  });
  const [groupIds, setGroupIds] = useState<Set<string>>(new Set(initialGroupIds));

  const [paymentForm, setPaymentForm] = useState({
    title: "",
    amount: "13000",
    due_date: todayInputValue(),
  });

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [paymentDeleteTarget, setPaymentDeleteTarget] = useState<MemberPayment | null>(null);

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

  const attendanceStats = useMemo(() => {
    const present = attendance.filter((a) => a.status === "present").length;
    return { present, total: attendance.length };
  }, [attendance]);

  const groupsChanged =
    groupIds.size !== initialGroupIds.length ||
    initialGroupIds.some((g) => !groupIds.has(g));

  const handleSaveProfile = () => {
    run(async () => {
      const result = await updateMember(member.id, form);
      if (!result.success) return result;
      if (groupsChanged) {
        const groupResult = await setMemberGroups(member.id, Array.from(groupIds));
        if (!groupResult.success) return groupResult;
      }
      return result;
    }, "Tag adatai elmentve.");
  };

  const handleAddPayment = () => {
    const amount = Number(paymentForm.amount);
    run(
      () =>
        addMemberPayment(member.id, {
          title: paymentForm.title,
          amount: Number.isFinite(amount) ? amount : 0,
          due_date: paymentForm.due_date,
        }),
      "Befizetés rögzítve."
    );
    setPaymentForm({ title: "", amount: "13000", due_date: todayInputValue() });
  };

  return (
    <div className="space-y-6">
      {feedback && (
        <Alert
          variant={feedback.variant}
          title={feedback.variant === "success" ? "Sikeres művelet" : "Hiba"}
          message={feedback.message}
        />
      )}

      {/* Fejléc kártya */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              {member.full_name}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {member.city} {member.phone ? `· ${member.phone}` : ""} {member.email ? `· ${member.email}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge
              variant="light"
              color={member.status === "active" ? "success" : member.status === "pending" ? "warning" : "light"}
            >
              {member.status === "active" ? "Aktív" : member.status === "pending" ? "Függőben" : "Inaktív"}
            </Badge>
            {canManageMembers && <Button variant="outline" size="sm" onClick={() => setDeleteOpen(true)}><span className="flex items-center gap-2 text-error-500"><TrashBinIcon className="h-4 w-4" /> Törlés</span></Button>}
          </div>
        </div>

        {/* Tabok */}
        <div className="mt-5 flex flex-wrap gap-2 border-t border-gray-100 pt-4 dark:border-gray-800">
          {TABS.filter((tab) => tab.id !== "befizetesek" || canViewPayments).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                activeTab === tab.id
                  ? "bg-brand-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-white/[0.05] dark:text-gray-400 dark:hover:bg-white/[0.08]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Adatok */}
      {activeTab === "adatok" && (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
          <MemberForm value={form} onChange={setForm} profiles={profiles} disabled={isPending || !canManageMembers} />
          {groups.length > 0 && (
            <div className="mt-4">
              <Label>Csoportbeosztás</Label>
              <div className="mt-1 flex flex-wrap gap-3">
                {groups.map((g) => (
                  <Checkbox
                    key={g.id}
                    label={g.name}
                    checked={groupIds.has(g.id)}
                    disabled={isPending || !canManageMembers}
                    onChange={() =>
                      setGroupIds((prev) => {
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
          <div className="mt-6 flex justify-end">
            {canManageMembers && <Button size="sm" onClick={handleSaveProfile} disabled={isPending}>
              {isPending ? "Mentés…" : "Mentés"}
            </Button>}
          </div>
        </div>
      )}

      {/* Befizetések */}
      {activeTab === "befizetesek" && canViewPayments && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
            <h4 className="mb-4 font-medium text-gray-800 dark:text-white/90">Új befizetés kiírása</h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
              <div className="sm:col-span-2">
                <Label htmlFor="pay-title">Megnevezés *</Label>
                <Input
                  id="pay-title"
                  placeholder="pl. Szeptemberi tagdíj"
                  value={paymentForm.title}
                  onChange={(e) => setPaymentForm({ ...paymentForm, title: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="pay-amount">Összeg (Ft) *</Label>
                <Input
                  id="pay-amount"
                  type="number"
                  min="0"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="pay-due">Határidő *</Label>
                <Input
                  id="pay-due"
                  type="date"
                  value={paymentForm.due_date}
                  onChange={(e) => setPaymentForm({ ...paymentForm, due_date: e.target.value })}
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button size="sm" onClick={handleAddPayment} disabled={isPending}>
                Kiírás
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
            <h4 className="mb-4 font-medium text-gray-800 dark:text-white/90">Befizetések</h4>
            {payments.length === 0 && compPayments.length === 0 && (
              <p className="text-sm text-gray-500">Még nincs rögzített befizetés.</p>
            )}
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {payments.map((p) => (
                <li key={p.id} className="flex flex-wrap items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">{p.title}</p>
                    <p className="text-xs text-gray-500">
                      Határidő: {formatDateHu(p.due_date)}
                      {p.is_paid && p.paid_at ? ` · Fizetve: ${formatDateHu(p.paid_at)}` : ""}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {formatForint(p.amount)}
                  </span>
                  <Badge variant="light" color={p.is_paid ? "success" : "error"} size="sm">
                    {p.is_paid ? "Fizetve" : "Tartozás"}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isPending}
                    onClick={() =>
                      run(
                        () => setPaymentPaid(p.id, !p.is_paid),
                        p.is_paid ? "Befizetés visszanyitva." : "Befizetés törlesztve."
                      )
                    }
                  >
                    {p.is_paid ? "Visszanyitás" : "Törlesztés"}
                  </Button>
                  <button
                    onClick={() => setPaymentDeleteTarget(p)}
                    className="rounded-lg p-2 text-gray-400 transition hover:bg-error-50 hover:text-error-500 dark:hover:bg-error-500/10"
                    title="Befizetés törlése"
                  >
                    <TrashBinIcon className="h-4 w-4" />
                  </button>
                </li>
              ))}
              {compPayments.map((cp) => (
                <li key={cp.id} className="flex flex-wrap items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/admin/versenyek/${cp.competition_id}`}
                      className="text-sm font-medium text-brand-500 hover:text-brand-600"
                    >
                      {cp.competition_name}
                    </Link>
                    <p className="text-xs text-gray-500">
                      {cp.competition_date ? formatDateHu(cp.competition_date) : ""}
                    </p>
                  </div>
                  {cp.entry_fee_amount > 0 && (
                    <Badge variant="light" color={cp.entry_fee_paid ? "success" : "error"} size="sm">
                      Nevezés: {formatForint(cp.entry_fee_amount)} {cp.entry_fee_paid ? "✓" : ""}
                    </Badge>
                  )}
                  {cp.travel_fee_amount > 0 && (
                    <Badge variant="light" color={cp.travel_fee_paid ? "success" : "error"} size="sm">
                      Utazás: {formatForint(cp.travel_fee_amount)} {cp.travel_fee_paid ? "✓" : ""}
                    </Badge>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Jelenlét */}
      {activeTab === "jelenlet" && (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h4 className="font-medium text-gray-800 dark:text-white/90">Jelenlét – utolsó 90 nap</h4>
            <Badge variant="light" color="primary">
              {attendanceStats.present} / {attendanceStats.total} alkalom
            </Badge>
          </div>
          {attendance.length === 0 ? (
            <p className="text-sm text-gray-500">Nincs jelenléti adat az elmúlt 90 napban.</p>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {attendance.map((a) => (
                <li key={a.id} className="flex items-center gap-3 py-2.5">
                  <span className="w-28 text-sm text-gray-500">{formatDateHu(a.session_date)}</span>
                  <span className="flex-1 text-sm text-gray-800 dark:text-white/90">{a.class_name}</span>
                  <Badge
                    variant="light"
                    size="sm"
                    color={
                      a.status === "present" ? "success" : a.status === "excused" ? "warning" : "error"
                    }
                  >
                    {a.status === "present" ? "Jelen" : a.status === "excused" ? "Igazolt" : "Hiányzott"}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Koreográfiák */}
      {activeTab === "koreok" && (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
          {choreographies.length === 0 ? (
            <p className="text-sm text-gray-500">A tag nincs hozzárendelve egy koreográfiához sem.</p>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {choreographies.map((c) => (
                <li key={c.id} className="flex items-center gap-3 py-2.5">
                  <Link
                    href={`/admin/koreok/${c.id}`}
                    className="flex-1 text-sm font-medium text-brand-500 hover:text-brand-600"
                  >
                    {c.name}
                  </Link>
                  {c.type && (
                    <Badge variant="light" color="primary" size="sm">
                      {c.type}
                    </Badge>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Versenyek */}
      {activeTab === "versenyek" && (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
          {competitions.length === 0 ? (
            <p className="text-sm text-gray-500">A tag nem szerepel egy versenyen sem.</p>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {competitions.map((c) => (
                <li key={c.id} className="flex items-center gap-3 py-2.5">
                  <Link
                    href={`/admin/versenyek/${c.id}`}
                    className="flex-1 text-sm font-medium text-brand-500 hover:text-brand-600"
                  >
                    {c.name}
                  </Link>
                  <span className="text-sm text-gray-500">{formatDateHu(c.starts_at)}</span>
                  {c.location && (
                    <Badge variant="light" color="light" size="sm">
                      {c.location}
                    </Badge>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Tag törlése */}
      <ConfirmDialog
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        loading={isPending}
        title="Tag törlése"
        message={
          <>
            Biztosan törlöd <strong>{member.full_name}</strong> minden adatát? A művelet nem vonható
            vissza.
          </>
        }
        destructiveDetails={[
          "Csoportbeosztások, befizetések, versenyfizetések törlődnek.",
          "Jelenléti adatok és koreográfia-hozzárendelések törlődnek.",
        ]}
        onConfirm={() => {
          startTransition(async () => {
            const result = await deleteMember(member.id);
            if (result.success) {
              router.push("/admin/tagok");
              router.refresh();
            } else {
              setDeleteOpen(false);
              setFeedback({ variant: "error", message: result.error ?? "A törlés nem sikerült." });
            }
          });
        }}
      />

      {/* Befizetés törlése */}
      <ConfirmDialog
        isOpen={paymentDeleteTarget !== null}
        onClose={() => setPaymentDeleteTarget(null)}
        loading={isPending}
        title="Befizetés törlése"
        message={
          <>
            Törlöd a(z) <strong>{paymentDeleteTarget?.title}</strong> (
            {formatForint(paymentDeleteTarget?.amount ?? 0)}) tételt?
          </>
        }
        onConfirm={() => {
          if (!paymentDeleteTarget) return;
          run(() => deleteMemberPayment(paymentDeleteTarget.id), "Befizetés törölve.");
          setPaymentDeleteTarget(null);
        }}
      />
    </div>
  );
}
