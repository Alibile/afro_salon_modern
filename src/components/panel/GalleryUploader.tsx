"use client";
import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { toast } from "sonner";
import { addGalleryPhotos } from "@/actions/gallery";
import { MAX_UPLOAD_BYTES } from "@/lib/upload-limits";
import { MAX_GALLERY_BATCH } from "@/lib/gallery-utils";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useActionError } from "@/lib/use-action-error";

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

type FileState = { name: string; status: string; failed: boolean };

/** Fotoğrafın gerçek pikselleri; masonry oranı bu değerlere dayanır. */
function readDimensions(file: File): Promise<{ width: number; height: number }> {
  const url = URL.createObjectURL(file);
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      // Bu metin kullanıcıya hiç ulaşmaz: `uploadAll` hatayı yakalayıp satıra
      // çevrilmiş `upload.unreadable` yazar. Yalnızca yığın izinde görünür.
      reject(new Error("readDimensions failed"));
    };
    img.src = url;
  });
}

export function GalleryUploader() {
  const t = useTranslations("panel");
  const showError = useActionError();
  const [files, setFiles] = useState<FileState[]>([]);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function update(index: number, status: string, failed = false) {
    setFiles((prev) => prev.map((f, i) => (i === index ? { ...f, status, failed } : f)));
  }

  async function uploadAll(selected: File[]) {
    setBusy(true);
    setFiles(selected.map((f) => ({ name: f.name, status: t("upload.queued"), failed: false })));
    const uploaded: { storageKey: string; width: number; height: number }[] = [];

    for (const [i, file] of selected.entries()) {
      if (!ACCEPTED.includes(file.type)) {
        update(i, t("upload.onlyImages"), true);
        continue;
      }
      if (file.size > MAX_UPLOAD_BYTES) {
        update(i, t("upload.tooLarge"), true);
        continue;
      }
      try {
        update(i, t("upload.readingSize"));
        const { width, height } = await readDimensions(file);
        update(i, t("upload.uploading"));
        const res = await fetch("/api/upload/presign", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ kind: "gallery", contentType: file.type, contentLength: file.size }),
        });
        if (!res.ok) {
          update(i, t("upload.failed"), true);
          continue;
        }
        const { url, key } = await res.json();
        const put = await fetch(url, { method: "PUT", headers: { "content-type": file.type }, body: file });
        if (!put.ok) {
          update(i, t("upload.failed"), true);
          continue;
        }
        uploaded.push({ storageKey: key, width, height });
        update(i, t("upload.done"));
      } catch {
        update(i, t("upload.unreadable"), true);
      }
    }

    if (uploaded.length > 0) {
      const r = await addGalleryPhotos(uploaded);
      if (r.ok) {
        toast.success(t("gallery.uploaded", { count: uploaded.length }));
        router.refresh();
      } else {
        toast.error(showError(r));
      }
    } else {
      toast.error(t("gallery.uploadFailed"));
    }
    if (inputRef.current) inputRef.current.value = "";
    setBusy(false);
  }

  return (
    <div className="space-y-3">
      <Input
        ref={inputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp"
        disabled={busy}
        aria-label={t("gallery.inputLabel")}
        onChange={(e) => {
          const selected = Array.from(e.target.files ?? []);
          if (selected.length === 0) return;
          // Sınır depoya tek bayt gitmeden burada uygulanır: şema 24'ten fazlasını
          // zaten reddederdi, ama o noktada dosyalar çoktan yüklenmiş olurdu.
          if (selected.length > MAX_GALLERY_BATCH) {
            toast.error(t("gallery.tooManyFiles", { max: MAX_GALLERY_BATCH }));
            e.target.value = "";
            return;
          }
          uploadAll(selected);
        }}
      />
      <p className="text-xs text-muted-foreground">{t("gallery.uploadHint", { max: MAX_GALLERY_BATCH })}</p>
      {files.length > 0 && (
        <ul className="space-y-1 text-sm">
          {files.map((f, i) => (
            <li key={`${f.name}-${i}`} className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="truncate">{f.name}</span>
              <span className={cn("text-xs", f.failed ? "text-destructive" : "text-muted-foreground")}>{f.status}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
