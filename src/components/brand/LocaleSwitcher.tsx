"use client";

import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Link, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { cn } from "@/lib/utils";

/**
 * Üç dil, üç kısa bağlantı: TR, EN, FR. Açılır kutu yerine düz bağlantılar — seçenek
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

const TONES: Record<Tone, { active: string; idle: string }> = {
  default: { active: "text-foreground", idle: "text-muted-foreground hover:text-foreground" },
  // Altbilginin zemini zaten terrakota: seçili dil orada renkle değil,
  // tam kontrastla ayrılır.
  inverted: { active: "text-primary-foreground", idle: "text-primary-foreground/55 hover:text-primary-foreground/85" },
  hero: { active: "text-hero-sand", idle: "text-hero-sand/65 hover:text-hero-sand" },
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
      className={cn("flex items-center gap-1 text-xs font-medium", className)}
    >
      {routing.locales.map((locale) => {
        const code = locale.toUpperCase();
        const current = locale === active;
        return (
          <Link
            key={locale}
            href={href}
            locale={locale}
            aria-current={current ? "true" : undefined}
            aria-label={`${t(`languages.${locale}`)} (${code})`}
            className={cn(
              "flex h-8 min-w-8 items-center justify-center px-1.5 transition-colors",
              // Seçili dil alt çizgiyle işaretlenir: renk tek başına koyu
              // temada ve terrakota altbilgide yeterince ayırmıyordu.
              current && "underline decoration-2 underline-offset-4",
              current ? palette.active : palette.idle,
            )}
          >
            {code}
          </Link>
        );
      })}
    </div>
  );
}
