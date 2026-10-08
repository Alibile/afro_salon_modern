"use client";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { saveContentBlocks } from "@/actions/content";
import { useActionError } from "@/lib/use-action-error";
import { readI18nField, type I18nText } from "@/lib/i18n-content";
import type { ContentKey } from "@/lib/content-keys";
import { I18nTextField, I18nTextarea } from "../I18nField";

/** Panel formunun bir alanı: anahtar, etiket, dil başına yer tutucu (çeviri dosyasının metni), üst sınır. */
export type ContentField = {
  key: ContentKey;
  label: string;
  placeholder: { tr: string; en: string; fr: string };
  max: number;
  multiline?: boolean;
  /** Alanın altında tek satır ipucu (ör. yer tutucu listesi). */
  hint?: string;
};

/**
 * Bir bölümün metin alanları ve kendi Kaydet'i. Alan boşken yer tutucu
 * çeviri dosyasındaki metindir: yönetici neyi ezeceğini görür. Kaydet
 * yalnızca bu bölümün anahtarlarını gönderir; üç dili de boş alan satırını
 * siler (ana sayfa varsayılana döner).
 */
export function ContentTextForm({ fields, initial }: { fields: ContentField[]; initial: Partial<Record<ContentKey, I18nText>> }) {
  const t = useTranslations("panel.content");
  const tCommon = useTranslations("panel.common");
  const showError = useActionError();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <form
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const input = Object.fromEntries(fields.map((f) => [f.key, readI18nField(fd, f.key)]));
        start(async () => {
          const r = await saveContentBlocks(input);
          if (!r.ok) { setError(showError(r)); return; }
          setError(null);
          toast.success(t("saved"));
        });
      }}
    >
      {fields.map((f) =>
        f.multiline ? (
          <I18nTextarea key={f.key} name={f.key} label={f.label} defaultValue={initial[f.key]} placeholder={f.placeholder} maxLength={f.max} rows={3} hint={f.hint ?? t("emptyHint")} />
        ) : (
          <I18nTextField key={f.key} name={f.key} label={f.label} defaultValue={initial[f.key]} placeholder={f.placeholder} maxLength={f.max} hint={f.hint ?? t("emptyHint")} />
        ),
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>{tCommon("save")}</Button>
      </div>
    </form>
  );
}
