/** Közös formázó segédfüggvények (kliens- és szerveroldalon is használható). */

export function formatForint(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return "–";
  return `${amount.toLocaleString("hu-HU")} Ft`;
}

export function formatDateHu(date: string | Date | null | undefined): string {
  if (!date) return "–";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "–";
  return d.toLocaleDateString("hu-HU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatDateShortHu(date: string | Date | null | undefined): string {
  if (!date) return "–";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "–";
  return d.toLocaleDateString("hu-HU", {
    month: "short",
    day: "numeric",
  });
}

/** 'YYYY-MM-DD' formátum lokális idő szerint (input[type=date]-hez). */
export function toDateInputValue(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function todayInputValue(): string {
  return toDateInputValue(new Date());
}

export const HUNGARIAN_DAYS = [
  "Hétfő",
  "Kedd",
  "Szerda",
  "Csütörtök",
  "Péntek",
  "Szombat",
  "Vasárnap",
] as const;

export const HUNGARIAN_DAYS_SHORT = ["H", "K", "Sze", "Cs", "P", "Szo", "V"] as const;

/** Egy dátumhoz tartozó hét hétfőjének dátuma (Date). */
export function startOfWeekMonday(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = (d.getDay() + 6) % 7; // hétfő = 0
  d.setDate(d.getDate() - day);
  return d;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/** Lejárat státusz: figyelmeztetés, ha 30 napon belül lejár vagy már lejárt. */
export function expiryStatus(date: string | null | undefined): "ok" | "warning" | "expired" | "none" {
  if (!date) return "none";
  const exp = new Date(date);
  if (Number.isNaN(exp.getTime())) return "none";
  const now = new Date();
  const in30 = new Date();
  in30.setDate(in30.getDate() + 30);
  if (exp < now) return "expired";
  if (exp <= in30) return "warning";
  return "ok";
}
