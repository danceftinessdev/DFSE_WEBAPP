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
import { Modal } from "@/components/ui/modal";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import {
  bulkCreatePayments,
  deleteMember,
} from "./actions";
import { expiryStatus, todayInputValue } from "@/lib/utils/format";
import { DownloadIcon, PlusIcon, TrashBinIcon } from "@/icons";

export interface MemberListItem {
  id: string;
  full_name: string;
  status: string;
  city: string;
  phone: string | null;
  email: string | null;
  license_expiry: string | null;
  medical_expiry: string | null;
  groups: string[];
  groupIds: string[];
  debtCount: number;
}

export interface PaymentExportRow {
  name: string;
  group: string;
  title: string;
  amount: number;
  date: string;
  status: string;
}

interface MemberManagerProps {
  members: MemberListItem[];
  groups: { id: string; name: string }[];
  exportRows: PaymentExportRow[];
}

const statusBadge = (status: string) => {
  switch (status) {
    case "active":
      return <Badge variant="light" color="success" size="sm">Aktív</Badge>;
    case "pending":
      return <Badge variant="light" color="warning" size="sm">Függőben</Badge>;
    default:
      return <Badge variant="light" color="light" size="sm">Inaktív</Badge>;
  }
};

function ExpiryBadge({ date, label }: { date: string | null; label: string }) {
  const status = expiryStatus(date);
  if (status === "none" || status === "ok") return null;
  return (
    <Badge variant="light" color={status === "expired" ? "error" : "warning"} size="sm">
      {label} {status === "expired" ? "lejárt" : "lejár"}
    </Badge>
  );
}

function exportCsv(rows: PaymentExportRow[]) {
  const header = ["Név", "Csoport", "Megnevezés", "Összeg", "Dátum", "Státusz"];
  const escape = (v: string | number) => `"${String(v).replaceAll('"', '""')}"`;
  const lines = [
    header.map(escape).join(";"),
    ...rows.map((r) =>
      [r.name, r.group, r.title, r.amount, r.date, r.status].map(escape).join(";")
    ),
  ];
  const blob = new Blob(["\uFEFF" + lines.join("\r\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `teljes_penzugyi_export_${todayInputValue()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function MemberManager({ members, groups, exportRows }: MemberManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [selectionMode, setSelectionMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [feedback, setFeedback] = useState<{ variant: "success" | "error"; message: string } | null>(null);

  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkForm, setBulkForm] = useState({ title: "", amount: "13000", due_date: todayInputValue() });

  const [deleteTarget, setDeleteTarget] = useState<MemberListItem | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return members.filter((m) => {
      if (q && !m.full_name.toLowerCase().includes(q)) return false;
      if (groupFilter && !m.groupIds.includes(groupFilter)) return false;
      if (statusFilter && m.status !== statusFilter) return false;
      return true;
    });
  }, [members, search, groupFilter, statusFilter]);

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((m) => selected.has(m.id));

  const toggleSelected = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllFiltered = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) filtered.forEach((m) => next.delete(m.id));
      else filtered.forEach((m) => next.add(m.id));
      return next;
    });
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

  const handleBulk = () => {
    const amount = Number(bulkForm.amount);
    run(
      () =>
        bulkCreatePayments(Array.from(selected), {
          title: bulkForm.title,
          amount: Number.isFinite(amount) ? amount : 0,
          due_date: bulkForm.due_date,
        }),
      `${selected.size} tagnak kiírva: ${bulkForm.title}.`
    );
    setBulkOpen(false);
    setSelected(new Set());
    setSelectionMode(false);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    const name = deleteTarget.full_name;
    run(() => deleteMember(deleteTarget.id), `${name} törölve.`);
    setDeleteTarget(null);
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

      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        {/* Eszköztár */}
        <div className="flex flex-col gap-4 border-b border-gray-100 p-5 dark:border-gray-800 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            <div className="sm:w-64">
              <Input
                placeholder="Keresés név alapján…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="h-11 rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
            >
              <option value="">Összes csoport</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
            <select
              className="h-11 rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Minden státusz</option>
              <option value="active">Aktív</option>
              <option value="pending">Függőben</option>
              <option value="inactive">Inaktív</option>
            </select>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectionMode((v) => !v);
                setSelected(new Set());
              }}
            >
              {selectionMode ? "Kijelölés vége" : "Tömeges kijelölés"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              startIcon={<DownloadIcon className="h-4 w-4" />}
              onClick={() => exportCsv(exportRows)}
              disabled={exportRows.length === 0}
            >
              Exportálás
            </Button>
            <Link href="/admin/tagok/uj">
              <Button size="sm" startIcon={<PlusIcon className="h-4 w-4" />}>
                Új tag
              </Button>
            </Link>
          </div>
        </div>

        {/* Tömeges műveletek sáv */}
        {selectionMode && (
          <div className="flex flex-wrap items-center gap-3 border-b border-gray-100 bg-gray-50 px-5 py-3 dark:border-gray-800 dark:bg-white/[0.02]">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {selected.size} tag kijelölve
            </span>
            <button
              onClick={toggleSelectAllFiltered}
              className="text-sm font-medium text-brand-500 hover:text-brand-600"
            >
              {allFilteredSelected ? "Kijelölés törlése" : "Összes szűrt kijelölése"}
            </button>
            <Button size="sm" onClick={() => setBulkOpen(true)} disabled={selected.size === 0}>
              Befizetés kiírása
            </Button>
          </div>
        )}

        {/* Táblázat */}
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                {selectionMode && (
                  <TableCell isHeader className="w-10 px-5 py-3">
                    <span className="sr-only">Kijelölés</span>
                  </TableCell>
                )}
                <TableCell isHeader className="px-5 py-3 text-start text-sm font-medium text-gray-500 dark:text-gray-400">
                  Név
                </TableCell>
                <TableCell isHeader className="px-5 py-3 text-start text-sm font-medium text-gray-500 dark:text-gray-400">
                  Csoportok
                </TableCell>
                <TableCell isHeader className="px-5 py-3 text-start text-sm font-medium text-gray-500 dark:text-gray-400">
                  Státusz
                </TableCell>
                <TableCell isHeader className="px-5 py-3 text-start text-sm font-medium text-gray-500 dark:text-gray-400">
                  Engedélyek
                </TableCell>
                <TableCell isHeader className="px-5 py-3 text-start text-sm font-medium text-gray-500 dark:text-gray-400">
                  Tartozás
                </TableCell>
                <TableCell isHeader className="px-5 py-3 text-end text-sm font-medium text-gray-500 dark:text-gray-400">
                  Műveletek
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell className="px-5 py-10 text-center text-sm text-gray-500" colSpan={selectionMode ? 7 : 6}>
                    Nincs a szűrésnek megfelelő tag.
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((m) => (
                <TableRow key={m.id} className="border-b border-gray-50 dark:border-white/[0.03]">
                  {selectionMode && (
                    <TableCell className="px-5 py-4">
                      <Checkbox checked={selected.has(m.id)} onChange={() => toggleSelected(m.id)} />
                    </TableCell>
                  )}
                  <TableCell className="px-5 py-4">
                    <Link
                      href={`/admin/tagok/${m.id}`}
                      className="font-medium text-gray-800 hover:text-brand-500 dark:text-white/90"
                    >
                      {m.full_name}
                    </Link>
                    <div className="text-xs text-gray-400">{m.city}</div>
                  </TableCell>
                  <TableCell className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {m.groups.length > 0 ? m.groups.join(", ") : "–"}
                  </TableCell>
                  <TableCell className="px-5 py-4">{statusBadge(m.status)}</TableCell>
                  <TableCell className="px-5 py-4">
                    <div className="flex flex-wrap gap-1">
                      <ExpiryBadge date={m.license_expiry} label="Versenyengedély" />
                      <ExpiryBadge date={m.medical_expiry} label="Sportorvosi" />
                    </div>
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    {m.debtCount > 0 ? (
                      <Badge variant="light" color="error" size="sm">
                        {m.debtCount} tartozás
                      </Badge>
                    ) : (
                      <Badge variant="light" color="success" size="sm">
                        Rendezett
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/tagok/${m.id}`}
                        className="text-sm font-medium text-brand-500 hover:text-brand-600"
                      >
                        Részletek
                      </Link>
                      <button
                        onClick={() => setDeleteTarget(m)}
                        className="rounded-lg p-2 text-gray-400 transition hover:bg-error-50 hover:text-error-500 dark:hover:bg-error-500/10"
                        title="Tag törlése"
                      >
                        <TrashBinIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Tömeges befizetés modal */}
      <Modal isOpen={bulkOpen} onClose={() => setBulkOpen(false)} className="max-w-[480px] m-4">
        <div className="relative w-full max-w-[480px] rounded-3xl bg-white p-6 dark:bg-gray-900 lg:p-8">
          <h4 className="mb-1 text-xl font-semibold text-gray-800 dark:text-white/90">
            Tömeges befizetés kiírása
          </h4>
          <p className="mb-5 text-sm text-gray-500 dark:text-gray-400">
            {selected.size} kijelölt tag kapja meg ezt a kiírást.
          </p>
          <div className="space-y-4">
            <div>
              <Label htmlFor="bulk-title">Megnevezés *</Label>
              <Input
                id="bulk-title"
                placeholder="pl. Szeptemberi tagdíj"
                value={bulkForm.title}
                onChange={(e) => setBulkForm({ ...bulkForm, title: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="bulk-amount">Összeg (Ft) *</Label>
              <Input
                id="bulk-amount"
                type="number"
                min="0"
                value={bulkForm.amount}
                onChange={(e) => setBulkForm({ ...bulkForm, amount: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="bulk-due">Határidő *</Label>
              <Input
                id="bulk-due"
                type="date"
                value={bulkForm.due_date}
                onChange={(e) => setBulkForm({ ...bulkForm, due_date: e.target.value })}
              />
            </div>
          </div>
          <div className="mt-6 flex items-center justify-end gap-3">
            <Button variant="outline" size="sm" onClick={() => setBulkOpen(false)} disabled={isPending}>
              Mégsem
            </Button>
            <Button size="sm" onClick={handleBulk} disabled={isPending || selected.size === 0}>
              {isPending ? "Kiírás…" : `Kiírás (${selected.size} tag)`}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Törlés megerősítése */}
      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={isPending}
        title="Tag törlése"
        message={
          <>
            Biztosan törlöd <strong>{deleteTarget?.full_name}</strong> adatait? A művelet nem
            vonható vissza.
          </>
        }
        destructiveDetails={[
          "A csoportbeosztásai is törlődnek.",
          "A befizetései és versenyfizetései is törlődnek.",
          "A jelenléti adatai és koreográfia-hozzárendelései is törlődnek.",
        ]}
      />
    </div>
  );
}
