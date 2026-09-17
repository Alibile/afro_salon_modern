"use client";
import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { publicUrl } from "@/lib/storage-public";
import { updateGalleryPhoto, moveGalleryPhoto, deleteGalleryPhoto } from "@/actions/gallery";
import { MAX_TAGS, TAG_MIN_LENGTH, TAG_MAX_LENGTH } from "@/lib/gallery-utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DeleteButton } from "./DeleteButton";

export type PanelGalleryPhoto = {
  id: string;
  storageKey: string;
  caption: string;
  tags: string[];
  width: number;
  height: number;
  isActive: boolean;
};

export function GalleryCard({ photo, index, total }: { photo: PanelGalleryPhoto; index: number; total: number }) {
  const [caption, setCaption] = useState(photo.caption);
  const [tags, setTags] = useState(photo.tags.join(", "));
  const [pending, start] = useTransition();
  const router = useRouter();

  function run(action: () => Promise<{ ok: boolean; error?: string }>, success: string) {
    start(async () => {
      const r = await action();
      if (!r.ok) {
        toast.error(r.error ?? "İşlem tamamlanamadı");
        return;
      }
      toast.success(success);
      router.refresh();
    });
  }

  return (
    <li className="flex flex-col gap-3 rounded-xl border bg-card p-3">
      <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-muted">
        <Image
          src={publicUrl(photo.storageKey)}
          alt={photo.caption || "Galeri fotoğrafı"}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 45vw, 90vw"
          className="object-cover"
        />
        {!photo.isActive && (
          <Badge variant="secondary" className="absolute left-2 top-2">
            Pasif
          </Badge>
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor={`caption-${photo.id}`}>Başlık</Label>
        <Input
          id={`caption-${photo.id}`}
          value={caption}
          maxLength={120}
          placeholder="Örn. Keskin geçişli fade"
          onChange={(e) => setCaption(e.target.value)}
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor={`tags-${photo.id}`}>Etiketler</Label>
        <Input
          id={`tags-${photo.id}`}
          value={tags}
          placeholder="Fade, Line-up"
          onChange={(e) => setTags(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Virgülle ayır. En fazla {MAX_TAGS} etiket, her biri {TAG_MIN_LENGTH}–{TAG_MAX_LENGTH} karakter.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" disabled={pending} onClick={() => run(() => updateGalleryPhoto(photo.id, { caption, tags }), "Fotoğraf kaydedildi")}>
          Kaydet
        </Button>
        <Button
          size="sm"
          variant="secondary"
          disabled={pending}
          onClick={() => run(() => updateGalleryPhoto(photo.id, { isActive: !photo.isActive }), photo.isActive ? "Fotoğraf pasife alındı" : "Fotoğraf yayına alındı")}
        >
          {photo.isActive ? "Pasife al" : "Aktif et"}
        </Button>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="outline"
            aria-label="Yukarı taşı"
            disabled={pending || index === 0}
            onClick={() => run(() => moveGalleryPhoto(photo.id, "up"), "Sıra güncellendi")}
          >
            ↑
          </Button>
          <Button
            size="sm"
            variant="outline"
            aria-label="Aşağı taşı"
            disabled={pending || index === total - 1}
            onClick={() => run(() => moveGalleryPhoto(photo.id, "down"), "Sıra güncellendi")}
          >
            ↓
          </Button>
        </div>
        <div className="ml-auto">
          <DeleteButton
            title="Fotoğraf silinsin mi?"
            description="Fotoğraf galeriden ve depodan kalıcı olarak silinecek. Bu işlem geri alınamaz."
            onConfirm={() => deleteGalleryPhoto(photo.id)}
            successMessage="Fotoğraf silindi"
          />
        </div>
      </div>
    </li>
  );
}
