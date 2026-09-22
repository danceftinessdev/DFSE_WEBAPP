"use client";
import React, { useMemo, useState } from "react";
import Link from "next/link";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import { PlusIcon } from "@/icons";

export interface ChoreoListItem {
  id: string;
  name: string;
  type: string | null;
  costume: string | null;
  target_group: string | null;
  dancerCount: number;
  totalPoints: number;
}

interface ChoreographyListProps {
  choreographies: ChoreoListItem[];
}

export default function ChoreographyList({ choreographies }: ChoreographyListProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return choreographies;
    return choreographies.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.type?.toLowerCase().includes(q) ||
        c.target_group?.toLowerCase().includes(q)
    );
  }, [choreographies, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="w-full sm:w-72">
          <Input
            placeholder="Keresés név, típus vagy csoport alapján…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Link href="/admin/koreok/uj">
          <Button size="sm" startIcon={<PlusIcon className="h-4 w-4" />}>
            Új koreográfia
          </Button>
        </Link>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 p-10 text-center dark:border-gray-700">
          <p className="text-sm text-gray-500">
            {choreographies.length === 0
              ? "Még nincs felvett koreográfia. Hozd létre az elsőt!"
              : "Nincs a keresésnek megfelelő koreográfia."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((c) => (
            <Link
              key={c.id}
              href={`/admin/koreok/${c.id}`}
              className="group rounded-2xl border border-gray-200 bg-white p-5 transition hover:border-brand-300 hover:shadow-md dark:border-gray-800 dark:bg-white/[0.03] dark:hover:border-brand-500/50"
            >
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-semibold text-gray-800 group-hover:text-brand-500 dark:text-white/90">
                  {c.name}
                </h4>
                {c.type && (
                  <Badge variant="light" color="primary" size="sm">
                    {c.type}
                  </Badge>
                )}
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {c.target_group && (
                  <Badge variant="light" color="light" size="sm">
                    {c.target_group}
                  </Badge>
                )}
                {c.costume && (
                  <Badge variant="light" color="info" size="sm">
                    {c.costume}
                  </Badge>
                )}
              </div>
              <div className="mt-4 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>{c.dancerCount} táncos</span>
                <span>{c.totalPoints.toFixed(1).replace(".", ",")} pont</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
