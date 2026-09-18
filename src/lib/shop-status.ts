import { parseTime, shopDayOfWeek, shopDayStart, addMinutes } from "./time";

export type HoursRow = { dayOfWeek: number; isOff: boolean; startTime: string; endTime: string };

/**
 * Durumun üç hâli. Sunucu metin değil hâl döndürür: aynı veriyle üç dil
 * beslenecek ve durum satırı hem hero'da hem altbilgide hem randevu sayfasında
 * kullanıcının dilinde basılacak (`common.status.*`).
 */
export type ShopState = "open" | "closedToday" | "closedNow";
export type ShopStatus = { isOpenToday: boolean; opensAt: string | null; closesAt: string | null; state: ShopState };

/** Aktif berberlerin bugünkü çalışma satırlarını birleştirir: en erken açılış, en geç kapanış. */
export function getShopStatus(rows: HoursRow[], now: Date): ShopStatus {
  const dow = shopDayOfWeek(now);
  const today = rows.filter((r) => r.dayOfWeek === dow && !r.isOff);
  if (today.length === 0) return { isOpenToday: false, opensAt: null, closesAt: null, state: "closedToday" };
  const opensAt = today.map((r) => r.startTime).sort()[0];
  const closesAt = today.map((r) => r.endTime).sort().at(-1)!;
  const closeInstant = addMinutes(shopDayStart(now), parseTime(closesAt));
  if (now >= closeInstant) return { isOpenToday: true, opensAt, closesAt, state: "closedNow" };
  return { isOpenToday: true, opensAt, closesAt, state: "open" };
}

/** `common.status` ad alanına bağlı bir çevirmenin durum satırını üretmesi için gereken kadarı. */
export type StatusTranslator = (key: ShopState, values?: Record<string, string>) => string;

/**
 * Durum satırının metni. Tek yerde durur: hero, altbilgi ve randevu başlığı
 * aynı cümleyi yazar, dili çağıran taraf getirir.
 */
export function shopStatusText(t: StatusTranslator, status: ShopStatus): string {
  if (status.state !== "open") return t(status.state);
  return t("open", { opensAt: status.opensAt ?? "", closesAt: status.closesAt ?? "" });
}
