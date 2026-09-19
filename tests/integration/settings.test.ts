import { describe, it, expect } from "vitest";
import { prisma } from "@/lib/db";
import { updateSettingsAs } from "@/actions/impl/settings";
import type { SessionUser } from "@/lib/auth-helpers";
import type { SettingsInput } from "@/schemas/settings";

const admin: SessionUser = { id: "a", name: "Admin", email: "a@t", role: "ADMIN", barberId: null, locale: "tr" };

const base: SettingsInput = {
  shopName: "Afro Salon",
  address: "Kadıköy",
  phone: "0555",
  cancellationWindowMinutes: 60,
  minLeadMinutes: 30,
  slotStepMinutes: 30,
  notifyBarberOnBooking: false,
  email: "info@afrosalon.test",
  instagram: "https://instagram.com/afrosalonmodern",
  facebook: "https://facebook.com/afrosalonmodern",
  whatsapp: "905551112233",
  mapsUrl: "https://maps.google.com/?q=afro",
  aboutTitle: { tr: "Benzersiz bir deneyim", en: "An experience of its own", fr: "Une expérience à part" },
  aboutText: { tr: "Afro saç sanatını İstanbul'un kalbine taşıyoruz." },
  whyUs1Title: { tr: "Usta berberler" },
  whyUs1Text: { tr: "Yılların deneyimi." },
  whyUs2Title: { tr: "Premium ürünler" },
  whyUs2Text: { tr: "Test edilmiş ürünler." },
  whyUs3Title: { tr: "Hijyen ve temizlik" },
  whyUs3Text: { tr: "Sterilize edilmiş ekipman." },
  satisfactionPercent: 98,
  yearsExperience: 8,
};

describe("updateSettings", () => {
  it("updates the single row", async () => {
    const r = await updateSettingsAs(admin, base);
    expect(r.ok).toBe(true);
    const s = await prisma.settings.findUnique({ where: { id: 1 } });
    expect(s?.cancellationWindowMinutes).toBe(60);
    expect(s?.slotStepMinutes).toBe(30);
    expect(s?.notifyBarberOnBooking).toBe(false);
    expect(s?.satisfactionPercent).toBe(98);
    expect(s?.yearsExperience).toBe(8);
  });

  it("içerik alanlarını üç dilde yazar, boş çeviriyi hiç kaydetmez", async () => {
    const r = await updateSettingsAs(admin, {
      ...base,
      aboutText: { tr: "Afro saç sanatı.", en: "The art of afro hair.", fr: "   " },
    });
    expect(r.ok).toBe(true);
    const s = await prisma.settings.findUniqueOrThrow({ where: { id: 1 } });
    expect(s.aboutTitleI18n).toEqual({ tr: "Benzersiz bir deneyim", en: "An experience of its own", fr: "Une expérience à part" });
    expect(s.aboutTextI18n).toEqual({ tr: "Afro saç sanatı.", en: "The art of afro hair." });
  });

  it("çok uzun çeviriyi reddeder (sınır her dilde geçerli)", async () => {
    const r = await updateSettingsAs(admin, { ...base, aboutTitle: { tr: "Kısa", en: "x".repeat(101) } });
    expect(r.ok).toBe(false);
  });

  it("rejects invalid slot step", async () => {
    const r = await updateSettingsAs(admin, { ...base, slotStepMinutes: 7 });
    expect(r.ok).toBe(false);
  });

  it("normalizes instagram handle with @", async () => {
    const r = await updateSettingsAs(admin, { ...base, instagram: "@afrosalonmodern" });
    expect(r.ok).toBe(true);
    const s = await prisma.settings.findUnique({ where: { id: 1 } });
    expect(s?.instagram).toBe("https://instagram.com/afrosalonmodern");
  });

  it("normalizes bare instagram handle without @", async () => {
    const r = await updateSettingsAs(admin, { ...base, instagram: "afrosalonmodern" });
    expect(r.ok).toBe(true);
    const s = await prisma.settings.findUnique({ where: { id: 1 } });
    expect(s?.instagram).toBe("https://instagram.com/afrosalonmodern");
  });

  it("keeps instagram url as-is", async () => {
    const r = await updateSettingsAs(admin, { ...base, instagram: "https://instagram.com/afrosalonmodern" });
    expect(r.ok).toBe(true);
    const s = await prisma.settings.findUnique({ where: { id: 1 } });
    expect(s?.instagram).toBe("https://instagram.com/afrosalonmodern");
  });

  it("rejects invalid whatsapp", async () => {
    const r = await updateSettingsAs(admin, { ...base, whatsapp: "not-a-number" });
    expect(r.ok).toBe(false);
    expect(r.ok ? "" : r.error).toBe("errors.invalidWhatsapp");
  });

  it("accepts empty whatsapp", async () => {
    const r = await updateSettingsAs(admin, { ...base, whatsapp: "" });
    expect(r.ok).toBe(true);
  });

  it("rejects invalid email", async () => {
    const r = await updateSettingsAs(admin, { ...base, email: "not-an-email" });
    expect(r.ok).toBe(false);
  });

  it("accepts empty email/social/maps fields", async () => {
    const r = await updateSettingsAs(admin, { ...base, email: "", instagram: "", facebook: "", mapsUrl: "" });
    expect(r.ok).toBe(true);
  });

  it("rejects invalid facebook url", async () => {
    const r = await updateSettingsAs(admin, { ...base, facebook: "not-a-url" });
    expect(r.ok).toBe(false);
  });
});
