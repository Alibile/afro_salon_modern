"use client";
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
  const total = selected.length + normalizeTags(custom).length;
  const full = total >= MAX_TAGS;

  function toggle(tag: string) {
    onSelectedChange(selected.includes(tag) ? selected.filter((t) => t !== tag) : orderTags([...selected, tag]));
  }

  return (
    <div className="space-y-2">
      <Label id={`tags-label-${id}`}>Etiketler</Label>
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
          Diğer etiketler
        </Label>
        <Input
          id={`tags-other-${id}`}
          value={custom}
          placeholder="Virgülle ayır: Dalga, Desen"
          onChange={(e) => onCustomChange(e.target.value)}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Seçili: {total}. En az bir etiket zorunlu; en fazla {MAX_TAGS} etiket, her biri {TAG_MIN_LENGTH}–
        {TAG_MAX_LENGTH} karakter.
      </p>
    </div>
  );
}
