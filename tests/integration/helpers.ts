import { prisma } from "@/lib/db";
import { Role } from "@/generated/prisma/enums";
import type { User } from "@/generated/prisma/client";
import type { SessionUser } from "@/lib/auth-helpers";
import { toAppLocale } from "@/i18n/routing";
import type { I18nText } from "@/lib/i18n-content";

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

/** Berber + kullanıcı + Pzt-Cmt 09:00-19:00, Pazar kapalı. Tanıtım üç dilli. */
export async function createBarber(overrides: { name?: string; hours?: boolean; locale?: string; bio?: I18nText } = {}) {
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
    data: { userId: user.id, photoKey: "barbers/test.jpg", ...(overrides.bio ? { bioI18n: overrides.bio } : {}) },
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

/** Hizmet adı üç dilli; kısa yazım için düz bir dize Türkçe kaynak metin sayılır. */
export async function createService(
  overrides: Partial<{ name: string | I18nText; durationMinutes: number; priceKurus: number; sortOrder: number }> = {},
) {
  const name = overrides.name ?? "Saç Kesimi";
  return prisma.service.create({
    data: {
      nameI18n: typeof name === "string" ? { tr: name } : name,
      durationMinutes: overrides.durationMinutes ?? 30,
      priceKurus: overrides.priceKurus ?? 30000,
      sortOrder: overrides.sortOrder ?? 0,
    },
  });
}

/**
 * Bir veritabanı kullanıcısından `impl` katmanının beklediği oturum aktörü.
 * Randevu oluşturma artık aktörün dilini de kullanıyor (hizmet adı anlık
 * görüntüsü), bu yüzden testler kimliği tek parça geçirir.
 */
export function asActor(user: User, overrides: Partial<SessionUser> = {}): SessionUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    barberId: null,
    locale: toAppLocale(user.locale),
    ...overrides,
  };
}
