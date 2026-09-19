import { addDays, shopDateKey, shopDayOfWeek, shopDayStart } from "@/lib/time";

/**
 * Randevu penceresi: **bugün + 6 gün**, yani bugünden başlayan yedi günlük kayan
 * pencere. Pazar (haftanın 0. günü) salon kapalı olduğu için pencereden hiç
 * geçmez: yedi günlük pencere her zaman tam bir Pazar içerdiği için geriye
 * her zaman altı gün kalır.
 *
 * Pencere tek bir yerde tanımlı: sihirbazın çipleri, `/api/availability` ve
 * randevuyu yazan server action aynı listeye bakar. Tarih anahtarı hep dükkanın
 * saat dilimindedir (`Europe/Istanbul`); ziyaretçinin cihaz saati başka bir
 * günde olsa bile salon için hangi gün olduğu değişmez.
 */
export const BOOKING_HORIZON_DAYS = 7;

/** Salonun kapalı olduğu gün (JS `Date.getDay()` yazımıyla: 0 = Pazar). */
export const CLOSED_DAY_OF_WEEK = 0;

export type BookableDay = {
  /** Dükkan saat diliminde günün anahtarı: "2026-09-19". */
  dateKey: string;
  /** O günün 00:00'ı, UTC instant olarak. */
  dayStart: Date;
  /** 0 = Pazar … 6 = Cumartesi (dükkan saat diliminde). */
  dayOfWeek: number;
  isToday: boolean;
};

/** Pencereye giren günler, bugünden başlayarak sırayla; Pazar atlanır. */
export function bookableDays(now: Date): BookableDay[] {
  const today = shopDayStart(now);
  const days: BookableDay[] = [];
  for (let offset = 0; offset < BOOKING_HORIZON_DAYS; offset += 1) {
    const dayStart = offset === 0 ? today : addDays(today, offset);
    const dayOfWeek = shopDayOfWeek(dayStart);
    if (dayOfWeek === CLOSED_DAY_OF_WEEK) continue;
    days.push({ dateKey: shopDateKey(dayStart), dayStart, dayOfWeek, isToday: offset === 0 });
  }
  return days;
}

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Dışarıdan gelen bir tarih anahtarını (adres çubuğu, API sorgusu, randevu
 * gövdesi) pencereye göre doğrular. Pencere dışı, Pazar, geçmiş ya da bozuk bir
 * değer `null` döner — çağıran taraf onu `errors.dateOutOfRange`'e çevirir.
 */
export function parseBookableDate(dateKey: string, now: Date): Date | null {
  if (!DATE_KEY.test(dateKey)) return null;
  return bookableDays(now).find((day) => day.dateKey === dateKey)?.dayStart ?? null;
}
