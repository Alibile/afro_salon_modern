import { describe, it, expect } from "vitest";
import { serviceSchema } from "@/schemas/service";

describe("serviceSchema", () => {
  it("accepts valid", () => {
    expect(serviceSchema.safeParse({ name: { tr: "Saç" }, durationMinutes: 30, priceLira: 400, sortOrder: 1 }).success).toBe(true);
  });
  it("rejects duration not multiple of 5", () => {
    const r = serviceSchema.safeParse({ name: { tr: "Saç" }, durationMinutes: 32, priceLira: 400, sortOrder: 1 });
    expect(r.success).toBe(false);
  });
  it("coerces strings from FormData", () => {
    const r = serviceSchema.safeParse({ name: { tr: "Saç" }, durationMinutes: "45", priceLira: "550.5", sortOrder: "2" });
    expect(r.success && r.data.priceLira).toBe(550.5);
  });
});

describe("serviceSchema — üç dilli ad", () => {
  it("çevirileri saklar, boş bırakılanı hiç yazmaz", () => {
    const r = serviceSchema.safeParse({
      name: { tr: "Saç Kesimi", en: "Haircut", fr: "   " },
      durationMinutes: 30,
      priceLira: 400,
      sortOrder: 1,
    });
    expect(r.success && r.data.name).toEqual({ tr: "Saç Kesimi", en: "Haircut" });
  });

  it("Türkçe adı zorunlu tutar", () => {
    const r = serviceSchema.safeParse({ name: { tr: "", en: "Haircut" }, durationMinutes: 30, priceLira: 400, sortOrder: 1 });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0].message).toBe("errors.serviceNameMin2");
  });

  it("çok kısa çeviriyi de reddeder", () => {
    const r = serviceSchema.safeParse({ name: { tr: "Saç", en: "H" }, durationMinutes: 30, priceLira: 400, sortOrder: 1 });
    expect(r.success).toBe(false);
  });
});
