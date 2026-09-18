"use client";
import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { useRouter, usePathname } from "@/i18n/navigation";
import { Label } from "@/components/ui/label";
import { routing, type AppLocale } from "@/i18n/routing";
import { updateOwnLocale } from "@/actions/profile";
import { useActionError } from "@/lib/use-action-error";

/**
 * Dil tercihi iki ayrı şeyi aynı anda yapar ve ikisi de gerekli:
 *
 * 1. `updateOwnLocale` tercihi `User.locale`'e yazar — adresin olmadığı
 *    yerlerde (randevu e-postaları, sonraki oturum açılışı) dil budur.
 * 2. `router.replace(pathname, { locale })` kullanıcıyı aynı sayfanın yeni
 *    dilindeki adresine taşır (`/panel/profil` → `/fr/panel/profil`). Panelin
 *    o anki dili adresten gelir, tercihten değil; yazmak yetmez, taşımak da
 *    gerekir.
 *
 * Yazma başarısız olursa adres değişmez: kullanıcı kaydedilmemiş bir tercihi
 * kaydedilmiş sanmaz.
 */
export function LanguageForm() {
  const t = useTranslations("panel.profile");
  const tc = useTranslations("common");
  const showError = useActionError();
  const current = useLocale() as AppLocale;
  const [pending, start] = useTransition();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="grid gap-2 sm:max-w-sm">
      <Label htmlFor="locale">{t("languageLabel")}</Label>
      <select
        id="locale"
        name="locale"
        defaultValue={current}
        disabled={pending}
        className="w-full rounded-md border bg-background px-3 py-2"
        onChange={(e) => {
          const next = e.target.value as AppLocale;
          if (next === current) return;
          start(async () => {
            const r = await updateOwnLocale(next);
            if (!r.ok) {
              toast.error(showError(r));
              return;
            }
            toast.success(t("languageSaved"));
            router.replace(pathname, { locale: next });
          });
        }}
      >
        {routing.locales.map((locale) => (
          <option key={locale} value={locale}>
            {tc(`languages.${locale}`)}
          </option>
        ))}
      </select>
      <p className="text-xs text-muted-foreground">{t("languageHint")}</p>
    </div>
  );
}
