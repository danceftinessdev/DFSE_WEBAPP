"use client";
import React from "react";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import Label from "@/components/form/Label";
import type { MemberInput } from "./actions";

export const MEMBER_STATUS_OPTIONS = [
  { value: "active", label: "Aktív" },
  { value: "pending", label: "Függőben" },
  { value: "inactive", label: "Inaktív" },
];

export const GENDER_OPTIONS = [
  { value: "", label: "–" },
  { value: "Nő", label: "Nő" },
  { value: "Férfi", label: "Férfi" },
  { value: "Egyéb", label: "Egyéb" },
];

export const emptyMemberInput: MemberInput = {
  full_name: "",
  birth_date: null,
  gender: null,
  guardian_name: null,
  guardian_phone: null,
  email: null,
  phone: null,
  city: "Jászberény",
  address: null,
  status: "active",
  notes: null,
  license_expiry: null,
  medical_expiry: null,
};

const selectClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

interface MemberFormProps {
  value: MemberInput;
  onChange: (next: MemberInput) => void;
  disabled?: boolean;
}

/** Tag űrlap – létrehozáshoz és szerkesztéshez is használható. */
export default function MemberForm({ value, onChange, disabled }: MemberFormProps) {
  const set = <K extends keyof MemberInput>(key: K, v: MemberInput[K]) =>
    onChange({ ...value, [key]: v });

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Label htmlFor="member-name">Teljes név *</Label>
        <Input
          id="member-name"
          placeholder="pl. Kiss Petra"
          value={value.full_name}
          onChange={(e) => set("full_name", e.target.value)}
          disabled={disabled}
        />
      </div>
      <div>
        <Label htmlFor="member-birth">Születési dátum</Label>
        <Input
          id="member-birth"
          type="date"
          value={value.birth_date ?? ""}
          onChange={(e) => set("birth_date", e.target.value || null)}
          disabled={disabled}
        />
      </div>
      <div>
        <Label htmlFor="member-gender">Nem</Label>
        <select
          id="member-gender"
          className={selectClass}
          value={value.gender ?? ""}
          onChange={(e) => set("gender", e.target.value || null)}
          disabled={disabled}
        >
          {GENDER_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="member-phone">Telefonszám</Label>
        <Input
          id="member-phone"
          placeholder="+36 30 …"
          value={value.phone ?? ""}
          onChange={(e) => set("phone", e.target.value || null)}
          disabled={disabled}
        />
      </div>
      <div>
        <Label htmlFor="member-email">E-mail cím</Label>
        <Input
          id="member-email"
          type="email"
          placeholder="pelda@email.hu"
          value={value.email ?? ""}
          onChange={(e) => set("email", e.target.value || null)}
          disabled={disabled}
        />
      </div>
      <div>
        <Label htmlFor="member-city">Település</Label>
        <Input
          id="member-city"
          value={value.city ?? ""}
          onChange={(e) => set("city", e.target.value || null)}
          disabled={disabled}
        />
      </div>
      <div>
        <Label htmlFor="member-address">Lakcím</Label>
        <Input
          id="member-address"
          value={value.address ?? ""}
          onChange={(e) => set("address", e.target.value || null)}
          disabled={disabled}
        />
      </div>
      <div>
        <Label htmlFor="member-guardian">Gondviselő neve</Label>
        <Input
          id="member-guardian"
          value={value.guardian_name ?? ""}
          onChange={(e) => set("guardian_name", e.target.value || null)}
          disabled={disabled}
        />
      </div>
      <div>
        <Label htmlFor="member-guardian-phone">Gondviselő telefonszáma</Label>
        <Input
          id="member-guardian-phone"
          value={value.guardian_phone ?? ""}
          onChange={(e) => set("guardian_phone", e.target.value || null)}
          disabled={disabled}
        />
      </div>
      <div>
        <Label htmlFor="member-license">Versenyengedély lejárata</Label>
        <Input
          id="member-license"
          type="date"
          value={value.license_expiry ?? ""}
          onChange={(e) => set("license_expiry", e.target.value || null)}
          disabled={disabled}
        />
      </div>
      <div>
        <Label htmlFor="member-medical">Sportorvosi lejárata</Label>
        <Input
          id="member-medical"
          type="date"
          value={value.medical_expiry ?? ""}
          onChange={(e) => set("medical_expiry", e.target.value || null)}
          disabled={disabled}
        />
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor="member-status">Státusz</Label>
        <select
          id="member-status"
          className={selectClass}
          value={value.status ?? "active"}
          onChange={(e) => set("status", e.target.value)}
          disabled={disabled}
        >
          {MEMBER_STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor="member-notes">Megjegyzés</Label>
        <TextArea
          placeholder="Belső megjegyzés a tagról…"
          value={value.notes ?? ""}
          onChange={(v) => set("notes", v || null)}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
