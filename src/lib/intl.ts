import { routing, type AppLocale } from "@/i18n/routing";

/**
 * Uygulama dili (`tr`) ile biçimlendirme etiketi (`tr-TR`) aynı şey değil.
 * İngilizce özellikle `en-GB`: salon İstanbul'da, tarihler her üç dilde de
 * gün–ay–yıl sırasıyla okunmalı (`en-US` "September 17, 2026" der).
 */
export const INTL_LOCALE: Record<AppLocale, string> = {
  tr: "tr-TR",
  en: "en-GB",
  fr: "fr-FR",
};

export function intlLocale(locale: string | undefined): string {
  return INTL_LOCALE[(locale ?? routing.defaultLocale) as AppLocale] ?? INTL_LOCALE[routing.defaultLocale];
}

/**
 * Haftanın gününün adı, o dilin kendi yazımıyla. Fransızca gün adları küçük
 * harfle başlar (`lundi`); burada liste başlığı olarak kullanıldıkları için ilk
 * harf büyütülür — cümle içinde geçmiyorlar.
 */
export function weekdayName(dayOfWeek: number, locale: string): string {
  // 2024-01-07 Pazar: dizinin 0'ı pazar olduğu için referans o gün.
  const reference = new Date(Date.UTC(2024, 0, 7 + dayOfWeek));
  const tag = intlLocale(locale);
  const name = new Intl.DateTimeFormat(tag, { weekday: "long", timeZone: "UTC" }).format(reference);
  return name.charAt(0).toLocaleUpperCase(tag) + name.slice(1);
}
