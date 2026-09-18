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

/** "2026-09-17" + "13:00" → İstanbul'daki o anın UTC instant'ı */
export function shopDateTime(date: string, hhmm: string): Date {
  const [y, mo, d] = date.split("-").map(Number);
  const [h, mi] = hhmm.split(":").map(Number);
  return new Date(new TZDate(y, mo - 1, d, h, mi, 0, 0, SHOP_TZ).getTime());
}
