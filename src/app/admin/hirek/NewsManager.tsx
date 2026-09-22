"use client";
import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import Alert from "@/components/ui/alert/Alert";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import Label from "@/components/form/Label";
import Checkbox from "@/components/form/input/Checkbox";
import { Modal } from "@/components/ui/modal";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { createClient } from "@/lib/supabase/client";
import { createNews, deleteNews, updateNews, type NewsInput } from "./actions";
import { NEWS_BUCKET } from "@/lib/constants";
import { formatDateHu } from "@/lib/utils/format";
import { PencilIcon, PlusIcon, TrashBinIcon } from "@/icons";

export interface NewsListItem {
  id: string;
  title: string;
  content: string;
  excerpt: string | null;
  cover_image_url: string | null;
  gallery_urls: string[];
  is_prior: boolean;
  is_published: boolean;
  created_at: string;
}

interface NewsManagerProps {
  posts: NewsListItem[];
}

const MAX_FILE_SIZE_MB = 8;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

async function uploadImage(file: File): Promise<string> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error(`Nem támogatott fájltípus: ${file.name} (csak JPG, PNG, WebP, GIF)`);
  }
  if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
    throw new Error(`A fájl túl nagy: ${file.name} (max ${MAX_FILE_SIZE_MB} MB)`);
  }
  const supabase = createClient();
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from(NEWS_BUCKET).upload(path, file);
  if (error) throw new Error(`Képfeltöltés sikertelen: ${error.message}`);
  const { data } = supabase.storage.from(NEWS_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export default function NewsManager({ posts }: NewsManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [feedback, setFeedback] = useState<{ variant: "success" | "error"; message: string } | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<NewsListItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<NewsListItem | null>(null);

  const [form, setForm] = useState({
    title: "",
    content: "",
    excerpt: "",
    is_prior: false,
    is_published: true,
  });
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);

  const openCreate = () => {
    setEditTarget(null);
    setForm({ title: "", content: "", excerpt: "", is_prior: false, is_published: true });
    setCoverUrl(null);
    setCoverFile(null);
    setGalleryUrls([]);
    setGalleryFiles([]);
    setModalOpen(true);
  };

  const openEdit = (post: NewsListItem) => {
    setEditTarget(post);
    setForm({
      title: post.title,
      content: post.content,
      excerpt: post.excerpt ?? "",
      is_prior: post.is_prior,
      is_published: post.is_published,
    });
    setCoverUrl(post.cover_image_url);
    setCoverFile(null);
    setGalleryUrls(post.gallery_urls);
    setGalleryFiles([]);
    setModalOpen(true);
  };

  const busy = isPending || uploading;

  const handleSubmit = () => {
    if (!form.title.trim() || !form.content.trim()) {
      setFeedback({ variant: "error", message: "A cím és a tartalom kötelező." });
      return;
    }
    setFeedback(null);
    startTransition(async () => {
      try {
        setUploading(true);
        // Képek feltöltése kliensoldalon (közvetlenül a storage-ba)
        let finalCover = coverUrl;
        if (coverFile) finalCover = await uploadImage(coverFile);
        const uploadedGallery: string[] = [];
        for (const f of galleryFiles) {
          uploadedGallery.push(await uploadImage(f));
        }
        const finalGallery = [...galleryUrls, ...uploadedGallery];
        setUploading(false);

        const input: NewsInput = {
          title: form.title,
          content: form.content,
          excerpt: form.excerpt || null,
          cover_image_url: finalCover,
          gallery_urls: finalGallery,
          is_prior: form.is_prior,
          is_published: form.is_published,
        };

        const result = editTarget
          ? await updateNews(editTarget.id, input)
          : await createNews(input);

        if (result.success) {
          setFeedback({
            variant: "success",
            message: editTarget ? "Hír frissítve." : "Hír közzétéve.",
          });
          setModalOpen(false);
          router.refresh();
        } else {
          setFeedback({ variant: "error", message: result.error ?? "Ismeretlen hiba történt." });
        }
      } catch (e) {
        setUploading(false);
        setFeedback({
          variant: "error",
          message: e instanceof Error ? e.message : "Képfeltöltési hiba történt.",
        });
      }
    });
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

      <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {posts.length} hír · {posts.filter((p) => p.is_published).length} publikált
        </p>
        <Button size="sm" startIcon={<PlusIcon className="h-4 w-4" />} onClick={openCreate}>
          Új hír
        </Button>
      </div>

      {posts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 p-10 text-center dark:border-gray-700">
          <p className="text-sm text-gray-500">Még nincs közzétett hír. Hozd létre az elsőt!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {posts.map((post) => (
            <div
              key={post.id}
              className={`overflow-hidden rounded-2xl border bg-white dark:bg-white/[0.03] ${
                post.is_prior
                  ? "border-brand-300 dark:border-brand-500/40"
                  : "border-gray-200 dark:border-gray-800"
              }`}
            >
              {post.cover_image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={post.cover_image_url}
                  alt={post.title}
                  className="h-40 w-full object-cover"
                />
              )}
              <div className="p-5">
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {post.is_prior && (
                    <Badge variant="light" color="primary" size="sm">
                      Kiemelt
                    </Badge>
                  )}
                  <Badge variant="light" color={post.is_published ? "success" : "light"} size="sm">
                    {post.is_published ? "Publikált" : "Piszkozat"}
                  </Badge>
                  {post.gallery_urls.length > 0 && (
                    <Badge variant="light" color="info" size="sm">
                      {post.gallery_urls.length} kép
                    </Badge>
                  )}
                </div>
                <h4 className="font-semibold text-gray-800 dark:text-white/90">{post.title}</h4>
                <p className="mt-1 line-clamp-2 text-sm text-gray-500 dark:text-gray-400">
                  {post.excerpt || post.content.slice(0, 160)}
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs text-gray-400">{formatDateHu(post.created_at)}</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEdit(post)}
                      className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-brand-500 dark:hover:bg-white/[0.05]"
                      title="Szerkesztés"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(post)}
                      className="rounded-lg p-2 text-gray-400 transition hover:bg-error-50 hover:text-error-500 dark:hover:bg-error-500/10"
                      title="Törlés"
                    >
                      <TrashBinIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Létrehozás / szerkesztés modal */}
      <Modal isOpen={modalOpen} onClose={() => !busy && setModalOpen(false)} className="max-w-[680px] m-4">
        <div className="no-scrollbar relative w-full max-w-[680px] overflow-y-auto rounded-3xl bg-white p-6 dark:bg-gray-900 lg:p-8">
          <h4 className="mb-6 text-xl font-semibold text-gray-800 dark:text-white/90">
            {editTarget ? "Hír szerkesztése" : "Új hír"}
          </h4>
          <div className="space-y-4">
            <div>
              <Label htmlFor="news-title">Cím *</Label>
              <Input
                id="news-title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                disabled={busy}
              />
            </div>
            <div>
              <Label htmlFor="news-content">Tartalom *</Label>
              <TextArea
                rows={6}
                placeholder="A hír szövege…"
                value={form.content}
                onChange={(v) => setForm({ ...form, content: v })}
                disabled={busy}
              />
            </div>
            <div>
              <Label htmlFor="news-excerpt">Rövid kivonat (opcionális)</Label>
              <Input
                id="news-excerpt"
                placeholder="Ha üres, a tartalom eleje jelenik meg."
                value={form.excerpt}
                onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                disabled={busy}
              />
            </div>

            {/* Borítókép */}
            <div>
              <Label htmlFor="news-cover">Borítókép</Label>
              {coverUrl && !coverFile && (
                <div className="mb-2 flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={coverUrl} alt="Borítókép" className="h-16 w-24 rounded-lg object-cover" />
                  <button
                    onClick={() => setCoverUrl(null)}
                    className="text-xs text-error-500 hover:underline"
                  >
                    Eltávolítás
                  </button>
                </div>
              )}
              <input
                id="news-cover"
                type="file"
                accept="image/*"
                disabled={busy}
                onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
                className="block w-full text-sm text-gray-500 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-brand-600 hover:file:bg-brand-100 dark:text-gray-400 dark:file:bg-brand-500/10 dark:file:text-brand-400"
              />
              {coverFile && (
                <p className="mt-1 text-xs text-gray-400">Új borítókép: {coverFile.name}</p>
              )}
            </div>

            {/* Galéria */}
            <div>
              <Label htmlFor="news-gallery">Galéria képek</Label>
              {galleryUrls.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-2">
                  {galleryUrls.map((url) => (
                    <div key={url} className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="Galéria kép" className="h-16 w-16 rounded-lg object-cover" />
                      <button
                        onClick={() => setGalleryUrls((prev) => prev.filter((u) => u !== url))}
                        className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-error-500 text-xs text-white"
                        title="Eltávolítás"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <input
                id="news-gallery"
                type="file"
                accept="image/*"
                multiple
                disabled={busy}
                onChange={(e) => setGalleryFiles(Array.from(e.target.files ?? []))}
                className="block w-full text-sm text-gray-500 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-brand-600 hover:file:bg-brand-100 dark:text-gray-400 dark:file:bg-brand-500/10 dark:file:text-brand-400"
              />
              {galleryFiles.length > 0 && (
                <p className="mt-1 text-xs text-gray-400">
                  {galleryFiles.length} új kép kerül feltöltésre mentéskor.
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-6">
              <Checkbox
                label="Kiemelt hír (a lista elejére kerül)"
                checked={form.is_prior}
                onChange={(v) => setForm({ ...form, is_prior: v })}
                disabled={busy}
              />
              <Checkbox
                label="Publikálva (látható a weboldalon)"
                checked={form.is_published}
                onChange={(v) => setForm({ ...form, is_published: v })}
                disabled={busy}
              />
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3">
            <Button variant="outline" size="sm" onClick={() => setModalOpen(false)} disabled={busy}>
              Mégsem
            </Button>
            <Button size="sm" onClick={handleSubmit} disabled={busy}>
              {uploading ? "Képek feltöltése…" : isPending ? "Mentés…" : "Mentés"}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        loading={isPending}
        title="Hír törlése"
        message={<>Törlöd a(z) <strong>{deleteTarget?.title}</strong> című hírt?</>}
        destructiveDetails={["A hírhez tartozó képek is törlődnek a tárhelyről."]}
        onConfirm={() => {
          if (!deleteTarget) return;
          setFeedback(null);
          startTransition(async () => {
            const result = await deleteNews(deleteTarget.id);
            if (result.success) {
              setFeedback({ variant: "success", message: "Hír törölve." });
              router.refresh();
            } else {
              setFeedback({ variant: "error", message: result.error ?? "A törlés nem sikerült." });
            }
            setDeleteTarget(null);
          });
        }}
      />
    </div>
  );
}
