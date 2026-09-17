import { describe, it, expect } from "vitest";
import { parseTime, shopDayStart, shopDayOfWeek, addMinutes, formatShopTime, formatShopDate, shopDateTime } from "@/lib/time";

describe("time", () => {
  it("parseTime converts HH:mm to minutes", () => {
    expect(parseTime("00:00")).toBe(0);
    expect(parseTime("09:30")).toBe(570);
    expect(parseTime("19:00")).toBe(1140);
  });

  it("shopDayStart returns Istanbul midnight as UTC instant", () => {
    // 2026-09-17 01:30 Istanbul = 2026-09-16 22:30 UTC
    const instant = new Date("2026-09-16T22:30:00Z");
    expect(shopDayStart(instant).toISOString()).toBe("2026-09-16T21:00:00.000Z");
  });

  it("shopDayOfWeek uses Istanbul date", () => {
    // 2026-09-20 is Sunday. 2026-09-19 22:00 UTC = 2026-09-20 01:00 Istanbul
    expect(shopDayOfWeek(new Date("2026-09-19T22:00:00Z"))).toBe(0);
    expect(shopDayOfWeek(new Date("2026-09-17T09:00:00Z"))).toBe(4);
  });

  it("addMinutes", () => {
    expect(addMinutes(new Date("2026-09-17T09:00:00Z"), 45).toISOString()).toBe("2026-09-17T09:45:00.000Z");
  });

  it("formatShopTime / formatShopDate in Turkish", () => {
    const d = new Date("2026-09-17T11:30:00Z"); // 14:30 Istanbul
    expect(formatShopTime(d)).toBe("14:30");
    expect(formatShopDate(d)).toBe("17 Eylül 2026 Perşembe");
  });

  it("shopDateTime converts Istanbul date+time to UTC instant", () => {
    expect(shopDateTime("2026-09-17", "00:00").toISOString()).toBe("2026-09-16T21:00:00.000Z");
  });
});
