import { TZDate } from "@date-fns/tz";
import { format } from "date-fns";
import { routing, type AppLocale } from "@/i18n/routing";
import { intlLocale } from "@/lib/intl";

export const SHOP_TZ = "Europe/Istanbul";

export function parseTime(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export function shopDayStart(instant: Date): Date {
  const z = new TZDate(instant, SHOP_TZ);
  const midnight = new TZDate(z.getFullYear(), z.getMonth(), z.getDate(), 0, 0, 0, 0, SHOP_TZ);
  return new Date(midnight.getTime());
}

export function shopDayOfWeek(instant: Date): number {
  return new TZDate(instant, SHOP_TZ).getDay();
}

export function addMinutes(d: Date, m: number): Date {
  return new Date(d.getTime() + m * 60_000);
}

/**
 * Dükkan takviminde `days` gün sonrasının 00:00'ı. Milisaniye toplamıyla değil
 * takvim günüyle ilerler: yaz saati uygulaması geri gelirse 24 saat eklemek
 * günü kaydırırdı, gün numarasını artırmak kaydırmaz.
 */
export function addDays(instant: Date, days: number): Date {
  const z = new TZDate(instant, SHOP_TZ);
  const midnight = new TZDate(z.getFullYear(), z.getMonth(), z.getDate() + days, 0, 0, 0, 0, SHOP_TZ);
  return new Date(midnight.getTime());
}

/** Günün dükkan saat dilimindeki anahtarı: "2026-09-19". Adres ve API dili bu. */
export function shopDateKey(instant: Date): string {
  return format(new TZDate(instant, SHOP_TZ), "yyyy-MM-dd");
}

/**
 * İki anın dükkan takvimindeki gün farkı: bugün 0, yarın 1, dün -1. "Bugün" /
 * "Yarın" etiketlerini saatten değil **günden** hesaplamak için: 23:50'de
 * alınan yarın 00:10 randevusu "10 dakika sonra" değil, "Yarın"dır.
 */
export function shopDayDelta(instant: Date, now: Date): number {
  return Math.round((shopDayStart(instant).getTime() - shopDayStart(now).getTime()) / 86_400_000);
}

/** Saat gösterimi dilden bağımsız: dükkan 24 saatlik yazımı her dilde kullanır. */
export function formatShopTime(d: Date): string {
  return format(new TZDate(d, SHOP_TZ), "HH:mm");
}

/**
 * Uzun tarih: gün, ay adı, yıl ve gün adı — dükkanın saat diliminde, sitenin
 * o anki dilinde. Ay ve gün adları `Intl`den gelir; sıralama da öyle, bu yüzden
 * üç dil için ayrı desen tutmaya gerek kalmaz.
 */
export function formatShopDate(d: Date, locale: AppLocale = routing.defaultLocale): string {
  return new Intl.DateTimeFormat(intlLocale(locale), {
    timeZone: SHOP_TZ,
    day: "numeric",
    month: "long",
    year: "numeric",
    weekday: "long",
  }).format(d);
}

/**
 * Kısa gün yazımı: gün çipleri için "Cum 25 Eyl" / "Fri 25 Sep" / "ven. 25 sept.".
 * Sıralama ve kısaltmalar `Intl`den gelir, üç dil için ayrı desen tutulmaz.
 */
export function formatShopDayShort(d: Date, locale: AppLocale = routing.defaultLocale): string {
  return new Intl.DateTimeFormat(intlLocale(locale), {
    timeZone: SHOP_TZ,
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(d);
}

/** "2026-09-17" + "13:00" → İstanbul'daki o anın UTC instant'ı */
export function shopDateTime(date: string, hhmm: string): Date {
  const [y, mo, d] = date.split("-").map(Number);
  const [h, mi] = hhmm.split(":").map(Number);
  return new Date(new TZDate(y, mo - 1, d, h, mi, 0, 0, SHOP_TZ).getTime());
}
