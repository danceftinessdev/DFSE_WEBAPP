import Link from "next/link";
import React from "react";

export default function AccessDeniedPage() {
  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-error-200 bg-white p-8 text-center dark:border-error-500/20 dark:bg-white/[0.03]">
      <h1 className="text-xl font-semibold text-gray-800 dark:text-white/90">Nincs hozzáférés</h1>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
        Ehhez az admin felülethez nincs kiosztva jogosultságod.
      </p>
      <Link href="/admin" className="mt-6 inline-flex rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600">
        Vissza a vezérlőpultra
      </Link>
    </div>
  );
}