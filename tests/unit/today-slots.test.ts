import { describe, it, expect } from "vitest";
import { countOpenSlots, freeWindows, type SlotCountInput } from "@/lib/queries/today-slots";

// dayStart: 2026-09-17 00:00 Istanbul = 2026-09-16T21:00Z (availability testiyle aynı gün)
const DAY_START = new Date("2026-09-16T21:00:00Z");
const at = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return new Date(DAY_START.getTime() + (h * 60 + m) * 60_000);
};
/** Salonun gerçek vardiyası: 11:00–22:30. */
const SHIFT = [{ startMinutes: 11 * 60, endMinutes: 22 * 60 + 30 }];

const base: SlotCountInput = {
  dayStart: DAY_START,
  barbers: [{ workingIntervals: SHIFT, busy: [] }],
  durationMinutes: 45,
  minLeadMinutes: 15,
  now: at("10:00"),
};

describe("freeWindows", () => {
  it("dolu bloğu çalışma aralığından keser", () => {
    expect(freeWindows([{ startMinutes: 660, endMinutes: 1350 }], [{ startMinutes: 720, endMinutes: 765 }])).toEqual([
      { startMinutes: 660, endMinutes: 720 },
      { startMinutes: 765, endMinutes: 1350 },
    ]);
  });

  it("üst üste binen bloklar tek kesik sayılır, dışarıdakiler yok sayılır", () => {
    const windows = freeWindows(
      [{ startMinutes: 660, endMinutes: 900 }],
      [
        { startMinutes: 700, endMinutes: 760 },
        { startMinutes: 740, endMinutes: 800 },
        { startMinutes: 1000, endMinutes: 1100 },
      ],
    );
    expect(windows).toEqual([
      { startMinutes: 660, endMinutes: 700 },
      { startMinutes: 800, endMinutes: 900 },
    ]);
  });

  it("günü baştan sona kaplayan blok pencere bırakmaz", () => {
    expect(freeWindows([{ startMinutes: 660, endMinutes: 900 }], [{ startMinutes: 0, endMinutes: 1439 }])).toEqual([]);
  });
});

describe("countOpenSlots", () => {
  it("tek berber, boş gün: 11:00–22:30 vardiyasına 45 dakikalık 15 randevu sığar", () => {
    // 690 dakikalık vardiya / 45 = 15 (son randevu 21:45–22:30).
    expect(countOpenSlots(base)).toBe(15);
  });

  it("iki berber ayrı koltuklardır: kapasiteler toplanır", () => {
    const slots = countOpenSlots({
      ...base,
      barbers: [
        { workingIntervals: SHIFT, busy: [] },
        { workingIntervals: SHIFT, busy: [] },
      ],
    });
    expect(slots).toBe(30);
  });

  it("dolu bir randevu kapasiteyi bir azaltır", () => {
    // 12:00–12:45 randevusu iki boş pencere bırakır: 11:00–12:00 (bir randevu)
    // ve 12:45–22:30 (13 randevu). Sayım dolu bloğun bittiği yerden yeniden
    // başlar, ızgaranın kaldığı yerden değil.
    const withAppointment = countOpenSlots({
      ...base,
      barbers: [{ workingIntervals: SHIFT, busy: [{ start: at("12:00"), end: at("12:45") }] }],
    });
    expect(withAppointment).toBe(14);
  });

  it("öğle arası (iki çalışma aralığı) her parçası kendi içinde sayılır", () => {
    const slots = countOpenSlots({
      ...base,
      barbers: [
        {
          workingIntervals: [
            { startMinutes: 11 * 60, endMinutes: 13 * 60 },
            { startMinutes: 14 * 60, endMinutes: 16 * 60 },
          ],
          busy: [],
        },
      ],
    });
    // İki saatlik her parçaya 45 dakikalık iki randevu sığar.
    expect(slots).toBe(4);
  });

  it("gün ilerledikçe düşer: geçmiş saatler ve hazırlık payı sayılmaz", () => {
    // 21:00 + 15 dk hazırlık → geriye tek bir 45 dakikalık randevu kalır.
    expect(countOpenSlots({ ...base, now: at("21:00") })).toBe(1);
  });

  it("kapanıştan sonra ve bugün çalışmayan berberde sıfır", () => {
    expect(countOpenSlots({ ...base, now: at("22:00") })).toBe(0);
    expect(countOpenSlots({ ...base, barbers: [{ workingIntervals: [], busy: [] }] })).toBe(0);
  });

  it("aktif berber yoksa ya da süre geçersizse sıfır", () => {
    expect(countOpenSlots({ ...base, barbers: [] })).toBe(0);
    expect(countOpenSlots({ ...base, durationMinutes: 0 })).toBe(0);
  });

  it("gün boyu izinli berber sayıma girmez, çalışan ortağı girer", () => {
    const slots = countOpenSlots({
      ...base,
      barbers: [
        { workingIntervals: SHIFT, busy: [{ start: at("00:00"), end: at("23:59") }] },
        { workingIntervals: SHIFT, busy: [] },
      ],
    });
    expect(slots).toBe(15);
  });
});
