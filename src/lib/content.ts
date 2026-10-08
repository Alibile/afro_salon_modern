import { asI18nText, type I18nText } from "@/lib/i18n-content";
import { isContentKey, type ContentKey } from "@/lib/content-keys";

/** Veritabanındaki içerik satırlarının anahtara göre haritası. */
export type ContentMap = Partial<Record<ContentKey, I18nText>>;

/**
 * Bir metnin ziyaretçiye basılacak hâli. Sıra: panelden girilen metnin
 * ziyaretçinin dilindeki karşılığı → panelden girilen Türkçe → çeviri
 * dosyasındaki yedek (`fallback`). Panel metni yarım çevrilmişse Türkçesi
 * çeviri dosyasının yabancı dilinin önüne geçer: salon kendi cümlesini
 * yazdıysa ziyaretçi o cümleyi görür, eskiyi değil.
 */
export function siteText(blocks: ContentMap, key: ContentKey, locale: string, fallback: string): string {
  const text = blocks[key];
  if (!text) return fallback;
  const translated = locale === "en" || locale === "fr" ? text[locale] : undefined;
  if (translated !== undefined && translated.trim() !== "") return translated;
  if (text.tr.trim() !== "") return text.tr;
  return fallback;
}

/**
 * Düz `{ad}` yer tutucuları. ICU değil: panelden giren metin çoğul kuralı
 * taşımaz, yalnızca sayı ve saat yazar. Bilinmeyen ad olduğu gibi kalır ki
 * bir yazım hatası sayfayı düşürmesin, görünsün.
 */
export function fillPlaceholders(text: string, values: Record<string, string | number>): string {
  return text.replace(/\{(\w+)\}/g, (whole, name: string) => (name in values ? String(values[name]) : whole));
}

/** Satırları haritaya indirger; bilinmeyen anahtar atlanır, bozuk değer boş Türkçeye iner. */
export function toContentMap(rows: { key: string; textI18n: unknown }[]): ContentMap {
  const map: ContentMap = {};
  for (const row of rows) {
    if (!isContentKey(row.key)) continue;
    map[row.key] = asI18nText(row.textI18n);
  }
  return map;
}
