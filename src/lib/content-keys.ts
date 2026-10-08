/**
 * Panelden yönetilen ana sayfa metinlerinin anahtar listesi. Her anahtarın
 * karşılığında çeviri dosyasındaki yedek metnin yolu (`message`) ve dil başına
 * üst karakter sınırı (`max`) durur. Liste kodda yaşar: veritabanı bilinmeyen
 * bir anahtar kabul etmez, panel yalnızca buradakileri gösterir.
 *
 * Yer tutucu taşıyan metinler (`howItWorks.cancelNote`: `{minutes}`) düz
 * `{ad}` değişimiyle basılır; SSS cevapları da öyle (bkz. `FaqItem`).
 */
const TITLE = 60;
const NOTE = 200;

export const CONTENT_KEYS = {
  "hero.headline1": { message: "landing.hero.headline1", max: 40 },
  "hero.headline2": { message: "landing.hero.headline2", max: 40 },
  "hero.subtitle": { message: "landing.hero.subtitle", max: 160 },
  "howItWorks.title": { message: "landing.howItWorks.title", max: TITLE },
  "howItWorks.note": { message: "landing.howItWorks.note", max: NOTE },
  "howItWorks.step1Title": { message: "landing.howItWorks.step1Title", max: TITLE },
  "howItWorks.step1Text": { message: "landing.howItWorks.step1Text", max: 300 },
  "howItWorks.step2Title": { message: "landing.howItWorks.step2Title", max: TITLE },
  "howItWorks.step2Text": { message: "landing.howItWorks.step2Text", max: 300 },
  "howItWorks.step3Title": { message: "landing.howItWorks.step3Title", max: TITLE },
  "howItWorks.step3Text": { message: "landing.howItWorks.step3Text", max: 300 },
  "howItWorks.cancelNote": { message: "landing.howItWorks.cancelNote", max: 300 },
  "services.title": { message: "landing.services.title", max: TITLE },
  "services.note": { message: "landing.services.note", max: NOTE },
  "package.sectionNote": { message: "landing.package.sectionNote", max: NOTE },
  "package.note": { message: "landing.package.note", max: NOTE },
  "whyUs.title": { message: "landing.whyUs.title", max: TITLE },
  "whyUs.note": { message: "landing.whyUs.note", max: NOTE },
  "team.title": { message: "landing.team.title", max: TITLE },
  "team.note": { message: "landing.team.note", max: NOTE },
  "gallery.title": { message: "landing.gallery.title", max: TITLE },
  "gallery.note": { message: "landing.gallery.note", max: NOTE },
  "testimonials.title": { message: "landing.testimonials.title", max: TITLE },
  "testimonials.note": { message: "landing.testimonials.note", max: NOTE },
  "faq.title": { message: "landing.faq.title", max: TITLE },
  "faq.note": { message: "landing.faq.note", max: NOTE },
  "contact.title": { message: "landing.contact.title", max: TITLE },
  "contact.note": { message: "landing.contact.note", max: NOTE },
  "contact.formNote": { message: "landing.contact.formNote", max: NOTE },
  "footer.tagline": { message: "footer.tagline", max: 120 },
  "meta.homeTitle": { message: "meta.home.title", max: 70 },
  "meta.homeDescription": { message: "meta.home.description", max: 160 },
} as const;

export type ContentKey = keyof typeof CONTENT_KEYS;

export function isContentKey(key: string): key is ContentKey {
  return Object.prototype.hasOwnProperty.call(CONTENT_KEYS, key);
}

export const CONTENT_KEY_LIST = Object.keys(CONTENT_KEYS) as ContentKey[];
