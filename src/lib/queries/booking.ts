import { prisma } from "@/lib/db";
import { computeSlots, type Interval, type WorkingInterval } from "@/lib/availability";
import { addMinutes, parseTime, shopDayOfWeek, shopDayStart } from "@/lib/time";
import { getSettings } from "@/lib/settings";
import { pick } from "@/lib/i18n-content";
import { intlLocale } from "@/lib/intl";

/**
 * Aktif hizmetler, ziyaretçinin dilindeki adlarıyla. Ad artık `Json` bir
 * sütunda durduğu için ikincil sıralama veritabanında yapılamaz: aynı
 * `sortOrder`'ı paylaşan hizmetler burada, o dilin kendi alfabetik sırasıyla
 * ayrılır (`Saç` ile `Sakal` Türkçede, `Beard` ile `Braids` İngilizcede).
 *
 * Yalnızca seçilmiş ad döner: bu liste müşteri yüzüne (istemci paketine) kadar
 * gider, ziyaretçinin okumayacağı öbür iki dilin metinlerini taşımasına gerek
 * yok. Ham `nameI18n`'e ihtiyaç duyan tek yer panel formu — onu
 * `listServicesForAdmin` verir.
 */
export async function getActiveServices(locale: string) {
  const rows = await prisma.service.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: { id: true, nameI18n: true, durationMinutes: true, priceKurus: true, sortOrder: true },
  });
  const tag = intlLocale(locale);
  return rows
    .map((s) => ({
      id: s.id,
      name: pick(s.nameI18n, locale),
      durationMinutes: s.durationMinutes,
      priceKurus: s.priceKurus,
      sortOrder: s.sortOrder,
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, tag));
}

/**
 * Randevu alınabilir berberler, tanıtımları ziyaretçinin dilinde. Ad kişiye
 * ait, çevrilmez; tanıtım panelden üç dilde girilir ve burada seçilir — liste
 * istemci paketine kadar gittiği için okunmayacak iki dil taşınmaz.
 */
export async function getActiveBarbers(locale: string) {
  const barbers = await prisma.barber.findMany({
    where: { isActive: true },
    include: {
      user: { select: { name: true } },
      photos: { orderBy: { createdAt: "desc" }, take: 3, select: { storageKey: true } },
    },
    orderBy: { user: { name: "asc" } },
  });
  return barbers.map((b) => ({
    id: b.id,
    name: b.user.name,
    bio: pick(b.bioI18n, locale),
    photoKey: b.photoKey,
    recentPhotoKeys: b.photos.map((p) => p.storageKey),
  }));
}

export async function getBarberDayBusy(barberId: string, dayStart: Date, dayEnd: Date): Promise<Interval[]> {
  const [appointments, timeOffs] = await Promise.all([
    prisma.appointment.findMany({
      where: { barberId, status: "SCHEDULED", startsAt: { lt: dayEnd }, endsAt: { gt: dayStart } },
      select: { startsAt: true, endsAt: true },
    }),
    prisma.timeOff.findMany({
      where: { barberId, startsAt: { lt: dayEnd }, endsAt: { gt: dayStart } },
      select: { startsAt: true, endsAt: true },
    }),
  ]);
  return [...appointments, ...timeOffs].map((x) => ({ start: x.startsAt, end: x.endsAt }));
}

async function getWorkingIntervals(barberId: string, dayOfWeek: number): Promise<WorkingInterval[]> {
  const rows = await prisma.workingHours.findMany({ where: { barberId, dayOfWeek, isOff: false } });
  return rows.map((r) => ({ startMinutes: parseTime(r.startTime), endMinutes: parseTime(r.endTime) }));
}

export async function getTodayAvailability(barberId: string, durationMinutes: number, now: Date = new Date()) {
  const settings = await getSettings();
  const dayStart = shopDayStart(now);
  const dayEnd = addMinutes(dayStart, 24 * 60);
  const dow = shopDayOfWeek(now);

  const working = await getWorkingIntervals(barberId, dow);
  const busy = await getBarberDayBusy(barberId, dayStart, dayEnd);
  const slots = computeSlots({
    dayStart,
    workingIntervals: working,
    busy,
    durationMinutes,
    slotStepMinutes: settings.slotStepMinutes,
    minLeadMinutes: settings.minLeadMinutes,
    now,
  });

  // Yarın açılış saati (kapalıysa mesaj için)
  const tomorrowRows = await prisma.workingHours.findMany({
    where: { barberId, dayOfWeek: (dow + 1) % 7, isOff: false },
    orderBy: { startTime: "asc" },
    take: 1,
  });

  return {
    slots,
    isOpenToday: working.length > 0,
    opensAt: tomorrowRows[0]?.startTime ?? null,
  };
}
