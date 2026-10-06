import { describe, it, expect } from "vitest";
import { STAGGER_MAX, STAGGER_STEP, staggerDelay } from "@/lib/motion-utils";

describe("staggerDelay", () => {
  it("ilk öğeyi geciktirmez", () => {
    expect(staggerDelay(0)).toBe(0);
  });

  it("sıraya göre adım adım artar", () => {
    expect(staggerDelay(1, 0.05)).toBeCloseTo(0.05);
    expect(staggerDelay(3, 0.05)).toBeCloseTo(0.15);
  });

  it("uzun listelerde tavanı aşmaz", () => {
    expect(staggerDelay(40)).toBe(STAGGER_MAX);
    expect(staggerDelay(40, 0.04, 0.2)).toBe(0.2);
  });

  it("negatif ya da geçersiz indekste 0 döner", () => {
    expect(staggerDelay(-3)).toBe(0);
    expect(staggerDelay(Number.NaN)).toBe(0);
  });

  it("varsayılan adım sabitten gelir", () => {
    expect(staggerDelay(2)).toBeCloseTo(2 * STAGGER_STEP);
  });
});
