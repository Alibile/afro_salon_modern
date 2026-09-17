import { parseTime, shopDayOfWeek, shopDayStart, addMinutes } from "./time";

export type HoursRow = { dayOfWeek: number; isOff: boolean; startTime: string; endTime: string };
export type ShopStatus = { isOpenToday: boolean; opensAt: string | null; closesAt: string | null; text: string };

/** Aktif berberlerin bugünkü çalışma satırlarını birleştirir: en erken açılış, en geç kapanış. */
export function getShopStatus(rows: HoursRow[], now: Date): ShopStatus {
  const dow = shopDayOfWeek(now);
  const today = rows.filter((r) => r.dayOfWeek === dow && !r.isOff);
  if (today.length === 0) return { isOpenToday: false, opensAt: null, closesAt: null, text: "Bugün kapalıyız" };
  const opensAt = today.map((r) => r.startTime).sort()[0];
  const closesAt = today.map((r) => r.endTime).sort().at(-1)!;
  const closeInstant = addMinutes(shopDayStart(now), parseTime(closesAt));
  if (now >= closeInstant) return { isOpenToday: true, opensAt, closesAt, text: "Bugün kapandık" };
  return { isOpenToday: true, opensAt, closesAt, text: `Bugün açık · ${opensAt}–${closesAt}` };
}
