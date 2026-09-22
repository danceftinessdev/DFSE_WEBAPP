"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import Badge from "@/components/ui/badge/Badge";
import Input from "@/components/form/input/InputField";
import { setPaymentPaid } from "../tagok/actions";
import { formatForint } from "@/lib/utils/format";

type Payment = {
  id: string;
  member_id: string;
  title: string;
  amount: number;
  due_date: string;
  is_paid: boolean;
  paid_at: string | null;
};

export interface PaymentMatrixMember {
  id: string;
  full_name: string;
  status: string;
  groupIds: string[];
  groupNames: string[];
  ageGroups: string[];
  classNames: string[];
  payments: Payment[];
}

type PaymentState = "paid" | "sessions" | "free" | "unpaid" | "unknown";

const MONTHS = ["Jan", "Feb", "Már", "Ápr", "Máj", "Jún", "Júl", "Aug", "Szep", "Okt", "Nov", "Dec"];
const MONTH_NAMES = ["Január", "Február", "Március", "Április", "Május", "Június", "Július", "Augusztus", "Szeptember", "Október", "November", "December"];

function monthKey(year: number, month: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

function stateFor(payments: Payment[]): PaymentState {
  if (payments.some((payment) => payment.is_paid)) return "paid";
  if (payments.some((payment) => /alkalom|alkalmi/i.test(payment.title))) return "sessions";
  if (payments.length > 0 && payments.every((payment) => payment.amount === 0)) return "free";
  if (payments.length > 0) return "unpaid";
  return "unknown";
}

const stateMeta: Record<PaymentState, { label: string; className: string }> = {
  paid: { label: "Fizetett", className: "border-success-200 bg-success-50 text-success-700 dark:border-success-500/20 dark:bg-success-500/10 dark:text-success-300" },
  sessions: { label: "Alkalmak", className: "border-warning-200 bg-warning-50 text-warning-700 dark:border-warning-500/20 dark:bg-warning-500/10 dark:text-warning-300" },
  free: { label: "Ingyenes", className: "border-gray-200 bg-gray-50 text-gray-600 dark:border-gray-700 dark:bg-white/[0.04] dark:text-gray-300" },
  unpaid: { label: "Nem fizetett", className: "border-error-200 bg-error-50 text-error-700 dark:border-error-500/20 dark:bg-error-500/10 dark:text-error-300" },
  unknown: { label: "?", className: "border-dashed border-gray-300 bg-white text-gray-400 dark:border-gray-700 dark:bg-transparent dark:text-gray-500" },
};

function PaymentCell({ payments, canManage, onToggle }: { payments: Payment[]; canManage: boolean; onToggle: (payment: Payment) => void }) {
  const state = stateFor(payments);
  const meta = stateMeta[state];
  const actionable = canManage && (state === "paid" || state === "unpaid");
  const payment = payments.find((item) => (state === "paid" ? item.is_paid : !item.is_paid));
  const total = payments.reduce((sum, item) => sum + item.amount, 0);

  return (
    <button
      type="button"
      disabled={!actionable || !payment}
      onClick={() => payment && onToggle(payment)}
      title={payment ? `${meta.label} · ${formatForint(total)}` : "Nincs rögzített tétel"}
      className={`flex min-h-12 w-full min-w-24 flex-col items-center justify-center rounded-lg border px-2 py-1 text-xs transition ${meta.className} ${actionable ? "cursor-pointer hover:brightness-95" : "cursor-default"}`}
    >
      <span className="font-semibold">{meta.label}</span>
      {payments.length > 0 && <span className="mt-0.5 text-[10px] opacity-75">{formatForint(total)}</span>}
    </button>
  );
}

interface Props {
  year: number;
  canManagePayments: boolean;
  members: PaymentMatrixMember[];
  groups: { id: string; name: string; age_group: string | null }[];
  classes: { id: string; name: string }[];
}

export default function PaymentMatrix({ year, canManagePayments, members, groups, classes }: Props) {
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [ageFilter, setAgeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState("");

  const ageGroups = useMemo(() => Array.from(new Set(groups.map((group) => group.age_group).filter(Boolean))) as string[], [groups]);
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const className = classes.find((item) => item.id === classFilter)?.name;
    return members.filter((member) => {
      if (query && !member.full_name.toLowerCase().includes(query)) return false;
      if (groupFilter && !member.groupIds.includes(groupFilter)) return false;
      if (className && !member.classNames.includes(className)) return false;
      if (ageFilter && !member.ageGroups.includes(ageFilter)) return false;
      if (statusFilter && stateFor(member.payments.filter((payment) => payment.due_date.startsWith(monthKey(year, selectedMonth)))) !== statusFilter) return false;
      return true;
    });
  }, [ageFilter, classFilter, classes, groupFilter, members, search, selectedMonth, statusFilter, year]);

  const monthStats = useMemo(() => {
    const monthPayments = filtered.flatMap((member) => member.payments.filter((payment) => payment.due_date.startsWith(monthKey(year, selectedMonth))));
    return {
      paid: filtered.filter((member) => stateFor(member.payments.filter((payment) => payment.due_date.startsWith(monthKey(year, selectedMonth)))) === "paid").length,
      missing: filtered.filter((member) => stateFor(member.payments.filter((payment) => payment.due_date.startsWith(monthKey(year, selectedMonth)))) === "unknown").length,
      amount: monthPayments.filter((payment) => payment.is_paid).reduce((sum, payment) => sum + payment.amount, 0),
    };
  }, [filtered, selectedMonth, year]);

  const togglePayment = (payment: Payment) => {
    setFeedback("");
    startTransition(async () => {
      const result = await setPaymentPaid(payment.id, !payment.is_paid);
      setFeedback(result.success ? "A befizetés állapota frissült." : result.error ?? "A módosítás nem sikerült.");
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">Tagdíj-áttekintő</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{year}. év · kattints a rögzített tételekre az állapot váltásához</p>
        </div>
        <div className="flex gap-2 text-sm">
          <Badge variant="light" color="success">{monthStats.paid} fizetett</Badge>
          <Badge variant="light" color="error">{monthStats.missing} hiányzó</Badge>
          <Badge variant="light" color="primary">{formatForint(monthStats.amount)} beérkezett</Badge>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
          <Input placeholder="Keresés név alapján…" value={search} onChange={(event) => setSearch(event.target.value)} />
          <select className="h-11 rounded-lg border border-gray-300 bg-transparent px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" value={groupFilter} onChange={(event) => setGroupFilter(event.target.value)}><option value="">Minden csoport</option>{groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}</select>
          <select className="h-11 rounded-lg border border-gray-300 bg-transparent px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" value={classFilter} onChange={(event) => setClassFilter(event.target.value)}><option value="">Minden óra</option>{classes.map((trainingClass) => <option key={trainingClass.id} value={trainingClass.id}>{trainingClass.name}</option>)}</select>
          <select className="h-11 rounded-lg border border-gray-300 bg-transparent px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" value={ageFilter} onChange={(event) => setAgeFilter(event.target.value)}><option value="">Minden korosztály</option>{ageGroups.map((ageGroup) => <option key={ageGroup} value={ageGroup}>{ageGroup}</option>)}</select>
          <select className="h-11 rounded-lg border border-gray-300 bg-transparent px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="">Minden állapot</option><option value="paid">Fizetett</option><option value="unpaid">Nem fizetett</option><option value="sessions">Alkalmak</option><option value="free">Ingyenes</option><option value="unknown">Hiányzó / ?</option></select>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">{MONTH_NAMES.map((month, index) => <button key={month} type="button" onClick={() => setSelectedMonth(index)} className={`rounded-lg px-3 py-2 text-sm font-medium transition ${selectedMonth === index ? "bg-brand-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-white/[0.05] dark:text-gray-400"}`}>{month}</button>)}</div>
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-gray-100 pt-4 text-xs dark:border-gray-800">
          <span className="font-medium text-gray-500 dark:text-gray-400">Állapotok:</span>
          {(Object.keys(stateMeta) as PaymentState[]).map((state) => <span key={state} className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400"><span className={`h-2.5 w-2.5 rounded-full border ${stateMeta[state].className}`} />{stateMeta[state].label}</span>)}
        </div>
        {feedback && <p className="mt-3 text-sm text-gray-500">{isPending ? "Mentés…" : feedback}</p>}
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]"><div className="overflow-x-auto"><table className="min-w-[1160px] w-full border-collapse text-left"><thead><tr className="border-b border-gray-100 dark:border-gray-800"><th className="sticky left-0 z-10 min-w-56 bg-white px-5 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:bg-gray-900 dark:text-gray-400">Tag neve</th>{MONTHS.map((month) => <th key={month} className="min-w-24 px-2 py-4 text-center text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{month}</th>)}</tr></thead><tbody>
        {filtered.map((member) => <tr key={member.id} className="border-b border-gray-50 dark:border-gray-800/60"><td className="sticky left-0 z-10 bg-white px-5 py-3 dark:bg-gray-900"><Link href={`/admin/tagok/${member.id}`} className="font-medium text-gray-800 hover:text-brand-500 dark:text-white/90">{member.full_name}</Link><div className="mt-1 truncate text-xs text-gray-400">{member.groupNames.join(", ") || "Nincs csoport"}</div></td>{MONTHS.map((_, index) => <td key={index} className="px-1.5 py-2 align-middle"><PaymentCell payments={member.payments.filter((payment) => payment.due_date.startsWith(monthKey(year, index)))} canManage={canManagePayments} onToggle={togglePayment} /></td>)}</tr>)}
        {filtered.length === 0 && <tr><td colSpan={13} className="px-5 py-12 text-center text-sm text-gray-500">Nincs a szűrésnek megfelelő tag.</td></tr>}
      </tbody></table></div></div>
    </div>
  );
}