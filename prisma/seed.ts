import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const DEFAULT_HOURS = [0, 1, 2, 3, 4, 5, 6].map((d) => ({
  dayOfWeek: d,
  startTime: "09:00",
  endTime: "19:00",
  isOff: d === 0,
}));

const DEFAULT_SEED_PASSWORD = "Sifre123!";

export const DEFAULT_LANDING_CONTENT = {
  email: "info@afrosalonmodern.com",
  instagram: "https://instagram.com/afrosalonmodern",
  facebook: "https://facebook.com/afrosalonmodern",
  whatsapp: "905550000000",
  mapsUrl: "https://maps.google.com/?q=Afro+Salon+Modern+Istanbul",
  aboutTitle: "Benzersiz bir deneyim",
  aboutText:
    "Afro Salon Modern, erkeklere özel afro saç sanatını İstanbul'un kalbine taşıyor. Fade, örgü, twist ve bakımda ustalaşmış ekibimizle her kesim kişiye özel planlanır. Randevu yalnızca bugün için alınır; beklemeden, sırasız.",
  whyUs1Title: "Usta berberler",
  whyUs1Text: "Afro saç dokusunda yılların deneyimi; her kesim yüz hatlarına göre planlanır.",
  whyUs2Title: "Premium ürünler",
  whyUs2Text: "Saç ve cilde uygun, test edilmiş profesyonel ürünler.",
  whyUs3Title: "Hijyen ve temizlik",
  whyUs3Text: "Her müşteriden sonra sterilize edilen ekipman, temiz ve ferah salon.",
  satisfactionPercent: 99,
  yearsExperience: 10,
};

/**
 * Galerinin başlangıç içeriği: `public/landing/` altındaki stok fotoğraflar.
 * Genişlik/yükseklik dosyaların gerçek pikselleridir (masonry oranı buna dayanır).
 * `storageKey` benzersiz kabul edilir: seed tekrar çalışsa da satır çoğalmaz,
 * panelden düzenlenmiş başlık/etiketlerin üzerine yazılmaz.
 */
export const DEFAULT_GALLERY = [
  { file: "gallery-9.jpg", width: 1066, height: 1600, caption: "Yüksek üst, keskin taper", tags: ["Taper Fade", "Line-up", "Sakal"] },
  { file: "gallery-22.jpg", width: 1066, height: 1600, caption: "Skin fade ve sakal birleşimi", tags: ["Skin Fade", "Düz Saç", "Sakal"] },
  { file: "gallery-10.jpg", width: 1600, height: 1067, caption: "Low taper ve sakal hattı", tags: ["Low Taper Fade", "Sakal"] },
  { file: "gallery-24.jpg", width: 1066, height: 1600, caption: "Jiletle çekilmiş hat", tags: ["Skin Fade", "Line-up", "Sakal"] },
  { file: "gallery-19.jpg", width: 1600, height: 1600, caption: "Sıfıra inen skin fade", tags: ["Skin Fade", "Kısa Saç"] },
  { file: "gallery-1.jpg", width: 1367, height: 1367, caption: "Keskin geçişli taper fade", tags: ["Taper Fade", "Line-up", "Düz Saç"] },
  { file: "gallery-12.jpg", width: 1600, height: 1067, caption: "Kıvırcık üst, alçak geçiş", tags: ["Low Taper Fade", "Kıvırcık"] },
  { file: "gallery-17.jpg", width: 1143, height: 1600, caption: "Ensede taper ve temiz hat", tags: ["Taper Fade", "Line-up"] },
  { file: "gallery-23.jpg", width: 1210, height: 1600, caption: "Buzz cut ve alın hattı", tags: ["Buzz Cut", "Line-up"] },
  { file: "gallery-27.jpg", width: 1280, height: 1600, caption: "Örgü ve şakakta geçiş", tags: ["Örgü", "Taper Fade"] },
  { file: "gallery-13.jpg", width: 1600, height: 1067, caption: "Makineyle taper geçişi", tags: ["Taper Fade", "Kıvırcık"] },
  { file: "gallery-20.jpg", width: 1600, height: 1067, caption: "Dokulu perçem, net hat", tags: ["Textured Fringe", "Line-up"] },
  { file: "gallery-11.jpg", width: 1066, height: 1600, caption: "Taze low taper, temiz ense", tags: ["Low Taper Fade", "Kısa Saç"] },
  { file: "gallery-21.jpg", width: 1600, height: 1600, caption: "Tarakla fade kontrolü", tags: ["Skin Fade", "Textured Fringe"] },
  { file: "gallery-15.jpg", width: 1066, height: 1600, caption: "Alın hattında line-up", tags: ["Line-up", "Sakal"] },
  { file: "gallery-26.jpg", width: 1600, height: 1067, caption: "Afro tarağıyla şekillendirme", tags: ["Afro", "Kıvırcık"] },
  { file: "gallery-14.jpg", width: 1600, height: 1067, caption: "Kıvırcık üstte makas işi", tags: ["Kıvırcık", "Taper Fade"] },
  { file: "gallery-18.jpg", width: 1066, height: 1600, caption: "Kulak çevresinde geçiş", tags: ["Taper Fade", "Kıvırcık"] },
  { file: "gallery-25.jpg", width: 1600, height: 1067, caption: "Sakalda son rötuş", tags: ["Sakal", "Kısa Saç"] },
  { file: "gallery-16.jpg", width: 1600, height: 1067, caption: "Afroda makas düzeltmesi", tags: ["Afro"] },
  { file: "gallery-2.jpg", width: 1280, height: 1600, caption: "Twist ve dolgun sakal", tags: ["Twist", "Sakal"] },
  { file: "gallery-28.jpg", width: 1066, height: 1600, caption: "Yüksek skin fade, düz üst", tags: ["Skin Fade", "Buzz Cut"] },
];

/**
 * Tur 4'te galeriden çıkarılan (dosyası `public/landing/` altından silinen)
 * seed fotoğraflarının anahtarları. Seed bu satırları **silmez** — admin
 * başlığı/etiketi düzenlemiş ya da sırayı değiştirmiş olabilir — yalnızca
 * pasife alır, böylece landing'de var olmayan bir dosyaya bakan kırık kart
 * kalmaz. Zaten pasifse ya da hiç yoksa hiçbir şey yapılmaz.
 */
export const LEGACY_GALLERY_KEYS = [
  "landing/gallery-3.jpg",
  "landing/gallery-4.jpg",
  "landing/gallery-5.jpg",
  "landing/gallery-6.jpg",
  "landing/gallery-7.jpg",
  "landing/gallery-8.jpg",
];

const DEFAULT_TESTIMONIALS = [
  { name: "Emre K.", text: "Fade kesim tam istediğim gibi oldu, ekip çok ilgili. Kesinlikle tekrar geleceğim.", rating: 5, sortOrder: 1 },
  { name: "Derrick B.", text: "Örgü konusunda gerçekten usta bir ekip. Randevu almak da çok kolaydı.", rating: 5, sortOrder: 2 },
  { name: "Malik J.", text: "Salon çok temiz, hizmet hızlı. Sakal tıraşı biraz daha özenli olabilirdi.", rating: 4, sortOrder: 3 },
];

// Tur 3 öncesi (kadın odaklı) seed'in ürettiği tam varsayılan metinler. Bir kurulumda hâlâ bu
// metinler duruyorsa (admin hiç değiştirmemiş demektir) yeni erkek odaklı varsayılana taşınır;
// farklı (admin tarafından girilmiş) bir değere asla dokunulmaz.
export const LEGACY_ABOUT_TEXT =
  "Afro Salon Modern, afro saç sanatını İstanbul'un kalbine taşıyor. Fade, örgü, twist ve bakımda ustalaşmış ekibimizle her kesim kişiye özel planlanır. Randevu yalnızca bugün için alınır; beklemeden, sırasız.";
export const LEGACY_NADIA_TEXT = "Örgü konusunda gerçekten usta bir ekip. Randevu almak da çok kolaydı.";

/** Üretimde şifre her zaman SEED_PASSWORD'dan gelir; geliştirmede varsayılan kullanılır. */
function seedPassword(): string {
  const fromEnv = process.env.SEED_PASSWORD?.trim();
  if (fromEnv) return fromEnv;
  if (process.env.NODE_ENV === "production") {
    throw new Error("SEED_PASSWORD tanımlı değil; üretimde seed çalıştırılamaz");
  }
  return DEFAULT_SEED_PASSWORD;
}

/**
 * Seed mantığının tamamı: idempotent (var olan verileri bozmadan tekrar çalıştırılabilir).
 * `client` parametre olarak alınır ki hem CLI girişi hem de entegrasyon testleri aynı
 * mantığı (test DB'sine bağlı) farklı bir PrismaClient örneğiyle çalıştırabilsin.
 */
export async function runSeed(client: PrismaClient) {
  const password = seedPassword();
  const passwordHash = await bcrypt.hash(password, 10);

  const settings = await client.settings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, shopName: "Afro Salon Modern", address: "İstanbul", phone: "+90 555 000 00 00", ...DEFAULT_LANDING_CONTENT },
  });
  // Var olan geliştirme veritabanlarında içerik alanları boşsa varsayılanlarla doldur (idempotent).
  if (settings.aboutText.trim() === "") {
    await client.settings.update({ where: { id: 1 }, data: DEFAULT_LANDING_CONTENT });
  } else if (settings.aboutText.trim() === LEGACY_ABOUT_TEXT.trim()) {
    // Metin hâlâ Tur 3 öncesi varsayılansa (admin hiç değiştirmemiş) yeni erkek odaklı
    // varsayılana taşı; yalnızca bu alanı güncelle, diğer içerik alanlarına dokunma.
    await client.settings.update({ where: { id: 1 }, data: { aboutText: DEFAULT_LANDING_CONTENT.aboutText } });
  }

  await client.user.upsert({
    where: { email: "admin@afrosalon.local" },
    update: {},
    create: { name: "Salon Yöneticisi", email: "admin@afrosalon.local", passwordHash, role: "ADMIN" },
  });

  const barbers = [
    { name: "Kwame Mensah", email: "kwame@afrosalon.local", bio: "Fade ve tasarım kesim uzmanı", photoKey: "landing/team-2.jpg" },
    { name: "Yusuf Adeyemi", email: "yusuf@afrosalon.local", bio: "Örgü, twist ve line-up", photoKey: "landing/team-1.jpg" },
  ];
  for (const b of barbers) {
    const user = await client.user.upsert({
      where: { email: b.email },
      update: {},
      create: { name: b.name, email: b.email, passwordHash, role: "BARBER" },
    });
    // Eski "seed/" yer tutucu anahtarını yeni "landing/" fotoğrafıyla güncelle; ancak panelden
    // gerçekten yüklenmiş (ör. "barbers/...") bir fotoğraf varsa asla üzerine yazma.
    const existingBarber = await client.barber.findUnique({ where: { userId: user.id } });
    const barber = await client.barber.upsert({
      where: { userId: user.id },
      update: existingBarber?.photoKey.startsWith("seed/") ? { photoKey: b.photoKey } : {},
      create: { userId: user.id, bio: b.bio, photoKey: b.photoKey },
    });
    const count = await client.workingHours.count({ where: { barberId: barber.id } });
    if (count === 0) {
      await client.workingHours.createMany({ data: DEFAULT_HOURS.map((h) => ({ ...h, barberId: barber.id })) });
    }
  }

  // Salon artık erkek odaklı: eski "Amara Diallo" kaydı (varsa) silinmiyor/yeniden adlandırılmıyor
  // (gerçek veri barındırabilir), ama randevusu yoksa pasife alınıyor ki yeni rezervasyonlarda
  // görünmesin. Randevusu varsa hiç dokunulmuyor.
  const legacyAmaraUser = await client.user.findUnique({ where: { email: "amara@afrosalon.local" } });
  if (legacyAmaraUser) {
    const legacyAmaraBarber = await client.barber.findUnique({ where: { userId: legacyAmaraUser.id } });
    if (legacyAmaraBarber?.isActive) {
      const appointmentCount = await client.appointment.count({ where: { barberId: legacyAmaraBarber.id } });
      if (appointmentCount === 0) {
        await client.barber.update({ where: { id: legacyAmaraBarber.id }, data: { isActive: false } });
      }
    }
  }

  const services = [
    { name: "Saç Kesimi", durationMinutes: 30, priceKurus: 40000, sortOrder: 1 },
    { name: "Sakal", durationMinutes: 15, priceKurus: 20000, sortOrder: 2 },
    { name: "Saç + Sakal", durationMinutes: 45, priceKurus: 55000, sortOrder: 3 },
    { name: "Örgü / Twist", durationMinutes: 90, priceKurus: 120000, sortOrder: 4 },
  ];
  for (const s of services) {
    const exists = await client.service.findFirst({ where: { name: s.name } });
    if (!exists) await client.service.create({ data: s });
  }
  for (const t of DEFAULT_TESTIMONIALS) {
    if (t.name === "Derrick B.") {
      // Eski (kadın odaklı) seed'in "Nadia T." yorumu, aynı metinle hâlâ duruyorsa (admin
      // değiştirmemiş demektir) yeniden ad değiştirilerek taşınır; id/sortOrder/isActive korunur.
      // Metni farklıysa (admin tarafından düzenlenmiş) hiç dokunulmaz.
      const legacyNadia = await client.testimonial.findFirst({ where: { name: "Nadia T.", text: LEGACY_NADIA_TEXT } });
      if (legacyNadia) {
        const derrickExists = await client.testimonial.findFirst({ where: { name: "Derrick B." } });
        if (!derrickExists) {
          await client.testimonial.update({ where: { id: legacyNadia.id }, data: { name: "Derrick B." } });
        } else {
          // "Derrick B." zaten var (ör. seed birden çok kez farklı sürümlerle çalıştırılmış);
          // yinelenen eski "Nadia T." satırını temizle.
          await client.testimonial.delete({ where: { id: legacyNadia.id } });
        }
      }
    }
    const exists = await client.testimonial.findFirst({ where: { name: t.name } });
    if (!exists) await client.testimonial.create({ data: t });
  }

  // Galeri: her fotoğraf storageKey'ine göre bir kez eklenir (idempotent). Kayıt zaten
  // varsa yalnızca boyutları tazelenir — dosya yeniden kırpıldığında (ör. kare fotoğraf
  // dikey/yatay yapıldığında) masonry oranı DB'deki eski boyutta kalmasın; başlık ve
  // etiketler panelden düzenlenmiş olabileceği için asla ezilmez.
  for (const [i, g] of DEFAULT_GALLERY.entries()) {
    const storageKey = `landing/${g.file}`;
    const exists = await client.galleryPhoto.findFirst({ where: { storageKey } });
    if (!exists) {
      await client.galleryPhoto.create({
        data: { storageKey, caption: g.caption, tags: g.tags, width: g.width, height: g.height, sortOrder: i },
      });
    } else if (exists.width !== g.width || exists.height !== g.height) {
      await client.galleryPhoto.update({ where: { id: exists.id }, data: { width: g.width, height: g.height } });
    }
  }

  // Dosyası artık olmayan eski seed fotoğrafları: satır korunur, yalnızca yayından kaldırılır.
  await client.galleryPhoto.updateMany({
    where: { storageKey: { in: LEGACY_GALLERY_KEYS }, isActive: true },
    data: { isActive: false },
  });

  const shown = process.env.SEED_PASSWORD?.trim() ? "SEED_PASSWORD değeri" : DEFAULT_SEED_PASSWORD;
  console.log(`Seed tamam. Admin: admin@afrosalon.local / ${shown}`);
}

async function main() {
  // CLI girişinde kendi PrismaClient'ımızı burada kuruyoruz (modül import edildiğinde değil),
  // böylece bu dosya bir test tarafından import edildiğinde fazladan bir DB bağlantısı açılmaz.
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });
  try {
    await runSeed(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

// Yalnızca `tsx prisma/seed.ts` ile doğrudan çalıştırıldığında main()'i tetikle;
// dosya bir test tarafından import edildiğinde (runSeed'i almak için) otomatik çalışmasın.
const isCliEntry = process.argv[1] !== undefined && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isCliEntry) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
