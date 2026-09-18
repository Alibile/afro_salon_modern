import { routing, type AppLocale } from "@/i18n/routing";
import { formatCount } from "@/lib/motion-utils";

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

/**
 * Yüzde işaretinin yeri dile göre değişir: Türkçede sayıdan **önce** (`%95`),
 * İngilizcede bitişik sonra (`95%`), Fransızcada araya dar bölünmez boşlukla
 * sonra (`95 %` — U+202F). `money.ts`'deki `SYMBOL_FIRST` ile aynı desen:
 * sayıyı biçimlendiren taraf ayrı, işaretin yerini karara bağlayan taraf ayrı.
 *
 * Önek/sonek olarak döner çünkü tek tüketicisi `CountUp`: sayaç yalnızca
 * *sayıyı* canlandırır, işaret her karede olduğu gibi yanında durur.
 */
const PERCENT_AFFIX: Record<AppLocale, { prefix: string; suffix: string }> = {
  tr: { prefix: "%", suffix: "" },
  en: { prefix: "", suffix: "%" },
  fr: { prefix: "", suffix: "\u202F%" },
};

export function percentAffix(locale: AppLocale): { prefix: string; suffix: string } {
  return PERCENT_AFFIX[locale] ?? PERCENT_AFFIX[routing.defaultLocale];
}

/**
 * `CountUp`'ın son karede bastığı metnin aynısı. Bileşen sayıyı canlandırırken
 * `formatCount`'u aynı önek/sonekle çağırır; birim testi bu fonksiyonu ölçer ki
 * iki yol tek kaynaktan beslensin.
 */
export function formatPercent(value: number, locale: AppLocale): string {
  const { prefix, suffix } = percentAffix(locale);
  return formatCount(value, prefix, suffix);
}
