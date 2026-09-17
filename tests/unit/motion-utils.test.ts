import { describe, it, expect } from "vitest";
import {
  STAGGER_MAX,
  STAGGER_STEP,
  clampParallax,
  formatCount,
  parallaxRange,
  staggerDelay,
} from "@/lib/motion-utils";

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

describe("clampParallax", () => {
  it("aralık içindeki değeri değiştirmez", () => {
    expect(clampParallax(12, 40)).toBe(12);
    expect(clampParallax(-12, 40)).toBe(-12);
  });

  it("iki yönde de sınırda durur", () => {
    expect(clampParallax(500, 40)).toBe(40);
    expect(clampParallax(-500, 40)).toBe(-40);
  });

  it("negatif aralığı mutlak değer sayar", () => {
    expect(clampParallax(500, -40)).toBe(40);
  });

  it("geçersiz değerde 0 döner", () => {
    expect(clampParallax(Number.NaN, 40)).toBe(0);
  });
});

describe("parallaxRange", () => {
  it("aşağıdan yukarıya bir aralık verir", () => {
    expect(parallaxRange(40)).toEqual([40, -40]);
  });

  it("hız katsayısı katmanları ayırır", () => {
    expect(parallaxRange(40, 0.5)).toEqual([20, -20]);
  });

  it("işaretten bağımsız çalışır", () => {
    expect(parallaxRange(-40, -1)).toEqual([40, -40]);
  });
});

describe("formatCount", () => {
  it("ara değerleri tam sayıya yuvarlar", () => {
    expect(formatCount(98.4)).toBe("98");
    expect(formatCount(98.6)).toBe("99");
  });

  it("önek ve soneki korur", () => {
    expect(formatCount(99, "%")).toBe("%99");
    expect(formatCount(10, "", "+ yıl")).toBe("10+ yıl");
  });

  it("geçersiz değerde sıfırdan başlar", () => {
    expect(formatCount(Number.NaN, "%")).toBe("%0");
  });
});
