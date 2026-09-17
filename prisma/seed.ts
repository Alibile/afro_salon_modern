import "dotenv/config";
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

const DEFAULT_LANDING_CONTENT = {
  email: "info@afrosalonmodern.com",
  instagram: "https://instagram.com/afrosalonmodern",
  facebook: "https://facebook.com/afrosalonmodern",
  whatsapp: "905550000000",
  mapsUrl: "https://maps.google.com/?q=Afro+Salon+Modern+Istanbul",
  aboutTitle: "Benzersiz bir deneyim",
  aboutText:
    "Afro Salon Modern, afro saç sanatını İstanbul'un kalbine taşıyor. Fade, örgü, twist ve bakımda ustalaşmış ekibimizle her kesim kişiye özel planlanır. Randevu yalnızca bugün için alınır; beklemeden, sırasız.",
  whyUs1Title: "Usta berberler",
  whyUs1Text: "Afro saç dokusunda yılların deneyimi; her kesim yüz hatlarına göre planlanır.",
  whyUs2Title: "Premium ürünler",
  whyUs2Text: "Saç ve cilde uygun, test edilmiş profesyonel ürünler.",
  whyUs3Title: "Hijyen ve temizlik",
  whyUs3Text: "Her müşteriden sonra sterilize edilen ekipman, temiz ve ferah salon.",
  satisfactionPercent: 99,
  yearsExperience: 10,
};

const DEFAULT_TESTIMONIALS = [
  { name: "Emre K.", text: "Fade kesim tam istediğim gibi oldu, ekip çok ilgili. Kesinlikle tekrar geleceğim.", rating: 5, sortOrder: 1 },
  { name: "Nadia T.", text: "Örgü konusunda gerçekten usta bir ekip. Randevu almak da çok kolaydı.", rating: 5, sortOrder: 2 },
  { name: "Malik J.", text: "Salon çok temiz, hizmet hızlı. Sakal tıraşı biraz daha özenli olabilirdi.", rating: 4, sortOrder: 3 },
];

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
  if (settings.aboutText === "") {
    await client.settings.update({ where: { id: 1 }, data: DEFAULT_LANDING_CONTENT });
  }

  await client.user.upsert({
    where: { email: "admin@afrosalon.local" },
    update: {},
    create: { name: "Salon Yöneticisi", email: "admin@afrosalon.local", passwordHash, role: "ADMIN" },
  });

  const barbers = [
    { name: "Kwame Mensah", email: "kwame@afrosalon.local", bio: "Fade ve tasarım kesim uzmanı", photoKey: "landing/team-2.jpg" },
    { name: "Amara Diallo", email: "amara@afrosalon.local", bio: "Örgü ve twist", photoKey: "landing/team-1.jpg" },
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
    const exists = await client.testimonial.findFirst({ where: { name: t.name } });
    if (!exists) await client.testimonial.create({ data: t });
  }

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
const isCliEntry = process.argv[1] !== undefined && import.meta.url === `file://${process.argv[1]}`;
if (isCliEntry) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
