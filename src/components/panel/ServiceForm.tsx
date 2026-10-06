"use client";
import { useId, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { upsertService } from "@/actions/services";
import { useActionError } from "@/lib/use-action-error";
import { readI18nField, type I18nText } from "@/lib/i18n-content";
import { I18nTextField } from "./I18nField";
import { useNewRecordClose } from "./NewRecordPanel";

type Initial = { id: string; nameI18n: I18nText; durationMinutes: number; priceKurus: number; sortOrder: number };

export function ServiceForm({ initial, onDone }: { initial?: Initial; onDone?: () => void }) {
  const t = useTranslations("panel");
  const showError = useActionError();
  const closePanel = useNewRecordClose();
  const [pending, start] = useTransition();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  // `form.reset()` üç dilli alanı temizlemez (kendi durumunu tutar); yeni
  // hizmet eklendikten sonra anahtarı değişince bileşen sıfırdan kurulur.
  const [resetKey, setResetKey] = useState(0);
  // Yeni kayıt paneli ve satır içi düzenleme aynı anda açık olabilir: alan
  // id'leri forma özgü olmazsa etiketler öbür formun kutusuna bağlanırdı.
  const id = useId();
  return (
    <form
      className="grid gap-4 sm:grid-cols-3"
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
            closePanel();
          }
        });
      }}
    >
      <div className="sm:col-span-3">
        <I18nTextField key={resetKey} name="name" label={t("services.name")} defaultValue={initial?.nameI18n} maxLength={60} required hint={t("i18nField.hint")} />
      </div>
      <Field id={`${id}-durationMinutes`} label={t("services.duration")}>
        <Input id={`${id}-durationMinutes`} name="durationMinutes" type="number" step={5} min={5} defaultValue={initial?.durationMinutes ?? 30} required />
      </Field>
      <Field id={`${id}-priceLira`} label={t("services.price")}>
        <Input id={`${id}-priceLira`} name="priceLira" type="number" step="0.01" min={0} defaultValue={initial ? initial.priceKurus / 100 : ""} required />
      </Field>
      <Field id={`${id}-sortOrder`} label={t("services.sortOrder")}>
        <Input id={`${id}-sortOrder`} name="sortOrder" type="number" min={0} defaultValue={initial?.sortOrder ?? 0} />
      </Field>
      {error && <p className="text-sm text-destructive sm:col-span-3">{error}</p>}
      <div className="flex justify-end gap-2 sm:col-span-3">
        {initial && onDone && <Button type="button" variant="ghost" onClick={onDone}>{t("common.cancel")}</Button>}
        <Button type="submit" disabled={pending}>{initial ? t("common.save") : t("common.add")}</Button>
      </div>
    </form>
  );
}
