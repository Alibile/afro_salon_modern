"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { addGalleryPhotos } from "@/actions/gallery";
import { MAX_UPLOAD_BYTES } from "@/lib/upload-limits";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

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
      reject(new Error("Fotoğraf okunamadı"));
    };
    img.src = url;
  });
}

export function GalleryUploader() {
  const [files, setFiles] = useState<FileState[]>([]);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function update(index: number, status: string, failed = false) {
    setFiles((prev) => prev.map((f, i) => (i === index ? { ...f, status, failed } : f)));
  }

  async function uploadAll(selected: File[]) {
    setBusy(true);
    setFiles(selected.map((f) => ({ name: f.name, status: "Sırada", failed: false })));
    const uploaded: { storageKey: string; width: number; height: number }[] = [];

    for (const [i, file] of selected.entries()) {
      if (!ACCEPTED.includes(file.type)) {
        update(i, "Sadece JPEG, PNG veya WebP yüklenebilir", true);
        continue;
      }
      if (file.size > MAX_UPLOAD_BYTES) {
        update(i, "Dosya en fazla 8 MB olabilir", true);
        continue;
      }
      try {
        update(i, "Boyut okunuyor…");
        const { width, height } = await readDimensions(file);
        update(i, "Yükleniyor…");
        const res = await fetch("/api/upload/presign", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ kind: "gallery", contentType: file.type, contentLength: file.size }),
        });
        if (!res.ok) {
          update(i, (await res.json().catch(() => ({}))).error ?? "Yükleme başarısız", true);
          continue;
        }
        const { url, key } = await res.json();
        const put = await fetch(url, { method: "PUT", headers: { "content-type": file.type }, body: file });
        if (!put.ok) {
          update(i, "Yükleme başarısız", true);
          continue;
        }
        uploaded.push({ storageKey: key, width, height });
        update(i, "Yüklendi");
      } catch {
        update(i, "Fotoğraf okunamadı", true);
      }
    }

    if (uploaded.length > 0) {
      const r = await addGalleryPhotos(uploaded);
      if (r.ok) {
        toast.success(`${uploaded.length} fotoğraf galeriye eklendi`);
        router.refresh();
      } else {
        toast.error(r.error);
      }
    } else {
      toast.error("Hiçbir fotoğraf yüklenemedi");
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
        aria-label="Galeriye fotoğraf yükle"
        onChange={(e) => {
          const selected = Array.from(e.target.files ?? []);
          if (selected.length > 0) uploadAll(selected);
        }}
      />
      <p className="text-xs text-muted-foreground">
        Birden çok dosya seçebilirsin. JPEG, PNG veya WebP; dosya başına en fazla 8 MB. Yüklenen fotoğraflar listenin
        sonuna eklenir, etiketlerini aşağıdan verirsin.
      </p>
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
