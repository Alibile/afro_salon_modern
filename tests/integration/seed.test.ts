import { describe, it, expect } from "vitest";
import { prisma } from "@/lib/db";
import { Role } from "@/generated/prisma/enums";
import { runSeed, DEFAULT_LANDING_CONTENT, LEGACY_ABOUT_TEXT, LEGACY_NADIA_TEXT } from "../../prisma/seed";

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
