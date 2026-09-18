"use client";

import { Fragment } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Link, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { cn } from "@/lib/utils";

/**
 * Üç dil, üç harf: TR · EN · FR. Açılır kutu yerine düz bağlantılar — seçenek
 * sayısı üçle sınırlı, hepsi aynı anda görünürse tıklama tek adıma iner ve
 * JavaScript beklemeden çalışır (her biri gerçek bir `<a>`).
 *
 * Bağlantı hedefi `usePathname()` + o anki sorgu dizesi: next-intl dil önekini
 * soyduğu için ziyaretçi hangi sayfadaysa o sayfanın öbür dildeki hâline gider,
 * ana sayfaya düşmez — ve galeri filtresi (`?etiket=`) ya da randevu
 * sihirbazının taşıdığı seçimler (`?s=&b=&t=`) dil değiştirirken kaybolmaz.
 *
 * Erişilebilir ad hem dilin kendi adını hem görünen kodu taşır ("Türkçe (TR)"):
 * ekran okuyucu kullanıcısı bağlantıyı listede gördüğü etiketle arayabilsin.
 */
type Tone = "default" | "inverted" | "hero";

const TONES: Record<Tone, { active: string; idle: string; separator: string }> = {
  default: { active: "text-primary", idle: "text-muted-foreground hover:text-foreground", separator: "text-border" },
  // Altbilginin zemini zaten terrakota: seçili dil orada renkle değil,
  // tam kontrastla ayrılır.
  inverted: {
    active: "text-primary-foreground",
    idle: "text-primary-foreground/55 hover:text-primary-foreground/85",
    separator: "text-primary-foreground/35",
  },
  hero: { active: "text-accent", idle: "text-hero-sand/75 hover:text-hero-sand", separator: "text-hero-sand/40" },
};

export function LocaleSwitcher({ tone = "default", className }: { tone?: Tone; className?: string }) {
  const active = useLocale();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations("common");
  const palette = TONES[tone];

  const query = searchParams.toString();
  const href = query ? `${pathname}?${query}` : pathname;

  return (
    <div
      role="group"
      aria-label={t("language")}
      className={cn("label flex items-center gap-0.5 text-[0.7rem]", className)}
    >
      {routing.locales.map((locale, i) => {
        const code = locale.toUpperCase();
        return (
          <Fragment key={locale}>
            {i > 0 && (
              <span aria-hidden="true" className={palette.separator}>
                ·
              </span>
            )}
            <Link
              href={href}
              locale={locale}
              aria-current={locale === active ? "true" : undefined}
              aria-label={`${t(`languages.${locale}`)} (${code})`}
              className={cn("px-1 py-0.5 transition-colors", locale === active ? palette.active : palette.idle)}
            >
              {code}
            </Link>
          </Fragment>
        );
      })}
    </div>
  );
}
