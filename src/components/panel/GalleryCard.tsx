"use client";
import { useState, useTransition } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { toast } from "sonner";
import { publicUrl } from "@/lib/storage-public";
import { updateGalleryPhoto, moveGalleryPhoto, deleteGalleryPhoto } from "@/actions/gallery";
import { normalizeTags } from "@/lib/gallery-utils";
import { splitTags } from "@/lib/gallery-tags";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GalleryTagPicker } from "./GalleryTagPicker";
import { DeleteButton } from "./DeleteButton";
import { useActionError } from "@/lib/use-action-error";
import type { ActionResult } from "@/lib/action-result";

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
  const t = useTranslations("panel");
  const showError = useActionError();
  const [caption, setCaption] = useState(photo.caption);
  // Kayıtlı etiketler forma bölünür: listedekiler çipe, gerisi "Diğer" alanına.
  const [selectedTags, setSelectedTags] = useState(() => splitTags(photo.tags).selected);
  const [customTags, setCustomTags] = useState(() => splitTags(photo.tags).custom);
  const [pending, start] = useTransition();
  const router = useRouter();

  /** İki alan tek diziye birleşir; tekilleştirmeyi `normalizeTags` yapar. */
  const tags = () => normalizeTags([...selectedTags, ...normalizeTags(customTags)]);

  function run(action: () => Promise<ActionResult<unknown>>, success: string) {
    start(async () => {
      const r = await action();
      if (!r.ok) {
        toast.error(showError(r));
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
          alt={photo.caption || t("gallery.photoAlt")}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 45vw, 90vw"
          className="object-cover"
        />
        {!photo.isActive && (
          <Badge variant="secondary" className="absolute left-2 top-2">
            {t("common.inactive")}
          </Badge>
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor={`caption-${photo.id}`}>{t("gallery.caption")}</Label>
        <Input
          id={`caption-${photo.id}`}
          value={caption}
          maxLength={120}
          placeholder={t("gallery.captionPlaceholder")}
          onChange={(e) => setCaption(e.target.value)}
        />
      </div>

      <GalleryTagPicker
        id={photo.id}
        selected={selectedTags}
        custom={customTags}
        onSelectedChange={setSelectedTags}
        onCustomChange={setCustomTags}
      />

      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          disabled={pending}
          onClick={() => run(() => updateGalleryPhoto(photo.id, { caption, tags: tags() }), t("gallery.saved"))}
        >
          {t("common.save")}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          disabled={pending}
          onClick={() => run(() => updateGalleryPhoto(photo.id, { isActive: !photo.isActive }), photo.isActive ? t("gallery.deactivated") : t("gallery.activated"))}
        >
          {photo.isActive ? t("common.deactivate") : t("common.activate")}
        </Button>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="outline"
            aria-label={t("gallery.moveUp")}
            disabled={pending || index === 0}
            onClick={() => run(() => moveGalleryPhoto(photo.id, "up"), t("gallery.reordered"))}
          >
            ↑
          </Button>
          <Button
            size="sm"
            variant="outline"
            aria-label={t("gallery.moveDown")}
            disabled={pending || index === total - 1}
            onClick={() => run(() => moveGalleryPhoto(photo.id, "down"), t("gallery.reordered"))}
          >
            ↓
          </Button>
        </div>
        <div className="ml-auto">
          <DeleteButton
            title={t("gallery.deleteTitle")}
            description={t("gallery.deleteDescription")}
            onConfirm={() => deleteGalleryPhoto(photo.id)}
            successMessage={t("gallery.deleted")}
          />
        </div>
      </div>
    </li>
  );
}
