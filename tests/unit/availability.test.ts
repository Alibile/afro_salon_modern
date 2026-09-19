import { describe, it, expect } from "vitest";
import { computeSlots, overlaps, type AvailabilityInput } from "@/lib/availability";

// dayStart: 2026-09-17 00:00 Istanbul = 2026-09-16T21:00Z
const DAY_START = new Date("2026-09-16T21:00:00Z");
const at = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return new Date(DAY_START.getTime() + (h * 60 + m) * 60_000);
};
const times = (slots: Date[]) =>
  slots.map((d) => {
    const mins = Math.round((d.getTime() - DAY_START.getTime()) / 60_000);
    return `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;
  });

const base: AvailabilityInput = {
  dayStart: DAY_START,
  workingIntervals: [{ startMinutes: 9 * 60, endMinutes: 12 * 60 }],
  busy: [],
  durationMinutes: 30,
  slotStepMinutes: 30,
  minLeadMinutes: 0,
  now: at("00:00"),
};

describe("overlaps", () => {
  it("detects overlap, treats touching as non-overlap", () => {
    expect(overlaps({ start: at("09:00"), end: at("10:00") }, { start: at("09:30"), end: at("10:30") })).toBe(true);
    expect(overlaps({ start: at("09:00"), end: at("10:00") }, { start: at("10:00"), end: at("11:00") })).toBe(false);
  });
});

describe("computeSlots", () => {
  it("normal day: every step until duration no longer fits", () => {
    expect(times(computeSlots(base))).toEqual(["09:00", "09:30", "10:00", "10:30", "11:00", "11:30"]);
  });

  it("longer duration cuts the tail", () => {
    expect(times(computeSlots({ ...base, durationMinutes: 90 }))).toEqual(["09:00", "09:30", "10:00", "10:30"]);
  });

  it("15-minute step", () => {
    const s = times(computeSlots({ ...base, slotStepMinutes: 15, workingIntervals: [{ startMinutes: 540, endMinutes: 600 }] }));
    expect(s).toEqual(["09:00", "09:15", "09:30"]);
  });

  it("drops slots before now + minLead", () => {
    const s = times(computeSlots({ ...base, now: at("09:50"), minLeadMinutes: 15 }));
    // 09:50 + 15 = 10:05 → ilk uygun 10:30
    expect(s).toEqual(["10:30", "11:00", "11:30"]);
  });

  it("excludes slots overlapping busy intervals (appointments / time off)", () => {
    const s = times(computeSlots({ ...base, busy: [{ start: at("10:00"), end: at("10:45") }] }));
    expect(s).toEqual(["09:00", "09:30", "11:00", "11:30"]);
  });

  it("supports lunch break via two working intervals", () => {
    const s = times(
      computeSlots({
        ...base,
        workingIntervals: [
          { startMinutes: 540, endMinutes: 720 },
          { startMinutes: 780, endMinutes: 840 },
        ],
      }),
    );
    expect(s).toEqual(["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "13:00", "13:30"]);
  });

  it("11:00-22:30 shift with the 45-minute package: last slot ends exactly at closing", () => {
    // Salonun gerçek vardiyası + tek paketin süresi; adım Ayarlar'dan gelir (15 dk).
    const s = times(
      computeSlots({
        ...base,
        workingIntervals: [{ startMinutes: 11 * 60, endMinutes: 22 * 60 + 30 }],
        durationMinutes: 45,
        slotStepMinutes: 15,
      }),
    );
    expect(s[0]).toBe("11:00");
    expect(s.at(-1)).toBe("21:45"); // 21:45 + 45 dk = 22:30, kapanışı aşmaz
    expect(s).toHaveLength(44);
  });

  it("no working intervals (closed day) → empty", () => {
    expect(computeSlots({ ...base, workingIntervals: [] })).toEqual([]);
  });

  it("after closing time → empty", () => {
    expect(computeSlots({ ...base, now: at("12:00") })).toEqual([]);
  });

  it("busy covering entire day → empty", () => {
    expect(computeSlots({ ...base, busy: [{ start: at("00:00"), end: at("23:59") }] })).toEqual([]);
  });

  it("returns Date objects sorted ascending", () => {
    const s = computeSlots(base);
    for (let i = 1; i < s.length; i++) expect(s[i].getTime()).toBeGreaterThan(s[i - 1].getTime());
  });
});
