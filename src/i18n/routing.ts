import { hasLocale } from "next-intl";
import { defineRouting } from "next-intl/routing";

/**
 * Türkçe sitenin varsayılan dili ve URL'lerde öneksiz kalır (`/`, `/randevu`,
 * `/panel/...`); İngilizce ve Fransızca `/en`, `/fr` önekiyle gelir
 * (`localePrefix: "as-needed"`). Böylece Tur 1–4'te yayına giren Türkçe
 * adresler ve onlara verilen bağlantılar olduğu gibi çalışmaya devam eder.
 *
 * `localeDetection` açık: ilk ziyarette `NEXT_LOCALE` çerezi, yoksa
 * `Accept-Language` başlığı okunur. Dil anahtarıyla yapılan seçim aynı çereze
 * yazılır (next-intl standardı), böylece tercih sonraki ziyaretlerde korunur.
 */
export const routing = defineRouting({
  locales: ["tr", "en", "fr"],
  defaultLocale: "tr",
  localePrefix: "as-needed",
  localeDetection: true,
});

export type AppLocale = (typeof routing.locales)[number];

/**
 * Serbest bir dizeyi (veritabanı sütunu, form alanı, çerez) uygulama dil
 * birliğine indirger; tanınmayan değer varsayılana düşer. Tek yerde durur
 * çünkü aynı indirgeme hem oturumda, hem e-postalarda, hem profil
 * tercihinde gerekiyor.
 */
export function toAppLocale(value: string | null | undefined): AppLocale {
  return hasLocale(routing.locales, value) ? value : routing.defaultLocale;
}
