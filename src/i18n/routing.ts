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
