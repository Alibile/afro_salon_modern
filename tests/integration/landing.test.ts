import { describe, it, expect } from "vitest";
import { prisma } from "@/lib/db";
import { createBarber, createCustomer, createService } from "./helpers";
import { getLandingData } from "@/lib/queries/landing";

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
    await prisma.galleryPhoto.create({ data: { storageKey: "landing/gallery-2.jpg", caption: "Twist", tags: ["Twist"], width: 1600, height: 1600, sortOrder: 1 } });
    await prisma.galleryPhoto.create({ data: { storageKey: "landing/gallery-1.jpg", caption: "Fade", tags: ["Fade", "Twist"], width: 1367, height: 1367, sortOrder: 0 } });
    await prisma.galleryPhoto.create({ data: { storageKey: "landing/gallery-3.jpg", tags: ["Örgü"], width: 1600, height: 1600, sortOrder: 2, isActive: false } });
    const d = await getLandingData(NOW);
    expect(d.status.text).toBe("Bugün açık · 09:00–19:00");
    expect(d.services.map((s) => s.name)).toEqual(["Sakal", "Saç"]);
    expect(d.barbers).toHaveLength(1);
    expect(d.gallery.photos.map((p) => p.storageKey)).toEqual(["landing/gallery-1.jpg", "landing/gallery-2.jpg"]);
    // "Twist" sabit kategori listesinden, "Fade" serbest etiket: serbest olan sona gelir.
    expect(d.gallery.tags).toEqual(["Twist", "Fade"]);
    expect(d.weeklyHours).toHaveLength(7);
    expect(d.weeklyHours[0]).toEqual({ dayLabel: "Pazartesi", text: "09:00–19:00" });
    expect(d.weeklyHours[6]).toEqual({ dayLabel: "Pazar", text: "Kapalı" });
  });

  it("yalnızca aktif yorumları sortOrder sırasıyla döner", async () => {
    await prisma.testimonial.create({ data: { name: "Nadia T.", text: "Örgüde gerçekten usta bir ekip.", rating: 5, sortOrder: 2 } });
    await prisma.testimonial.create({ data: { name: "Emre K.", text: "Fade kesim tam istediğim gibi oldu.", rating: 4, sortOrder: 1 } });
    await prisma.testimonial.create({ data: { name: "Gizli", text: "Bu yorum yayında değil, görünmemeli.", rating: 1, sortOrder: 0, isActive: false } });
    const d = await getLandingData(NOW);
    expect(d.testimonials.map((t) => t.name)).toEqual(["Emre K.", "Nadia T."]);
    expect(d.testimonials[0].rating).toBe(4);
  });

  it("içerik alanlarını ayarlardan döner", async () => {
    await prisma.settings.update({
      where: { id: 1 },
      data: { aboutTitle: "Benzersiz bir deneyim", aboutText: "Afro saç sanatı.", whyUs1Title: "Usta berberler", satisfactionPercent: 98, yearsExperience: 12, instagram: "https://instagram.com/x" },
    });
    const d = await getLandingData(NOW);
    expect(d.settings.aboutTitle).toBe("Benzersiz bir deneyim");
    expect(d.settings.whyUs1Title).toBe("Usta berberler");
    expect(d.settings.satisfactionPercent).toBe(98);
    expect(d.settings.yearsExperience).toBe(12);
    expect(d.settings.instagram).toBe("https://instagram.com/x");
  });
});
