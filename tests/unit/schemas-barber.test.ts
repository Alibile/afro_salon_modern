import { describe, it, expect } from "vitest";
import { createBarberSchema, updateBarberSchema, workingHoursSchema } from "@/schemas/barber";
import { barberProfileSchema } from "@/schemas/profile";

describe("barber schemas", () => {
  it("requires photoKey", () => {
    expect(createBarberSchema.safeParse({ name: "Kwame Mensah", email: "k@t.co", password: "Sifre123!", photoKey: "", bio: { tr: "" } }).success).toBe(false);
    expect(createBarberSchema.safeParse({ name: "Kwame Mensah", email: "k@t.co", password: "Sifre123!", photoKey: "barbers/a.jpg", bio: { tr: "" } }).success).toBe(true);
  });
  it("working hours: 7 days, end after start unless off", () => {
    const days = [0, 1, 2, 3, 4, 5, 6].map((d) => ({ dayOfWeek: d, isOff: d === 0, startTime: "09:00", endTime: "19:00" }));
    expect(workingHoursSchema.safeParse({ days }).success).toBe(true);
    days[1] = { dayOfWeek: 1, isOff: false, startTime: "19:00", endTime: "09:00" };
    expect(workingHoursSchema.safeParse({ days }).success).toBe(false);
  });
});

describe("berber tanıtımı — üç dilli", () => {
  const base = { name: "Kwame Mensah", email: "k@t.co", password: "Sifre123!", photoKey: "barbers/a.jpg" };

  it("çevirileri saklar, boş bırakılanı hiç yazmaz", () => {
    const r = createBarberSchema.safeParse({ ...base, bio: { tr: "Fade uzmanı", en: "Fade specialist", fr: "   " } });
    expect(r.success && r.data.bio).toEqual({ tr: "Fade uzmanı", en: "Fade specialist" });
  });

  it("Türkçesi boş bırakılabilir — tanıtım zorunlu değil", () => {
    const r = createBarberSchema.safeParse({ ...base, bio: { tr: "", en: "Fade specialist" } });
    expect(r.success && r.data.bio).toEqual({ tr: "", en: "Fade specialist" });
  });

  it("200 karakteri aşan çeviriyi reddeder", () => {
    const long = "a".repeat(201);
    expect(updateBarberSchema.safeParse({ name: "Kwame Mensah", bio: { tr: "Kısa", en: long }, photoKey: "barbers/a.jpg", isActive: true }).success).toBe(false);
  });

  it("berberin kendi profilinde de üç dillidir", () => {
    const r = barberProfileSchema.safeParse({ name: "Kwame Mensah", phone: "", bio: { tr: "Fade uzmanı", fr: "Spécialiste du dégradé" }, photoKey: "barbers/a.jpg" });
    expect(r.success && r.data.bio).toEqual({ tr: "Fade uzmanı", fr: "Spécialiste du dégradé" });
  });
});
