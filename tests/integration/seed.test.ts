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
  LEGACY_SAME_DAY_ABOUT_TEXT,
  LEGACY_NADIA_TEXT,
  LEGACY_SERVICES,
  LEGACY_HOURS,
  SEED_BARBERS,
} from "../../prisma/seed";
import { GALLERY_TAGS } from "@/lib/gallery-tags";
import { asI18nText } from "@/lib/i18n-content";
import { getActiveBarbers, getActiveServices } from "@/lib/queries/booking";

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
    expect(serviceCount).toBe(1);
    expect(testimonialCount).toBe(3);
    expect(await prisma.galleryPhoto.count()).toBe(DEFAULT_GALLERY.length);
  });

  it("galeri fotoğraflarını gerçek boyut ve etiketleriyle ekler, düzenlenmiş kaydın üzerine yazmaz", async () => {
    await runSeed(prisma);
    const first = await prisma.galleryPhoto.findFirstOrThrow({ where: { storageKey: "landing/gallery-1.jpg" } });
    expect(first.width).toBe(1367);
    expect(first.height).toBe(1367);
    expect(first.tags).toEqual(["taper-fade", "line-up", "straight"]);
    expect(first.isActive).toBe(true);

    await prisma.galleryPhoto.update({ where: { id: first.id }, data: { captionI18n: { tr: "Panelden yazıldı" }, tags: ["Fade"] } });
    await runSeed(prisma);
    const again = await prisma.galleryPhoto.findUniqueOrThrow({ where: { id: first.id } });
    expect(again.captionI18n).toEqual({ tr: "Panelden yazıldı" });
    expect(again.tags).toEqual(["Fade"]);
    expect(await prisma.galleryPhoto.count()).toBe(DEFAULT_GALLERY.length);
  });

  it("dosya yeniden kırpıldığında var olan kaydın boyutlarını tazeler", async () => {
    await runSeed(prisma);
    const portrait = DEFAULT_GALLERY.find((g) => g.file === "gallery-2.jpg")!;
    const row = await prisma.galleryPhoto.findFirstOrThrow({ where: { storageKey: "landing/gallery-2.jpg" } });
    // Eski (kare) boyutlarla kalmış bir kayıt: seed yeniden çalıştığında gerçek orana dönmeli.
    await prisma.galleryPhoto.update({ where: { id: row.id }, data: { width: 1600, height: 1600, captionI18n: { tr: "Elle yazıldı" } } });

    await runSeed(prisma);

    const fixed = await prisma.galleryPhoto.findUniqueOrThrow({ where: { id: row.id } });
    expect(fixed.width).toBe(portrait.width);
    expect(fixed.height).toBe(portrait.height);
    expect(fixed.captionI18n).toEqual({ tr: "Elle yazıldı" });
  });

  it("eski (Tur 3 öncesi) varsayılan aboutText'i yeni erkek odaklı metne taşır, özel metne dokunmaz", async () => {
    await prisma.settings.update({ where: { id: 1 }, data: { aboutTextI18n: { tr: LEGACY_ABOUT_TEXT } } });
    await runSeed(prisma);
    const settings = await prisma.settings.findUniqueOrThrow({ where: { id: 1 } });
    expect(settings.aboutTextI18n).toEqual(DEFAULT_LANDING_CONTENT.aboutTextI18n);
  });

  /**
   * Tur 7: randevu penceresi bugün + 6 güne açıldı, "randevu yalnızca bugün"
   * cümlesi yanlış kaldı. Seed o cümleyi yalnızca **hiç dokunulmamış** kurulumda
   * değiştirir.
   */
  it("Tur 6'nın 'yalnızca bugün' aboutText'ini haftalık metne taşır", async () => {
    await prisma.settings.update({ where: { id: 1 }, data: { aboutTextI18n: LEGACY_SAME_DAY_ABOUT_TEXT } });
    await runSeed(prisma);
    const settings = await prisma.settings.findUniqueOrThrow({ where: { id: 1 } });
    expect(settings.aboutTextI18n).toEqual(DEFAULT_LANDING_CONTENT.aboutTextI18n);
  });

  it("aynı metnin çevirisiz (tek dilli) hâlini de taşır", async () => {
    await prisma.settings.update({ where: { id: 1 }, data: { aboutTextI18n: { tr: LEGACY_SAME_DAY_ABOUT_TEXT.tr } } });
    await runSeed(prisma);
    const settings = await prisma.settings.findUniqueOrThrow({ where: { id: 1 } });
    expect(settings.aboutTextI18n).toEqual(DEFAULT_LANDING_CONTENT.aboutTextI18n);
  });

  it("aynı metni admin bir harf bile değiştirmişse dokunmaz", async () => {
    const edited = { ...LEGACY_SAME_DAY_ABOUT_TEXT, en: "Our own English about text." };
    await prisma.settings.update({ where: { id: 1 }, data: { aboutTextI18n: edited } });
    await runSeed(prisma);
    const settings = await prisma.settings.findUniqueOrThrow({ where: { id: 1 } });
    expect(settings.aboutTextI18n).toEqual(edited);
  });

  it("admin tarafından girilmiş özel aboutText'e dokunmaz", async () => {
    await prisma.settings.update({ where: { id: 1 }, data: { aboutTextI18n: { tr: "Özel metin" } } });
    await runSeed(prisma);
    const settings = await prisma.settings.findUniqueOrThrow({ where: { id: 1 } });
    expect(settings.aboutTextI18n).toEqual({ tr: "Özel metin" });
  });

  it("bir içerik alanı boşaltıldı diye öbür alanları ezmez", async () => {
    // Admin "hakkımızda" metnini bilerek sildi ve "neden biz"in İngilizcesini
    // kendisi yazdı. Seed bir zamanlar bütün içerik bloğunu birden yazıyordu;
    // o hâlde bu İngilizce başlık sessizce kaybolurdu.
    await prisma.settings.update({
      where: { id: 1 },
      data: {
        aboutTextI18n: { tr: "" },
        whyUs1TitleI18n: { tr: "Usta berberler", en: "Our own wording" },
        instagram: "https://instagram.com/adminin-hesabi",
      },
    });

    await runSeed(prisma);

    const settings = await prisma.settings.findUniqueOrThrow({ where: { id: 1 } });
    expect(settings.whyUs1TitleI18n).toEqual({ tr: "Usta berberler", en: "Our own wording" });
    expect(settings.instagram).toBe("https://instagram.com/adminin-hesabi");
    // Yalnızca gerçekten boş olan alan varsayılanla doldu.
    expect(settings.aboutTextI18n).toEqual(DEFAULT_LANDING_CONTENT.aboutTextI18n);
  });

  it("eski Türkçe metni taşırken adminin girdiği çeviriyi korur", async () => {
    await prisma.settings.update({
      where: { id: 1 },
      data: { aboutTextI18n: { tr: LEGACY_ABOUT_TEXT, en: "Our own English about text." } },
    });

    await runSeed(prisma);

    const settings = await prisma.settings.findUniqueOrThrow({ where: { id: 1 } });
    // Türkçesi yeni varsayılana taşındı, İngilizcesi yerinde kaldı; hiç
    // yazılmamış Fransızcası seed'in çevirisiyle doldu.
    expect(settings.aboutTextI18n).toEqual({
      tr: DEFAULT_LANDING_CONTENT.aboutTextI18n.tr,
      en: "Our own English about text.",
      fr: DEFAULT_LANDING_CONTENT.aboutTextI18n.fr,
    });
  });

  it("çevirisiz duran varsayılan içerik alanına çevirileri ekler, düzenlenmiş alana dokunmaz", async () => {
    // Tur 5 göçünün bıraktığı hâl: tek dilli, hâlâ birebir seed varsayılanı.
    await prisma.settings.update({
      where: { id: 1 },
      data: {
        aboutTextI18n: { tr: DEFAULT_LANDING_CONTENT.aboutTextI18n.tr },
        aboutTitleI18n: { tr: DEFAULT_LANDING_CONTENT.aboutTitleI18n.tr },
        whyUs1TitleI18n: { tr: "Bizim ekip" },
      },
    });

    await runSeed(prisma);

    const settings = await prisma.settings.findUniqueOrThrow({ where: { id: 1 } });
    expect(settings.aboutTitleI18n).toEqual(DEFAULT_LANDING_CONTENT.aboutTitleI18n);
    expect(settings.whyUs1TitleI18n).toEqual({ tr: "Bizim ekip" });
  });

  it("tek paketi 700 ₺ / 45 dk olarak kurar", async () => {
    await runSeed(prisma);

    const rows = await prisma.service.findMany();
    expect(rows).toHaveLength(1);
    expect(rows[0].nameI18n).toEqual({ tr: "Yıkama + Kesim + Sakal", en: "Wash, cut & beard", fr: "Shampoing, coupe et barbe" });
    expect(rows[0].priceKurus).toBe(70000);
    expect(rows[0].durationMinutes).toBe(45);
    expect(rows[0].sortOrder).toBe(1);
    expect(rows[0].isActive).toBe(true);
  });

  it("paket hâlâ çevirisiz varsayılansa çevirileri doldurur", async () => {
    await prisma.service.create({ data: { nameI18n: { tr: "Yıkama + Kesim + Sakal" }, durationMinutes: 45, priceKurus: 70000, sortOrder: 1 } });

    await runSeed(prisma);

    const rows = await prisma.service.findMany();
    expect(rows).toHaveLength(1);
    expect(rows[0].nameI18n).toEqual({ tr: "Yıkama + Kesim + Sakal", en: "Wash, cut & beard", fr: "Shampoing, coupe et barbe" });
  });

  it("randevusu olmayan eski varsayılan hizmetleri siler", async () => {
    // Eski seed'in bıraktığı iki hâl: üç dilli tam varsayılan ve göçten kalan tek dilli satır.
    await prisma.service.create({ data: { nameI18n: LEGACY_SERVICES[0], durationMinutes: 30, priceKurus: 40000, sortOrder: 1 } });
    await prisma.service.create({ data: { nameI18n: { tr: LEGACY_SERVICES[3].tr }, durationMinutes: 90, priceKurus: 120000, sortOrder: 4 } });

    await runSeed(prisma);

    const rows = await prisma.service.findMany();
    expect(rows).toHaveLength(1);
    expect(asI18nText(rows[0].nameI18n).tr).toBe("Yıkama + Kesim + Sakal");
  });

  it("randevusu olan eski varsayılan hizmeti silmez, yalnızca pasife alır", async () => {
    const legacy = LEGACY_SERVICES[2];
    const service = await prisma.service.create({ data: { nameI18n: legacy, durationMinutes: 45, priceKurus: 55000, sortOrder: 3 } });
    const barberUser = await prisma.user.create({
      data: { name: "Eski Berber", email: "eski-berber@test.local", passwordHash: "x", role: Role.BARBER },
    });
    const barber = await prisma.barber.create({ data: { userId: barberUser.id, photoKey: "barbers/test.jpg" } });
    const customer = await prisma.user.create({
      data: { name: "Eski Müşteri", email: "eski-musteri@test.local", passwordHash: "x", role: Role.CUSTOMER },
    });
    const appointment = await prisma.appointment.create({
      data: {
        customerId: customer.id,
        barberId: barber.id,
        startsAt: new Date("2026-09-17T09:00:00Z"),
        endsAt: new Date("2026-09-17T09:45:00Z"),
      },
    });
    await prisma.appointmentService.create({
      data: { appointmentId: appointment.id, serviceId: service.id, nameSnapshot: legacy.tr, durationSnapshot: 45, priceSnapshot: 55000 },
    });

    await runSeed(prisma);

    const after = await prisma.service.findUniqueOrThrow({ where: { id: service.id } });
    expect(after.isActive).toBe(false);
    // Geçmiş randevunun anlık görüntüsü ve bağı yerinde kalır.
    expect(await prisma.appointmentService.count({ where: { serviceId: service.id } })).toBe(1);
  });

  it("adı panelden değiştirilmiş eski hizmete dokunmaz", async () => {
    const renamed = await prisma.service.create({
      data: { nameI18n: { tr: LEGACY_SERVICES[0].tr, en: "Men's haircut" }, durationMinutes: 30, priceKurus: 45000, sortOrder: 1 },
    });

    await runSeed(prisma);

    const after = await prisma.service.findUniqueOrThrow({ where: { id: renamed.id } });
    expect(after.nameI18n).toEqual({ tr: LEGACY_SERVICES[0].tr, en: "Men's haircut" });
    expect(after.isActive).toBe(true);
    expect(after.priceKurus).toBe(45000);
  });

  it("yeni kurulumda berberler 11:00–22:30 çalışır, Pazar kapalıdır", async () => {
    await runSeed(prisma);

    const rows = await prisma.workingHours.findMany({ orderBy: [{ barberId: "asc" }, { dayOfWeek: "asc" }] });
    expect(rows).toHaveLength(SEED_BARBERS.length * 7);
    for (const row of rows) {
      expect(row.startTime).toBe("11:00");
      expect(row.endTime).toBe("22:30");
      expect(row.isOff).toBe(row.dayOfWeek === 0);
    }
  });

  it("hiç dokunulmamış eski çalışma saatlerini yeni varsayılana taşır", async () => {
    const user = await prisma.user.create({
      data: { name: SEED_BARBERS[0].name, email: SEED_BARBERS[0].email, passwordHash: "x", role: Role.BARBER },
    });
    const barber = await prisma.barber.create({ data: { userId: user.id, photoKey: SEED_BARBERS[0].photoKey } });
    await prisma.workingHours.createMany({ data: LEGACY_HOURS.map((h) => ({ ...h, barberId: barber.id })) });

    await runSeed(prisma);

    const rows = await prisma.workingHours.findMany({ where: { barberId: barber.id }, orderBy: { dayOfWeek: "asc" } });
    expect(rows).toHaveLength(7);
    expect(rows.map((r) => `${r.startTime}-${r.endTime}`)).toEqual(Array(7).fill("11:00-22:30"));
    expect(rows.map((r) => r.isOff)).toEqual([true, false, false, false, false, false, false]);
  });

  it("bir satırı bile düzenlenmiş berberin çalışma saatlerine dokunmaz", async () => {
    const user = await prisma.user.create({
      data: { name: SEED_BARBERS[1].name, email: SEED_BARBERS[1].email, passwordHash: "x", role: Role.BARBER },
    });
    const barber = await prisma.barber.create({ data: { userId: user.id, photoKey: SEED_BARBERS[1].photoKey } });
    // Admin yalnızca Çarşamba'yı kısaltmış: berberin bütün satırları olduğu gibi kalmalı.
    await prisma.workingHours.createMany({
      data: LEGACY_HOURS.map((h) => ({ ...h, barberId: barber.id, ...(h.dayOfWeek === 3 ? { endTime: "18:00" } : {}) })),
    });

    await runSeed(prisma);

    const rows = await prisma.workingHours.findMany({ where: { barberId: barber.id }, orderBy: { dayOfWeek: "asc" } });
    expect(rows.map((r) => `${r.startTime}-${r.endTime}`)).toEqual([
      "09:00-19:00",
      "09:00-19:00",
      "09:00-19:00",
      "09:00-18:00",
      "09:00-19:00",
      "09:00-19:00",
      "09:00-19:00",
    ]);
  });

  it("saat taşıması idempotenttir: ikinci çalıştırma taşınmış satırları bozmaz", async () => {
    const user = await prisma.user.create({
      data: { name: SEED_BARBERS[0].name, email: SEED_BARBERS[0].email, passwordHash: "x", role: Role.BARBER },
    });
    const barber = await prisma.barber.create({ data: { userId: user.id, photoKey: SEED_BARBERS[0].photoKey } });
    await prisma.workingHours.createMany({ data: LEGACY_HOURS.map((h) => ({ ...h, barberId: barber.id })) });

    await runSeed(prisma);
    await runSeed(prisma);

    const rows = await prisma.workingHours.findMany({ where: { barberId: barber.id } });
    expect(rows).toHaveLength(7);
    expect(rows.every((r) => r.startTime === "11:00" && r.endTime === "22:30")).toBe(true);
  });

  it("berber biyografisinin çevirilerini doldurur, elle yazılmış metne dokunmaz", async () => {
    const [kwame, yusuf] = SEED_BARBERS;
    // Kwame: göçten çıkan hâl (`{tr: <eski>}`) — çeviriler eklenmeli.
    const kwameUser = await prisma.user.create({
      data: { name: kwame.name, email: kwame.email, passwordHash: "x", role: Role.BARBER },
    });
    await prisma.barber.create({ data: { userId: kwameUser.id, photoKey: kwame.photoKey, bioI18n: { tr: kwame.bioI18n.tr } } });
    // Yusuf: berber kendi metnini yazmış — hiç dokunulmamalı.
    const yusufUser = await prisma.user.create({
      data: { name: yusuf.name, email: yusuf.email, passwordHash: "x", role: Role.BARBER },
    });
    await prisma.barber.create({ data: { userId: yusufUser.id, photoKey: yusuf.photoKey, bioI18n: { tr: "Kendi yazdığım tanıtım" } } });

    await runSeed(prisma);

    const kwameRow = await prisma.barber.findUniqueOrThrow({ where: { userId: kwameUser.id } });
    expect(kwameRow.bioI18n).toEqual(kwame.bioI18n);
    const yusufRow = await prisma.barber.findUniqueOrThrow({ where: { userId: yusufUser.id } });
    expect(yusufRow.bioI18n).toEqual({ tr: "Kendi yazdığım tanıtım" });
  });

  it("berber biyografileri /en ve /fr'de kendi dillerinde görünür", async () => {
    await runSeed(prisma);

    const en = (await getActiveBarbers("en")).map((b) => b.bio);
    const fr = (await getActiveBarbers("fr")).map((b) => b.bio);
    for (const b of SEED_BARBERS) {
      expect(en).toContain(b.bioI18n.en);
      expect(fr).toContain(b.bioI18n.fr);
    }
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

  it("her içerik alanının Türkçesi doludur (göç sonrası hiçbir alan boş kalmaz)", async () => {
    await runSeed(prisma);

    const settings = await prisma.settings.findUniqueOrThrow({ where: { id: 1 } });
    for (const field of ["aboutTitleI18n", "aboutTextI18n", "whyUs1TitleI18n", "whyUs1TextI18n", "whyUs2TitleI18n", "whyUs2TextI18n", "whyUs3TitleI18n", "whyUs3TextI18n"] as const) {
      expect(asI18nText(settings[field]).tr, field).not.toBe("");
    }
    for (const service of await prisma.service.findMany()) {
      expect(asI18nText(service.nameI18n).tr).not.toBe("");
    }
    for (const photo of await prisma.galleryPhoto.findMany()) {
      expect(asI18nText(photo.captionI18n).tr).not.toBe("");
    }
    for (const barber of await prisma.barber.findMany()) {
      expect(asI18nText(barber.bioI18n).tr).not.toBe("");
    }
  });

  it("hizmet adları /en ve /fr'de kendi dillerinde görünür", async () => {
    await runSeed(prisma);

    expect((await getActiveServices("en")).map((s) => s.name)).toEqual(["Wash, cut & beard"]);
    expect((await getActiveServices("fr")).map((s) => s.name)).toEqual(["Shampoing, coupe et barbe"]);
    expect((await getActiveServices("tr")).map((s) => s.name)).toEqual(["Yıkama + Kesim + Sakal"]);
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
        captionI18n: { tr: "Admin başlığı" },
        tags: ["afro"],
        width: 1600,
        height: 1067,
        sortOrder: 3,
      },
    });

    await runSeed(prisma);

    const after = await prisma.galleryPhoto.findUniqueOrThrow({ where: { id: legacy.id } });
    expect(after.isActive).toBe(false);
    // Satır ve admin verisi korunur: yalnızca yayından kaldırılır.
    expect(after.captionI18n).toEqual({ tr: "Admin başlığı" });
    expect(after.tags).toEqual(["afro"]);
    expect(after.sortOrder).toBe(3);
  });

  it("panelden yüklenmiş fotoğrafa (gallery/<uuid>.jpg) dokunmaz", async () => {
    const uploaded = await prisma.galleryPhoto.create({
      data: {
        storageKey: "gallery/2b0a6f1c-9b3e-4e2a-8f77-1d5c6e0a9b21.jpg",
        captionI18n: { tr: "Panelden yüklendi" },
        tags: ["Fade"],
        width: 1200,
        height: 900,
      },
    });

    await runSeed(prisma);

    const after = await prisma.galleryPhoto.findUniqueOrThrow({ where: { id: uploaded.id } });
    expect(after.isActive).toBe(true);
    expect(after.captionI18n).toEqual({ tr: "Panelden yüklendi" });
    expect(after.tags).toEqual(["Fade"]);
  });

  it("pasifleştirme idempotenttir: ikinci çalıştırmada satır sayısı ve durum değişmez", async () => {
    await prisma.galleryPhoto.create({
      data: { storageKey: LEGACY_GALLERY_KEYS[1], tags: ["afro"], width: 1600, height: 1067 },
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
        captionI18n: { tr: legacy.caption },
        tags: legacy.tags,
        width: 1367,
        height: 1367,
        sortOrder: 0,
      },
    });

    await runSeed(prisma);

    const migrated = await prisma.galleryPhoto.findUniqueOrThrow({ where: { id: row.id } });
    const target = DEFAULT_GALLERY.find((g) => g.file === "gallery-1.jpg")!;
    expect(migrated.captionI18n).toEqual(target.caption);
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
        captionI18n: { tr: "Ahmet'in kesimi" },
        tags: legacy.tags,
        width: 1367,
        height: 1367,
      },
    });

    await runSeed(prisma);

    const untouched = await prisma.galleryPhoto.findUniqueOrThrow({ where: { id: row.id } });
    expect(untouched.captionI18n).toEqual({ tr: "Ahmet'in kesimi" });
    expect(untouched.tags).toEqual(legacy.tags);
  });

  it("etiketleri düzenlenmiş eski satıra dokunmaz", async () => {
    const legacy = LEGACY_GALLERY_DEFAULTS["landing/gallery-1.jpg"];
    const row = await prisma.galleryPhoto.create({
      data: {
        storageKey: "landing/gallery-1.jpg",
        captionI18n: { tr: legacy.caption },
        tags: ["Fade"],
        width: 1367,
        height: 1367,
      },
    });

    await runSeed(prisma);

    const untouched = await prisma.galleryPhoto.findUniqueOrThrow({ where: { id: row.id } });
    expect(untouched.tags).toEqual(["Fade"]);
    expect(untouched.captionI18n).toEqual({ tr: legacy.caption });
  });

  it("taşıma idempotenttir: ikinci çalıştırma taşınmış satırı geri almaz", async () => {
    const legacy = LEGACY_GALLERY_DEFAULTS["landing/gallery-1.jpg"];
    const row = await prisma.galleryPhoto.create({
      data: { storageKey: "landing/gallery-1.jpg", captionI18n: { tr: legacy.caption }, tags: legacy.tags, width: 1367, height: 1367 },
    });

    await runSeed(prisma);
    await runSeed(prisma);

    const target = DEFAULT_GALLERY.find((g) => g.file === "gallery-1.jpg")!;
    const after = await prisma.galleryPhoto.findUniqueOrThrow({ where: { id: row.id } });
    expect(after.captionI18n).toEqual(target.caption);
    expect(after.tags).toEqual(target.tags);
    expect(await prisma.galleryPhoto.count()).toBe(DEFAULT_GALLERY.length);
  });
});
