"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import Label from "@/components/form/Label";
import Checkbox from "@/components/form/input/Checkbox";
import Alert from "@/components/ui/alert/Alert";
import { Modal } from "@/components/ui/modal";
import {
  createAnnouncement,
  deleteAnnouncement,
  updateAnnouncement,
  type AnnouncementInput,
} from "./actions";

export type ProfileOption = { id: string; name: string; email: string | null };
export type AnnouncementListItem = AnnouncementInput & {
  id: string;
  created_at: string;
};

const emptyForm: AnnouncementInput = {
  title: "",
  message: "",
  display_mode: "login",
  pages: [],
  target_profile_ids: null,
  is_active: true,
  starts_at: null,
  ends_at: null,
};

const PAGE_OPTIONS = [
  { path: "/", label: "Nyilvános főoldal" },
  { path: "/bemutatkozas", label: "Bemutatkozás" },
  { path: "/kapcsolat", label: "Kapcsolat" },
  { path: "/admin", label: "Admin vezérlőpult" },
  { path: "/admin/beosztas", label: "Beosztás" },
  { path: "/admin/versenyek", label: "Versenyek" },
  { path: "/admin/koreok", label: "Koreográfiák" },
  { path: "/admin/tagok", label: "Tagok" },
  { path: "/admin/befizetesek", label: "Befizetések" },
  { path: "/admin/jogosultsagok", label: "Jogosultságok" },
  { path: "/admin/hirek", label: "Hírek" },
  { path: "/admin/uzenetek", label: "Felugró üzenetek" },
  { path: "/admin/calendar", label: "Naptár" },
  { path: "/admin/profile", label: "Profil" },
];

function toLocalDateTime(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function toIsoDateTime(value: string | null) {
  return value ? new Date(value).toISOString() : null;
}

export default function AnnouncementManager({
  announcements,
  profiles,
}: {
  announcements: AnnouncementListItem[];
  profiles: ProfileOption[];
}) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AnnouncementListItem | null>(null);
  const [form, setForm] = useState<AnnouncementInput>(emptyForm);
  const [feedback, setFeedback] = useState<{
    variant: "success" | "error";
    message: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [pageText, setPageText] = useState("");

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setPageText("");
    setModalOpen(true);
  };
  const openEdit = (item: AnnouncementListItem) => {
    setEditing(item);
    setForm({
      ...item,
      starts_at: toLocalDateTime(item.starts_at),
      ends_at: toLocalDateTime(item.ends_at),
    });
    setPageText(
      item.pages
        .filter((page) => !PAGE_OPTIONS.some((option) => option.path === page))
        .join("\n"),
    );
    setModalOpen(true);
  };
  const submit = () =>
    startTransition(async () => {
      const customPages = pageText
        .split("\n")
        .map((page) => page.trim())
        .filter(Boolean);
      const input = {
        ...form,
        pages: [...new Set([...form.pages, ...customPages])],
        starts_at: toIsoDateTime(form.starts_at),
        ends_at: toIsoDateTime(form.ends_at),
      };
      const result = editing
        ? await updateAnnouncement(editing.id, input)
        : await createAnnouncement(input);
      setFeedback(
        result.success
          ? { variant: "success", message: "Üzenet mentve." }
          : { variant: "error", message: result.error },
      );
      if (result.success) {
        setModalOpen(false);
        router.refresh();
      }
    });
  const remove = (id: string) =>
    startTransition(async () => {
      const result = await deleteAnnouncement(id);
      setFeedback(
        result.success
          ? { variant: "success", message: "Üzenet törölve." }
          : { variant: "error", message: result.error },
      );
      if (result.success) router.refresh();
    });

  return (
    <div className="space-y-6">
      {feedback && (
        <Alert
          variant={feedback.variant}
          title={feedback.variant === "success" ? "Sikeres művelet" : "Hiba"}
          message={feedback.message}
        />
      )}
      <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
        <p className="text-sm text-gray-500">{announcements.length} üzenet</p>
        <Button size="sm" onClick={openCreate}>
          Új üzenet
        </Button>
      </div>
      <div className="space-y-3">
        {announcements.map((item) => (
          <div
            key={item.id}
            className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:flex-row md:items-center md:justify-between"
          >
            <div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-600">
                  {item.display_mode === "login"
                    ? "Belépésenként"
                    : item.display_mode === "all_pages"
                      ? "Minden oldalon"
                      : "Kiválasztott oldalakon"}
                </span>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${item.is_active ? "bg-success-50 text-success-600" : "bg-gray-100 text-gray-500"}`}
                >
                  {item.is_active ? "Aktív" : "Inaktív"}
                </span>
              </div>
              <h3 className="mt-2 font-semibold text-gray-800 dark:text-white/90">
                {item.title}
              </h3>
              <p className="mt-1 line-clamp-2 text-sm text-gray-500">
                {item.message}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => openEdit(item)}
              >
                Szerkesztés
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => remove(item.id)}
                disabled={isPending}
              >
                Törlés
              </Button>
            </div>
          </div>
        ))}
      </div>
      <Modal
        isOpen={modalOpen}
        onClose={() => !isPending && setModalOpen(false)}
        className="m-4 max-w-[680px]"
      >
        <div className="max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 dark:bg-gray-900 lg:p-8">
          <h2 className="mb-6 text-xl font-semibold text-gray-800 dark:text-white/90">
            {editing ? "Üzenet szerkesztése" : "Új felugró üzenet"}
          </h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="announcement-title">Cím *</Label>
              <Input
                id="announcement-title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="announcement-message">Üzenet *</Label>
              <TextArea
                rows={5}
                value={form.message}
                onChange={(value) => setForm({ ...form, message: value })}
              />
            </div>
            <div>
              <Label htmlFor="announcement-mode">Megjelenés</Label>
              <select
                id="announcement-mode"
                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
                value={form.display_mode}
                onChange={(e) =>
                  setForm({
                    ...form,
                    display_mode: e.target
                      .value as AnnouncementInput["display_mode"],
                  })
                }
              >
                <option value="login">Minden belépésnél egyszer</option>
                <option value="all_pages">Minden oldalon</option>
                <option value="selected_pages">Megadott oldalakon</option>
              </select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="announcement-starts-at">Megjelenés ettől (opcionális)</Label>
                <Input
                  id="announcement-starts-at"
                  type="datetime-local"
                  value={form.starts_at ?? ""}
                  onChange={(e) => setForm({ ...form, starts_at: e.target.value || null })}
                />
              </div>
              <div>
                <Label htmlFor="announcement-ends-at">Automatikus inaktiválás ekkor</Label>
                <Input
                  id="announcement-ends-at"
                  type="datetime-local"
                  value={form.ends_at ?? ""}
                  min={form.starts_at ?? undefined}
                  onChange={(e) => setForm({ ...form, ends_at: e.target.value || null })}
                />
              </div>
            </div>
            {form.display_mode === "selected_pages" && (
              <div>
                <Label>Oldalak</Label>
                <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                  {PAGE_OPTIONS.map((page) => (
                    <div key={page.path} className="flex items-center gap-2 py-1">
                      <Checkbox
                        checked={form.pages.includes(page.path)}
                        onChange={(checked) =>
                          setForm({
                            ...form,
                            pages: checked
                              ? [...form.pages, page.path]
                              : form.pages.filter((selectedPage) => selectedPage !== page.path),
                          })
                        }
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {page.label} <span className="text-xs text-gray-400">{page.path}</span>
                      </span>
                    </div>
                  ))}
                </div>
                <Label htmlFor="announcement-pages-custom">
                  Egyedi útvonalak, soronként egy (opcionális)
                </Label>
                <TextArea rows={2} value={pageText} onChange={setPageText} />
              </div>
            )}
            <div>
              <Label>Címzettek</Label>
              <div className="max-h-40 space-y-2 overflow-y-auto rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={form.target_profile_ids === null}
                    onChange={(checked) =>
                      setForm({
                        ...form,
                        target_profile_ids: checked ? null : [],
                      })
                    }
                  />
                  Minden bejelentkezett felhasználó
                </label>
                {profiles.map((profile) => (
                  <label
                    key={profile.id}
                    className="flex items-center gap-2 text-sm"
                  >
                    <Checkbox
                      checked={
                        form.target_profile_ids?.includes(profile.id) ?? false
                      }
                      onChange={(checked) => {
                        const ids = new Set(form.target_profile_ids ?? []);
                        if (checked) {
                          ids.add(profile.id);
                        } else {
                          ids.delete(profile.id);
                        }
                        setForm({ ...form, target_profile_ids: [...ids] });
                      }}
                    />
                    {profile.name}
                    {profile.email ? ` (${profile.email})` : ""}
                  </label>
                ))}
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={form.is_active}
                onChange={(checked) => setForm({ ...form, is_active: checked })}
              />
              Aktív üzenet
            </label>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setModalOpen(false)}>
                Mégse
              </Button>
              <Button onClick={submit} disabled={isPending}>
                {isPending ? "Mentés…" : "Mentés"}
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
