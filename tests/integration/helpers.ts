import { prisma } from "@/lib/db";
import { Role } from "@/generated/prisma/enums";

export async function resetDb() {
  await prisma.$executeRawUnsafe(
    `TRUNCATE "HaircutPhoto","AppointmentService","Appointment","TimeOff","WorkingHours","Barber","Service","User","Settings","Testimonial","GalleryPhoto" RESTART IDENTITY CASCADE`,
  );
  await prisma.settings.create({ data: { id: 1 } });
}

let counter = 0;
function uniq(prefix: string) {
  counter += 1;
  return `${prefix}${counter}-${Date.now()}`;
}

export async function createCustomer(overrides: { name?: string; email?: string; locale?: string } = {}) {
  return prisma.user.create({
    data: {
      name: overrides.name ?? "Müşteri Test",
      email: overrides.email ?? `${uniq("musteri")}@test.local`,
      passwordHash: "x",
      role: Role.CUSTOMER,
      ...(overrides.locale ? { locale: overrides.locale } : {}),
    },
  });
}

/** Berber + kullanıcı + Pzt-Cmt 09:00-19:00, Pazar kapalı */
export async function createBarber(overrides: { name?: string; hours?: boolean; locale?: string } = {}) {
  const user = await prisma.user.create({
    data: {
      name: overrides.name ?? "Berber Test",
      email: `${uniq("berber")}@test.local`,
      passwordHash: "x",
      role: Role.BARBER,
      ...(overrides.locale ? { locale: overrides.locale } : {}),
    },
  });
  const barber = await prisma.barber.create({
    data: { userId: user.id, photoKey: "barbers/test.jpg" },
  });
  if (overrides.hours !== false) {
    await prisma.workingHours.createMany({
      data: [0, 1, 2, 3, 4, 5, 6].map((d) => ({
        barberId: barber.id,
        dayOfWeek: d,
        startTime: "09:00",
        endTime: "19:00",
        isOff: d === 0,
      })),
    });
  }
  return { user, barber };
}

export async function createService(
  overrides: Partial<{ name: string; durationMinutes: number; priceKurus: number; sortOrder: number }> = {},
) {
  return prisma.service.create({
    data: {
      name: overrides.name ?? "Saç Kesimi",
      durationMinutes: overrides.durationMinutes ?? 30,
      priceKurus: overrides.priceKurus ?? 30000,
      sortOrder: overrides.sortOrder ?? 0,
    },
  });
}
