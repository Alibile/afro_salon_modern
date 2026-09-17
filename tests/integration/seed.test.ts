import { describe, it, expect } from "vitest";
import { prisma } from "@/lib/db";
import { Role } from "@/generated/prisma/enums";
import { runSeed, DEFAULT_LANDING_CONTENT, DEFAULT_GALLERY, LEGACY_ABOUT_TEXT, LEGACY_NADIA_TEXT } from "../../prisma/seed";

describe("runSeed", () => {
  it("eski seed/ yer tutucu fotoğraf anahtarını landing/ ile değiştirir, gerçek yüklenmiş anahtara dokunmaz", async () => {
    // Kwame: Task 1 öncesi seed'den kalma "seed/" yer tutucusu — güncellenmeli.
    const kwameUser = await prisma.user.create({
      data: { name: "Kwame Mensah", email: "kwame@afrosalon.local", passwordHash: "x", role: Role.BARBER },
    });
    await prisma.barber.create({ data: { userId: kwameUser.id, photoKey: "seed/kwame.jpg" } });

    // Amara: panelden gerçekten yüklenmiş bir fotoğrafı var — asla üzerine yazılmamalı.
    const amaraUser = await prisma.user.create({
      data: { name: "Amara Diallo", email: "amara@afrosalon.local", passwordHash: "x", role: Role.BARBER },
    });
    await prisma.barber.create({ data: { userId: amaraUser.id, photoKey: "barbers/real.jpg" } });

    await runSeed(prisma);

    const kwame = await prisma.barber.findUniqueOrThrow({ where: { userId: kwameUser.id } });
    const amara = await prisma.barber.findUniqueOrThrow({ where: { userId: amaraUser.id } });
    expect(kwame.photoKey).toBe("landing/team-2.jpg");
    expect(amara.photoKey).toBe("barbers/real.jpg");
  });

  it("berber hiç yoksa varsayılan landing/ anahtarıyla oluşturur", async () => {
    await runSeed(prisma);

    const kwameUser = await prisma.user.findUniqueOrThrow({ where: { email: "kwame@afrosalon.local" } });
    const kwame = await prisma.barber.findUniqueOrThrow({ where: { userId: kwameUser.id } });
    expect(kwame.photoKey).toBe("landing/team-2.jpg");
  });

  it("iki kez çalıştırıldığında idempotenttir (kayıtları çoğaltmaz)", async () => {
    await runSeed(prisma);
    await runSeed(prisma);

    const barberCount = await prisma.barber.count();
    const serviceCount = await prisma.service.count();
    const testimonialCount = await prisma.testimonial.count();
    expect(barberCount).toBe(2);
    expect(serviceCount).toBe(4);
    expect(testimonialCount).toBe(3);
    expect(await prisma.galleryPhoto.count()).toBe(DEFAULT_GALLERY.length);
  });

  it("galeri fotoğraflarını gerçek boyut ve etiketleriyle ekler, düzenlenmiş kaydın üzerine yazmaz", async () => {
    await runSeed(prisma);
    const first = await prisma.galleryPhoto.findFirstOrThrow({ where: { storageKey: "landing/gallery-1.jpg" } });
    expect(first.width).toBe(1367);
    expect(first.height).toBe(1367);
    expect(first.tags).toEqual(["Fade", "Line-up"]);
    expect(first.isActive).toBe(true);

    await prisma.galleryPhoto.update({ where: { id: first.id }, data: { caption: "Panelden yazıldı", tags: ["Fade"] } });
    await runSeed(prisma);
    const again = await prisma.galleryPhoto.findUniqueOrThrow({ where: { id: first.id } });
    expect(again.caption).toBe("Panelden yazıldı");
    expect(again.tags).toEqual(["Fade"]);
    expect(await prisma.galleryPhoto.count()).toBe(DEFAULT_GALLERY.length);
  });

  it("dosya yeniden kırpıldığında var olan kaydın boyutlarını tazeler", async () => {
    await runSeed(prisma);
    const portrait = DEFAULT_GALLERY.find((g) => g.file === "gallery-2.jpg")!;
    const row = await prisma.galleryPhoto.findFirstOrThrow({ where: { storageKey: "landing/gallery-2.jpg" } });
    // Eski (kare) boyutlarla kalmış bir kayıt: seed yeniden çalıştığında gerçek orana dönmeli.
    await prisma.galleryPhoto.update({ where: { id: row.id }, data: { width: 1600, height: 1600, caption: "Elle yazıldı" } });

    await runSeed(prisma);

    const fixed = await prisma.galleryPhoto.findUniqueOrThrow({ where: { id: row.id } });
    expect(fixed.width).toBe(portrait.width);
    expect(fixed.height).toBe(portrait.height);
    expect(fixed.caption).toBe("Elle yazıldı");
  });

  it("eski (Tur 3 öncesi) varsayılan aboutText'i yeni erkek odaklı metne taşır, özel metne dokunmaz", async () => {
    await prisma.settings.update({ where: { id: 1 }, data: { aboutText: LEGACY_ABOUT_TEXT } });
    await runSeed(prisma);
    const settings = await prisma.settings.findUniqueOrThrow({ where: { id: 1 } });
    expect(settings.aboutText).toBe(DEFAULT_LANDING_CONTENT.aboutText);
  });

  it("admin tarafından girilmiş özel aboutText'e dokunmaz", async () => {
    await prisma.settings.update({ where: { id: 1 }, data: { aboutText: "Özel metin" } });
    await runSeed(prisma);
    const settings = await prisma.settings.findUniqueOrThrow({ where: { id: 1 } });
    expect(settings.aboutText).toBe("Özel metin");
  });

  it("eski aynı metinli 'Nadia T.' yorumunu aynı id ile 'Derrick B.' adına taşır", async () => {
    const legacy = await prisma.testimonial.create({
      data: { name: "Nadia T.", text: LEGACY_NADIA_TEXT, rating: 5, sortOrder: 2 },
    });
    await runSeed(prisma);
    const updated = await prisma.testimonial.findUniqueOrThrow({ where: { id: legacy.id } });
    expect(updated.name).toBe("Derrick B.");
    expect(updated.sortOrder).toBe(2);
    expect(updated.isActive).toBe(true);
    expect(await prisma.testimonial.count({ where: { name: "Nadia T." } })).toBe(0);
  });

  it("farklı metinli özel 'Nadia T.' yorumuna dokunmaz (adı değişmez, yeni bir Derrick B. oluşur)", async () => {
    const custom = await prisma.testimonial.create({
      data: { name: "Nadia T.", text: "Bambaşka, admin tarafından yazılmış bir yorum.", rating: 5, sortOrder: 2 },
    });
    await runSeed(prisma);
    const untouched = await prisma.testimonial.findUniqueOrThrow({ where: { id: custom.id } });
    expect(untouched.name).toBe("Nadia T.");
    expect(untouched.text).toBe("Bambaşka, admin tarafından yazılmış bir yorum.");
    expect(await prisma.testimonial.count({ where: { name: "Derrick B." } })).toBe(1);
  });

  it("iki kez çalıştırıldıktan sonra tam olarak bir 'Derrick B.' vardır ve eski 'Nadia T.' kalmaz", async () => {
    await prisma.testimonial.create({ data: { name: "Nadia T.", text: LEGACY_NADIA_TEXT, rating: 5, sortOrder: 2 } });
    await runSeed(prisma);
    await runSeed(prisma);
    expect(await prisma.testimonial.count({ where: { name: "Derrick B." } })).toBe(1);
    expect(await prisma.testimonial.count({ where: { name: "Nadia T." } })).toBe(0);
  });
});
