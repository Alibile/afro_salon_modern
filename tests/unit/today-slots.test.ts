import { describe, it, expect } from "vitest";
import { countOpenSlots, type SlotCountInput } from "@/lib/queries/today-slots";

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
  slotStepMinutes: 15,
  minLeadMinutes: 15,
  now: at("00:00"),
};

describe("countOpenSlots", () => {
  it("tek berber, boş gün: 45 dakikalık paket 11:00–22:30 vardiyasına 44 kez sığar", () => {
    expect(countOpenSlots(base)).toBe(44);
  });

  it("iki berber ayrı seçeneklerdir: aynı saatler tekilleştirilmez", () => {
    const slots = countOpenSlots({
      ...base,
      barbers: [
        { workingIntervals: SHIFT, busy: [] },
        { workingIntervals: SHIFT, busy: [] },
      ],
    });
    expect(slots).toBe(88);
  });

  it("randevu ve izin doluluğu sayıdan düşer", () => {
    // 12:00–12:45 randevusu beş adayla çakışır: 11:30, 11:45, 12:00, 12:15, 12:30.
    // 11:15 tam 12:00'de biter — değen aralıklar çakışmaz (bkz. `overlaps`).
    const withAppointment = countOpenSlots({
      ...base,
      barbers: [{ workingIntervals: SHIFT, busy: [{ start: at("12:00"), end: at("12:45") }] }],
    });
    expect(withAppointment).toBe(44 - 5);
  });

  it("gün ilerledikçe düşer: geçmiş saatler ve hazırlık payı sayılmaz", () => {
    const evening = countOpenSlots({ ...base, now: at("21:00") });
    // 21:00 + 15 dk hazırlık → 21:15, 21:30 ve 21:45 kalır (21:45 + 45 dk = 22:30).
    expect(evening).toBe(3);
  });

  it("kapanıştan sonra ve bugün çalışmayan berberde sıfır", () => {
    expect(countOpenSlots({ ...base, now: at("22:00") })).toBe(0);
    expect(countOpenSlots({ ...base, barbers: [{ workingIntervals: [], busy: [] }] })).toBe(0);
  });

  it("aktif berber yoksa sıfır", () => {
    expect(countOpenSlots({ ...base, barbers: [] })).toBe(0);
  });

  it("gün boyu izinli berber sayıma girmez, çalışan ortağı girer", () => {
    const slots = countOpenSlots({
      ...base,
      barbers: [
        { workingIntervals: SHIFT, busy: [{ start: at("00:00"), end: at("23:59") }] },
        { workingIntervals: SHIFT, busy: [] },
      ],
    });
    expect(slots).toBe(44);
  });
});
