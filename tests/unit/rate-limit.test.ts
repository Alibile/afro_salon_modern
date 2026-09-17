import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { allow, resetRateLimit } from "@/lib/rate-limit";

describe("allow", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-17T09:00:00Z"));
    resetRateLimit();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("pencere içinde limite kadar izin verir, sonrasını reddeder", () => {
    expect(allow("ip:1.2.3.4", 3, 60_000)).toBe(true);
    expect(allow("ip:1.2.3.4", 3, 60_000)).toBe(true);
    expect(allow("ip:1.2.3.4", 3, 60_000)).toBe(true);
    expect(allow("ip:1.2.3.4", 3, 60_000)).toBe(false);
  });

  it("pencere dolduğunda yeniden izin verir", () => {
    for (let i = 0; i < 3; i++) allow("ip:1.2.3.4", 3, 60_000);
    expect(allow("ip:1.2.3.4", 3, 60_000)).toBe(false);
    vi.advanceTimersByTime(59_000);
    expect(allow("ip:1.2.3.4", 3, 60_000)).toBe(false);
    vi.advanceTimersByTime(2_000);
    expect(allow("ip:1.2.3.4", 3, 60_000)).toBe(true);
  });

  it("pencere kayar: ilk istek düştüğünde bir hak açılır", () => {
    allow("ip:5.5.5.5", 2, 60_000);
    vi.advanceTimersByTime(30_000);
    allow("ip:5.5.5.5", 2, 60_000);
    expect(allow("ip:5.5.5.5", 2, 60_000)).toBe(false);
    vi.advanceTimersByTime(31_000);
    expect(allow("ip:5.5.5.5", 2, 60_000)).toBe(true);
    expect(allow("ip:5.5.5.5", 2, 60_000)).toBe(false);
  });

  it("anahtarlar birbirinden bağımsızdır", () => {
    for (let i = 0; i < 3; i++) allow("ip:1.1.1.1", 3, 60_000);
    expect(allow("ip:1.1.1.1", 3, 60_000)).toBe(false);
    expect(allow("ip:2.2.2.2", 3, 60_000)).toBe(true);
  });

  it("reddedilen istek limiti uzatmaz", () => {
    for (let i = 0; i < 3; i++) allow("ip:9.9.9.9", 3, 60_000);
    vi.advanceTimersByTime(59_000);
    expect(allow("ip:9.9.9.9", 3, 60_000)).toBe(false);
    vi.advanceTimersByTime(1_500);
    expect(allow("ip:9.9.9.9", 3, 60_000)).toBe(true);
  });
});
