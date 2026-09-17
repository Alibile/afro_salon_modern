import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const DEFAULT_HOURS = [0, 1, 2, 3, 4, 5, 6].map((d) => ({
  dayOfWeek: d,
  startTime: "09:00",
  endTime: "19:00",
  isOff: d === 0,
}));

const DEFAULT_SEED_PASSWORD = "Sifre123!";

/** Üretimde şifre her zaman SEED_PASSWORD'dan gelir; geliştirmede varsayılan kullanılır. */
function seedPassword(): string {
  const fromEnv = process.env.SEED_PASSWORD?.trim();
  if (fromEnv) return fromEnv;
  if (process.env.NODE_ENV === "production") {
    throw new Error("SEED_PASSWORD tanımlı değil; üretimde seed çalıştırılamaz");
  }
  return DEFAULT_SEED_PASSWORD;
}

async function main() {
  const password = seedPassword();
  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.settings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, shopName: "Afro Salon Modern", address: "İstanbul", phone: "+90 555 000 00 00" },
  });

  await prisma.user.upsert({
    where: { email: "admin@afrosalon.local" },
    update: {},
    create: { name: "Salon Yöneticisi", email: "admin@afrosalon.local", passwordHash, role: "ADMIN" },
  });

  const barbers = [
    { name: "Kwame Mensah", email: "kwame@afrosalon.local", bio: "Fade ve tasarım kesim uzmanı", photoKey: "landing/team-2.jpg" },
    { name: "Amara Diallo", email: "amara@afrosalon.local", bio: "Örgü ve twist", photoKey: "landing/team-1.jpg" },
  ];
  for (const b of barbers) {
    const user = await prisma.user.upsert({
      where: { email: b.email },
      update: {},
      create: { name: b.name, email: b.email, passwordHash, role: "BARBER" },
    });
    const barber = await prisma.barber.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id, bio: b.bio, photoKey: b.photoKey },
    });
    const count = await prisma.workingHours.count({ where: { barberId: barber.id } });
    if (count === 0) {
      await prisma.workingHours.createMany({ data: DEFAULT_HOURS.map((h) => ({ ...h, barberId: barber.id })) });
    }
  }

  const services = [
    { name: "Saç Kesimi", durationMinutes: 30, priceKurus: 40000, sortOrder: 1 },
    { name: "Sakal", durationMinutes: 15, priceKurus: 20000, sortOrder: 2 },
    { name: "Saç + Sakal", durationMinutes: 45, priceKurus: 55000, sortOrder: 3 },
    { name: "Örgü / Twist", durationMinutes: 90, priceKurus: 120000, sortOrder: 4 },
  ];
  for (const s of services) {
    const exists = await prisma.service.findFirst({ where: { name: s.name } });
    if (!exists) await prisma.service.create({ data: s });
  }
  const shown = process.env.SEED_PASSWORD?.trim() ? "SEED_PASSWORD değeri" : DEFAULT_SEED_PASSWORD;
  console.log(`Seed tamam. Admin: admin@afrosalon.local / ${shown}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
