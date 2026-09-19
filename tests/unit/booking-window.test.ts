import { describe, it, expect } from "vitest";
import { BOOKING_HORIZON_DAYS, bookableDays, parseBookableDate } from "@/lib/booking-window";

// 2026-09-17 Perşembe, 2026-09-19 Cumartesi, 2026-09-20 Pazar.
const THURSDAY = new Date("2026-09-17T07:00:00Z"); // 10:00 İstanbul
const SATURDAY = new Date("2026-09-19T07:00:00Z");
const SUNDAY = new Date("2026-09-20T07:00:00Z");

const keys = (now: Date) => bookableDays(now).map((d) => d.dateKey);

describe("bookableDays", () => {
  it("bugünden başlar, Pazarı atlar", () => {
    expect(keys(THURSDAY)).toEqual([
      "2026-09-17",
      "2026-09-18",
      "2026-09-19",
      // 20 Eylül Pazar: salon kapalı, listede hiç görünmez.
      "2026-09-21",
      "2026-09-22",
      "2026-09-23",
    ]);
  });

  it("yedi günlük pencerede her zaman tam bir Pazar olduğu için altı gün kalır", () => {
    for (const now of [THURSDAY, SATURDAY, SUNDAY]) {
      expect(bookableDays(now)).toHaveLength(BOOKING_HORIZON_DAYS - 1);
    }
  });

  it("Cumartesi başlangıcında ertesi gün Pazartesidir", () => {
    expect(keys(SATURDAY)).toEqual([
      "2026-09-19",
      "2026-09-21",
      "2026-09-22",
      "2026-09-23",
      "2026-09-24",
      "2026-09-25",
    ]);
  });

  // Pazar günü açılan sayfada "bugün" diye bir seçenek yok: pencere yarından
  // başlar ve hiçbir gün `isToday` değildir.
  it("Pazar günü bugünü hiç listelemez", () => {
    expect(keys(SUNDAY)[0]).toBe("2026-09-21");
    expect(bookableDays(SUNDAY).some((d) => d.isToday)).toBe(false);
  });

  it("gün dükkanın saat diliminde seçilir: 23:30 İstanbul hâlâ o gündür", () => {
    // 2026-09-17T20:30Z = 23:30 İstanbul; UTC'de de aynı gün ama sınır yakın.
    expect(keys(new Date("2026-09-17T20:30:00Z"))[0]).toBe("2026-09-17");
    // 2026-09-17T21:30Z = 18 Eylül 00:30 İstanbul: dükkan için ertesi gün.
    expect(keys(new Date("2026-09-17T21:30:00Z"))[0]).toBe("2026-09-18");
  });

  it("gün başlangıcı dükkan gece yarısının UTC karşılığıdır", () => {
    const [today, tomorrow] = bookableDays(THURSDAY);
    expect(today.dayStart.toISOString()).toBe("2026-09-16T21:00:00.000Z");
    expect(today.isToday).toBe(true);
    expect(today.dayOfWeek).toBe(4);
    expect(tomorrow.dayStart.toISOString()).toBe("2026-09-17T21:00:00.000Z");
    expect(tomorrow.isToday).toBe(false);
  });
});

describe("parseBookableDate", () => {
  it("pencere içindeki günü o günün başlangıcına çevirir", () => {
    expect(parseBookableDate("2026-09-18", THURSDAY)?.toISOString()).toBe("2026-09-17T21:00:00.000Z");
    expect(parseBookableDate("2026-09-23", THURSDAY)?.toISOString()).toBe("2026-09-22T21:00:00.000Z");
  });

  it("sekizinci günü, Pazarı ve geçmişi reddeder", () => {
    expect(parseBookableDate("2026-09-24", THURSDAY)).toBeNull(); // pencerenin bir günü ötesi
    expect(parseBookableDate("2026-09-20", THURSDAY)).toBeNull(); // Pazar
    expect(parseBookableDate("2026-09-16", THURSDAY)).toBeNull(); // dün
  });

  it("bozuk biçimi reddeder", () => {
    for (const value of ["", "bugün", "2026-9-18", "18-09-2026", "2026-09-18T10:00:00Z"]) {
      expect(parseBookableDate(value, THURSDAY), value).toBeNull();
    }
  });
});
