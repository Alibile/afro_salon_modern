import { routing, type AppLocale } from "@/i18n/routing";
import { intlLocale } from "@/lib/intl";

/**
 * Para birimi her dilde lira: salon İstanbul'da, fiyat listesi çevrilmiyor,
 * yalnızca yazımı diline uyuyor. `Intl`in `style: "currency"` biçimi
 * kullanılmadı — Türkçede simgeyi başa alıyor ("₺400,00"), oysa dükkanın
 * yazılı fiyatları hep sonda simge taşıyor. Sayı `Intl`e bırakılır (binlik ve
 * ondalık ayraçlar dile göre), simgenin yeri burada karara bağlanır.
 */
const SYMBOL_FIRST: Record<AppLocale, boolean> = { tr: false, en: true, fr: false };

export function formatKurus(kurus: number, locale: AppLocale = routing.defaultLocale): string {
  const lira = kurus / 100;
  const amount = lira.toLocaleString(intlLocale(locale), { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return SYMBOL_FIRST[locale] ? `₺${amount}` : `${amount} ₺`;
}

/**
 * Satır içi fiyat düzenlemesinde girilen ham metni yorumlar. Boş alan bir
 * fiyat değildir (`Number("")` 0 verdiği için ayrı ele alınır); sayıya
 * çevrilemeyen değer geçersizdir.
 */
export type PriceInput = { kind: "empty" } | { kind: "invalid" } | { kind: "value"; lira: number };

export function parsePriceInput(raw: string): PriceInput {
  const trimmed = raw.trim();
  if (trimmed === "") return { kind: "empty" };
  const lira = Number(trimmed);
  if (!Number.isFinite(lira)) return { kind: "invalid" };
  return { kind: "value", lira };
}
