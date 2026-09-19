import { describe, it, expect } from "vitest";
import { prisma } from "@/lib/db";
import { createBarber, createCustomer, createService } from "./helpers";
import { getLandingData } from "@/lib/queries/landing";
import { countOpenSlotsToday } from "@/lib/queries/today-slots";

const NOW = new Date("2026-09-17T07:00:00Z");

describe("getLandingData", () => {
  it("returns services, barbers, status and the managed gallery", async () => {
    const { barber } = await createBarber();
    const c = await createCustomer();
    await createService({ name: "Saç", sortOrder: 2 });
    await createService({ name: "Sakal", sortOrder: 1 });
    // Kesim fotoğrafları müşterinin özel arşividir; landing galerisine karışmamalı.
    for (let i = 0; i < 10; i++) {
      await prisma.haircutPhoto.create({ data: { customerId: c.id, barberId: barber.id, storageKey: `haircuts/${i}.jpg`, createdAt: new Date(Date.UTC(2026, 8, 1 + i)) } });
    }
    await prisma.galleryPhoto.create({ data: { storageKey: "landing/gallery-2.jpg", captionI18n: { tr: "Twist" }, tags: ["twist"], width: 1600, height: 1600, sortOrder: 1 } });
    await prisma.galleryPhoto.create({ data: { storageKey: "landing/gallery-1.jpg", captionI18n: { tr: "Fade" }, tags: ["Fade", "twist"], width: 1367, height: 1367, sortOrder: 0 } });
    await prisma.galleryPhoto.create({ data: { storageKey: "landing/gallery-3.jpg", tags: ["braids"], width: 1600, height: 1600, sortOrder: 2, isActive: false } });
    const d = await getLandingData("tr", NOW);
    expect(d.status).toEqual({ isOpenToday: true, opensAt: "09:00", closesAt: "19:00", state: "open" });
    expect(d.services.map((s) => s.name)).toEqual(["Sakal", "Saç"]);
    expect(d.barbers).toHaveLength(1);
    expect(d.gallery.photos.map((p) => p.storageKey)).toEqual(["landing/gallery-1.jpg", "landing/gallery-2.jpg"]);
    // "twist" sabit kategori listesinden, "Fade" serbest etiket: serbest olan sona gelir.
    expect(d.gallery.tags).toEqual(["twist", "Fade"]);
    expect(d.weeklyHours).toHaveLength(7);
    // Gün adı sorgunun işi değil: hafta pazartesiden başlar, kapalı gün saatsizdir.
    expect(d.weeklyHours[0]).toEqual({ dayOfWeek: 1, opensAt: "09:00", closesAt: "19:00" });
    expect(d.weeklyHours[6]).toEqual({ dayOfWeek: 0, opensAt: null, closesAt: null });
  });

  it("berber tanıtımını ziyaretçinin dilinde döner, çeviri yoksa Türkçesini", async () => {
    await createBarber({ name: "Kwame Mensah", bio: { tr: "Fade uzmanı", en: "Fade specialist" } });
    await createBarber({ name: "Yusuf Adeyemi", bio: { tr: "Örgü ve twist" } });

    const tr = await getLandingData("tr", NOW);
    expect(tr.barbers.map((b) => b.bio)).toEqual(["Fade uzmanı", "Örgü ve twist"]);
    // Çevirisi girilmiş berber İngilizcesini, girilmemiş olan Türkçesini gösterir.
    const en = await getLandingData("en", NOW);
    expect(en.barbers.map((b) => b.bio)).toEqual(["Fade specialist", "Örgü ve twist"]);
    const fr = await getLandingData("fr", NOW);
    expect(fr.barbers.map((b) => b.bio)).toEqual(["Fade uzmanı", "Örgü ve twist"]);
  });

  it("tanıtımı hiç yazılmamış berberde boş dize döner (kartta satır basılmaz)", async () => {
    await createBarber({ name: "Kwame Mensah" });
    const en = await getLandingData("en", NOW);
    expect(en.barbers[0].bio).toBe("");
  });

  it("yalnızca aktif yorumları sortOrder sırasıyla döner", async () => {
    await prisma.testimonial.create({ data: { name: "Nadia T.", text: "Örgüde gerçekten usta bir ekip.", rating: 5, sortOrder: 2 } });
    await prisma.testimonial.create({ data: { name: "Emre K.", text: "Fade kesim tam istediğim gibi oldu.", rating: 4, sortOrder: 1 } });
    await prisma.testimonial.create({ data: { name: "Gizli", text: "Bu yorum yayında değil, görünmemeli.", rating: 1, sortOrder: 0, isActive: false } });
    const d = await getLandingData("tr", NOW);
    expect(d.testimonials.map((t) => t.name)).toEqual(["Emre K.", "Nadia T."]);
    expect(d.testimonials[0].rating).toBe(4);
  });

  it("içerik alanlarını ayarlardan döner", async () => {
    await prisma.settings.update({
      where: { id: 1 },
      data: {
        aboutTitleI18n: { tr: "Benzersiz bir deneyim", en: "An experience of its own" },
        aboutTextI18n: { tr: "Afro saç sanatı." },
        whyUs1TitleI18n: { tr: "Usta berberler" },
        satisfactionPercent: 98,
        yearsExperience: 12,
        instagram: "https://instagram.com/x",
      },
    });
    const d = await getLandingData("tr", NOW);
    expect(d.settings.aboutTitle).toBe("Benzersiz bir deneyim");
    // Çevirisi girilmiş alan ziyaretçinin dilinde, girilmemiş alan Türkçe gelir.
    const en = await getLandingData("en", NOW);
    expect(en.settings.aboutTitle).toBe("An experience of its own");
    expect(en.settings.aboutText).toBe("Afro saç sanatı.");
    expect(d.settings.whyUs1Title).toBe("Usta berberler");
    expect(d.settings.satisfactionPercent).toBe(98);
    expect(d.settings.yearsExperience).toBe(12);
    expect(d.settings.instagram).toBe("https://instagram.com/x");
  });
});

/**
 * Hero'daki "bugün {n} uygun saat" sayacı. Sorgu berber başına randevu
 * sihirbazının hesabını (`computeSlots`) tekrarlar, bu yüzden burada sınanan
 * şey aritmetik değil demetin doğru veriyi topladığı: yalnızca aktif berberler,
 * yalnızca bugünün çalışma satırları, randevular ve izinler.
 */
describe("countOpenSlotsToday", () => {
  // 2026-09-17 10:00 İstanbul, perşembe; yardımcı berber Pzt–Cmt 09:00–19:00 açık.
  const MORNING = new Date("2026-09-17T07:00:00Z");

  it("tek berber, 45 dakikalık paket: hazırlık payından kapanışa kadar sayar", async () => {
    await createBarber();
    await createService({ durationMinutes: 45 });
    // 10:00 + 15 dk hazırlık → ilk aday 10:15; son aday 18:15 (18:15 + 45 = 19:00).
    expect(await countOpenSlotsToday(MORNING)).toBe(33);
  });

  it("ikinci berber sayıyı ikiye katlar, pasif berber hiç sayılmaz", async () => {
    await createService({ durationMinutes: 45 });
    await createBarber();
    const solo = await countOpenSlotsToday(MORNING);
    await createBarber({ name: "İkinci Berber" });
    expect(await countOpenSlotsToday(MORNING)).toBe(solo * 2);

    const { barber } = await createBarber({ name: "Pasif Berber" });
    await prisma.barber.update({ where: { id: barber.id }, data: { isActive: false } });
    expect(await countOpenSlotsToday(MORNING)).toBe(solo * 2);
  });

  it("randevu ve izin sayıdan düşer", async () => {
    const { barber } = await createBarber();
    const customer = await createCustomer();
    await createService({ durationMinutes: 45 });
    const before = await countOpenSlotsToday(MORNING);
    await prisma.appointment.create({
      data: {
        customerId: customer.id,
        barberId: barber.id,
        startsAt: new Date("2026-09-17T09:00:00Z"),
        endsAt: new Date("2026-09-17T09:45:00Z"),
      },
    });
    await prisma.timeOff.create({
      data: { barberId: barber.id, startsAt: new Date("2026-09-17T13:00:00Z"), endsAt: new Date("2026-09-17T14:00:00Z") },
    });
    expect(await countOpenSlotsToday(MORNING)).toBeLessThan(before);
    expect(await countOpenSlotsToday(MORNING)).toBeGreaterThan(0);
  });

  it("dükkan kapalıyken (pazar) sıfır", async () => {
    await createBarber();
    await createService({ durationMinutes: 45 });
    // 2026-09-20 pazar: yardımcı berberin o günü `isOff`.
    expect(await countOpenSlotsToday(new Date("2026-09-20T07:00:00Z"))).toBe(0);
  });

  it("hiç hizmet yoksa süre slot adımına düşer ve sayaç yine çalışır", async () => {
    await createBarber();
    expect(await countOpenSlotsToday(MORNING)).toBeGreaterThan(0);
  });
});
