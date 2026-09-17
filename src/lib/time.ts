import { TZDate } from "@date-fns/tz";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

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

export function formatShopTime(d: Date): string {
  return format(new TZDate(d, SHOP_TZ), "HH:mm");
}

export function formatShopDate(d: Date): string {
  return format(new TZDate(d, SHOP_TZ), "d MMMM yyyy EEEE", { locale: tr });
}

/** "2026-09-17" + "13:00" → İstanbul'daki o anın UTC instant'ı */
export function shopDateTime(date: string, hhmm: string): Date {
  const [y, mo, d] = date.split("-").map(Number);
  const [h, mi] = hhmm.split(":").map(Number);
  return new Date(new TZDate(y, mo - 1, d, h, mi, 0, 0, SHOP_TZ).getTime());
}
