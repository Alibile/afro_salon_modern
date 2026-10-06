"use client";
import { useTranslations } from "next-intl";

/**
 * Tamamlanan adımın tek satırlık özeti: solda adım adı ve seçim, sağda
 * "Değiştir". Adım yeniden açılınca sonraki seçimler düşer; o kararı çağıran
 * taraf (`BookingWizard`) verir, burası yalnızca düğmeyi basar.
 */
export function StepSummary({ step, title, value, onChange }: { step: 1 | 2; title: string; value: string; onChange: () => void }) {
  const t = useTranslations("booking");
  return (
    <div data-step={step} className="flex items-center justify-between gap-4 border-b border-border py-4">
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="truncate font-medium">{value}</p>
      </div>
      <button type="button" onClick={onChange} className="shrink-0 text-sm text-primary underline underline-offset-4 hover:text-foreground">
        {t("change")}
      </button>
    </div>
  );
}
