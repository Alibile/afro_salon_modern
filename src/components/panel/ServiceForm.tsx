"use client";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { upsertService } from "@/actions/services";
import { useActionError } from "@/lib/use-action-error";
import { readI18nField, type I18nText } from "@/lib/i18n-content";
import { I18nTextField } from "./I18nField";

type Initial = { id: string; nameI18n: I18nText; durationMinutes: number; priceKurus: number; sortOrder: number };

export function ServiceForm({ initial, onDone }: { initial?: Initial; onDone?: () => void }) {
  const t = useTranslations("panel");
  const showError = useActionError();
  const [pending, start] = useTransition();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  // `form.reset()` üç dilli alanı temizlemez (kendi durumunu tutar); yeni
  // hizmet eklendikten sonra anahtarı değişince bileşen sıfırdan kurulur.
  const [resetKey, setResetKey] = useState(0);
  return (
    <form
      className="grid gap-3 sm:grid-cols-4"
      onSubmit={(e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const fd = new FormData(form);
        start(async () => {
          const r = await upsertService({
            id: initial?.id,
            name: readI18nField(fd, "name"),
            durationMinutes: Number(fd.get("durationMinutes")),
            priceLira: Number(fd.get("priceLira")),
            sortOrder: Number(fd.get("sortOrder")),
          });
          if (!r.ok) { setError(showError(r)); return; }
          setError(null);
          toast.success(initial ? t("services.updated") : t("services.added"));
          router.refresh();
          onDone?.();
          if (!initial) {
            form.reset();
            setResetKey((k) => k + 1);
          }
        });
      }}
    >
      <div className="sm:col-span-4">
        <I18nTextField key={resetKey} name="name" label={t("services.name")} defaultValue={initial?.nameI18n} maxLength={60} required />
      </div>
      <div><Label htmlFor="durationMinutes">{t("services.duration")}</Label><Input id="durationMinutes" name="durationMinutes" type="number" step={5} min={5} defaultValue={initial?.durationMinutes ?? 30} required /></div>
      <div><Label htmlFor="priceLira">{t("services.price")}</Label><Input id="priceLira" name="priceLira" type="number" step="0.01" min={0} defaultValue={initial ? initial.priceKurus / 100 : ""} required /></div>
      <div><Label htmlFor="sortOrder">{t("services.sortOrder")}</Label><Input id="sortOrder" name="sortOrder" type="number" min={0} defaultValue={initial?.sortOrder ?? 0} /></div>
      <p className="text-xs text-muted-foreground sm:col-span-4">{t("i18nField.hint")}</p>
      {error && <p className="text-sm text-destructive sm:col-span-4">{error}</p>}
      <Button type="submit" disabled={pending} className="sm:col-span-4">{initial ? t("common.save") : t("common.add")}</Button>
    </form>
  );
}
