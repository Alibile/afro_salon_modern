import { describe, it, expect } from "vitest";
import { prisma } from "@/lib/db";
import { Role } from "@/generated/prisma/enums";
import {
  runSeed,
  DEFAULT_LANDING_CONTENT,
  DEFAULT_GALLERY,
  LEGACY_GALLERY_KEYS,
  LEGACY_GALLERY_DEFAULTS,
  LEGACY_ABOUT_TEXT,
  LEGACY_NADIA_TEXT,
} from "../../prisma/seed";
import { GALLERY_TAGS } from "@/lib/gallery-tags";

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
    expect(first.tags).toEqual(["Taper Fade", "Line-up", "Düz Saç"]);
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

  it("her seed fotoğrafı sabit kategori listesinden 1–3 etiket taşır", () => {
    for (const g of DEFAULT_GALLERY) {
      expect(g.tags.length).toBeGreaterThanOrEqual(1);
      expect(g.tags.length).toBeLessThanOrEqual(3);
      for (const tag of g.tags) expect(GALLERY_TAGS).toContain(tag);
    }
  });

  it("sabit kategori listesindeki her etiketin en az bir fotoğrafı vardır (hiçbir çip boş kalmaz)", () => {
    const used = new Set(DEFAULT_GALLERY.flatMap((g) => g.tags));
    expect([...GALLERY_TAGS].filter((t) => !used.has(t))).toEqual([]);
  });

  it("dosyası silinen eski landing fotoğrafını pasife alır, satırı silmez", async () => {
    const legacy = await prisma.galleryPhoto.create({
      data: {
        storageKey: LEGACY_GALLERY_KEYS[0],
        caption: "Admin başlığı",
        tags: ["Afro"],
        width: 1600,
        height: 1067,
        sortOrder: 3,
      },
    });

    await runSeed(prisma);

    const after = await prisma.galleryPhoto.findUniqueOrThrow({ where: { id: legacy.id } });
    expect(after.isActive).toBe(false);
    // Satır ve admin verisi korunur: yalnızca yayından kaldırılır.
    expect(after.caption).toBe("Admin başlığı");
    expect(after.tags).toEqual(["Afro"]);
    expect(after.sortOrder).toBe(3);
  });

  it("panelden yüklenmiş fotoğrafa (gallery/<uuid>.jpg) dokunmaz", async () => {
    const uploaded = await prisma.galleryPhoto.create({
      data: {
        storageKey: "gallery/2b0a6f1c-9b3e-4e2a-8f77-1d5c6e0a9b21.jpg",
        caption: "Panelden yüklendi",
        tags: ["Fade"],
        width: 1200,
        height: 900,
      },
    });

    await runSeed(prisma);

    const after = await prisma.galleryPhoto.findUniqueOrThrow({ where: { id: uploaded.id } });
    expect(after.isActive).toBe(true);
    expect(after.caption).toBe("Panelden yüklendi");
    expect(after.tags).toEqual(["Fade"]);
  });

  it("pasifleştirme idempotenttir: ikinci çalıştırmada satır sayısı ve durum değişmez", async () => {
    await prisma.galleryPhoto.create({
      data: { storageKey: LEGACY_GALLERY_KEYS[1], tags: ["Afro"], width: 1600, height: 1067 },
    });

    await runSeed(prisma);
    const afterFirst = await prisma.galleryPhoto.count();
    await runSeed(prisma);

    expect(await prisma.galleryPhoto.count()).toBe(afterFirst);
    expect(afterFirst).toBe(DEFAULT_GALLERY.length + 1);
    expect(await prisma.galleryPhoto.count({ where: { isActive: true } })).toBe(DEFAULT_GALLERY.length);
  });

  it("eski anahtar hiç yoksa yeni bir satır uydurmaz", async () => {
    await runSeed(prisma);
    expect(await prisma.galleryPhoto.count({ where: { storageKey: { in: LEGACY_GALLERY_KEYS } } })).toBe(0);
  });

  it("Tur 3 varsayılanıyla duran galeri satırının başlık ve etiketlerini yeni sete taşır", async () => {
    const legacy = LEGACY_GALLERY_DEFAULTS["landing/gallery-1.jpg"];
    const row = await prisma.galleryPhoto.create({
      data: {
        storageKey: "landing/gallery-1.jpg",
        caption: legacy.caption,
        tags: legacy.tags,
        width: 1367,
        height: 1367,
        sortOrder: 0,
      },
    });

    await runSeed(prisma);

    const migrated = await prisma.galleryPhoto.findUniqueOrThrow({ where: { id: row.id } });
    const target = DEFAULT_GALLERY.find((g) => g.file === "gallery-1.jpg")!;
    expect(migrated.caption).toBe(target.caption);
    expect(migrated.tags).toEqual(target.tags);
    // Serbest "Fade" etiketi artık hiçbir aktif fotoğrafta yok.
    const active = await prisma.galleryPhoto.findMany({ where: { isActive: true }, select: { tags: true } });
    expect(active.flatMap((p) => p.tags)).not.toContain("Fade");
  });

  it("admin tarafından düzenlenmiş başlığa sahip eski satıra dokunmaz", async () => {
    const legacy = LEGACY_GALLERY_DEFAULTS["landing/gallery-1.jpg"];
    const row = await prisma.galleryPhoto.create({
      data: {
        storageKey: "landing/gallery-1.jpg",
        caption: "Ahmet'in kesimi",
        tags: legacy.tags,
        width: 1367,
        height: 1367,
      },
    });

    await runSeed(prisma);

    const untouched = await prisma.galleryPhoto.findUniqueOrThrow({ where: { id: row.id } });
    expect(untouched.caption).toBe("Ahmet'in kesimi");
    expect(untouched.tags).toEqual(legacy.tags);
  });

  it("etiketleri düzenlenmiş eski satıra dokunmaz", async () => {
    const legacy = LEGACY_GALLERY_DEFAULTS["landing/gallery-1.jpg"];
    const row = await prisma.galleryPhoto.create({
      data: {
        storageKey: "landing/gallery-1.jpg",
        caption: legacy.caption,
        tags: ["Fade"],
        width: 1367,
        height: 1367,
      },
    });

    await runSeed(prisma);

    const untouched = await prisma.galleryPhoto.findUniqueOrThrow({ where: { id: row.id } });
    expect(untouched.tags).toEqual(["Fade"]);
    expect(untouched.caption).toBe(legacy.caption);
  });

  it("taşıma idempotenttir: ikinci çalıştırma taşınmış satırı geri almaz", async () => {
    const legacy = LEGACY_GALLERY_DEFAULTS["landing/gallery-1.jpg"];
    const row = await prisma.galleryPhoto.create({
      data: { storageKey: "landing/gallery-1.jpg", caption: legacy.caption, tags: legacy.tags, width: 1367, height: 1367 },
    });

    await runSeed(prisma);
    await runSeed(prisma);

    const target = DEFAULT_GALLERY.find((g) => g.file === "gallery-1.jpg")!;
    const after = await prisma.galleryPhoto.findUniqueOrThrow({ where: { id: row.id } });
    expect(after.caption).toBe(target.caption);
    expect(after.tags).toEqual(target.tags);
    expect(await prisma.galleryPhoto.count()).toBe(DEFAULT_GALLERY.length);
  });
});
