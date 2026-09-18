"use client";
import { useTranslations } from "next-intl";
import { GALLERY_TAGS, orderTags } from "@/lib/gallery-tags";
import { MAX_TAGS, TAG_MIN_LENGTH, TAG_MAX_LENGTH, normalizeTags } from "@/lib/gallery-utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/**
 * Etiket seçimi: sabit kategori listesi çip grubu olarak, altında serbest
 * etiketler için tek bir metin alanı. Liste, landing'deki çiplerle aynı
 * kaynaktan (`GALLERY_TAGS`) gelir — panelde "Low Taper Fade" yazarken harf
 * hatası yapılırsa landing'de ayrı bir çip belirirdi.
 */
export function GalleryTagPicker({
  id,
  selected,
  custom,
  onSelectedChange,
  onCustomChange,
}: {
  id: string;
  /** Sabit listeden seçili etiketler. */
  selected: string[];
  /** Listede olmayan serbest etiketler, virgülle ayrılmış metin olarak. */
  custom: string;
  onSelectedChange: (tags: string[]) => void;
  onCustomChange: (value: string) => void;
}) {
  const t = useTranslations("panel.gallery");
  const total = selected.length + normalizeTags(custom).length;
  const full = total >= MAX_TAGS;

  function toggle(tag: string) {
    onSelectedChange(selected.includes(tag) ? selected.filter((t) => t !== tag) : orderTags([...selected, tag]));
  }

  return (
    <div className="space-y-2">
      <Label id={`tags-label-${id}`}>{t("tags")}</Label>
      <div className="flex flex-wrap gap-1.5" role="group" aria-labelledby={`tags-label-${id}`}>
        {GALLERY_TAGS.map((tag) => {
          const on = selected.includes(tag);
          return (
            <button
              key={tag}
              type="button"
              aria-pressed={on}
              disabled={!on && full}
              onClick={() => toggle(tag)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs transition-colors",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                on
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:border-foreground hover:text-foreground",
                !on && full && "cursor-not-allowed opacity-40 hover:border-border hover:text-muted-foreground",
              )}
            >
              {tag}
            </button>
          );
        })}
      </div>
      <div className="space-y-1">
        <Label htmlFor={`tags-other-${id}`} className="text-xs font-normal text-muted-foreground">
          {t("otherTags")}
        </Label>
        <Input
          id={`tags-other-${id}`}
          value={custom}
          placeholder={t("otherTagsPlaceholder")}
          onChange={(e) => onCustomChange(e.target.value)}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        {t("tagsHint", { count: total, max: MAX_TAGS, min: TAG_MIN_LENGTH, maxLength: TAG_MAX_LENGTH })}
      </p>
    </div>
  );
}
