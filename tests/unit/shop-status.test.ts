import { describe, it, expect } from "vitest";
import { getShopStatus } from "@/lib/shop-status";

// 2026-09-17 Perşembe. 07:00Z = 10:00 İstanbul
const rows = [
  { dayOfWeek: 4, isOff: false, startTime: "09:00", endTime: "19:00" },
  { dayOfWeek: 4, isOff: false, startTime: "10:00", endTime: "20:00" }, // ikinci berber
  { dayOfWeek: 0, isOff: true, startTime: "09:00", endTime: "19:00" },
];

describe("getShopStatus", () => {
  it("open today: earliest open, latest close", () => {
    const s = getShopStatus(rows, new Date("2026-09-17T07:00:00Z"));
    expect(s).toEqual({ isOpenToday: true, opensAt: "09:00", closesAt: "20:00", text: "Bugün açık · 09:00–20:00" });
  });
  it("closed day (Sunday)", () => {
    const s = getShopStatus(rows, new Date("2026-09-20T07:00:00Z"));
    expect(s.isOpenToday).toBe(false);
    expect(s.text).toBe("Bugün kapalıyız");
  });
  it("after closing time", () => {
    const s = getShopStatus(rows, new Date("2026-09-17T17:30:00Z")); // 20:30 İstanbul
    expect(s.text).toBe("Bugün kapandık");
  });
  it("no rows → closed", () => {
    expect(getShopStatus([], new Date("2026-09-17T07:00:00Z")).text).toBe("Bugün kapalıyız");
  });
});
