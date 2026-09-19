import { prisma } from "@/lib/db";
import { computeSlots, isFullyOff, type Interval, type WorkingInterval } from "@/lib/availability";
import { addMinutes, parseTime, shopDayOfWeek, shopDayStart } from "@/lib/time";
import { bookableDays } from "@/lib/booking-window";
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

/**
 * Bir günün doluluğu iki parça hâlinde: `busy` ızgaradan düşülecek her şeydir
 * (randevular + izinler), `off` yalnızca izinlerdir. İkisi ayrı duruyor çünkü
 * "gün kapalı mı?" sorusunu yalnızca izinler cevaplar — randevularla dolmuş
 * bir gün kapalı değil, doludur.
 */
export async function getBarberDayIntervals(
  barberId: string,
  dayStart: Date,
  dayEnd: Date,
): Promise<{ busy: Interval[]; off: Interval[] }> {
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
  const toInterval = (x: { startsAt: Date; endsAt: Date }) => ({ start: x.startsAt, end: x.endsAt });
  return { busy: [...appointments, ...timeOffs].map(toInterval), off: timeOffs.map(toInterval) };
}

async function getWorkingIntervals(barberId: string, dayOfWeek: number): Promise<WorkingInterval[]> {
  const rows = await prisma.workingHours.findMany({ where: { barberId, dayOfWeek, isOff: false } });
  return rows.map((r) => ({ startMinutes: parseTime(r.startTime), endMinutes: parseTime(r.endTime) }));
}

/**
 * İleri günlerde "en erken randevu" kuralı (`minLeadMinutes`) çalışmaz: o kural
 * ziyaretçi kapıdan girmeden önce berbere bırakılan payı anlatır, yarının
 * 11:00'ini bugünden almanın önünde bir engel yok. Bugün için filtre aynen
 * durur; ileri günlerde tabanı günün kendi başlangıcına çekmek bütün çalışma
 * aralığını açar.
 */
function leadFilter(dayStart: Date, now: Date, minLeadMinutes: number) {
  const isToday = dayStart.getTime() === shopDayStart(now).getTime();
  return isToday ? { now, minLeadMinutes } : { now: dayStart, minLeadMinutes: 0 };
}

/**
 * Tek bir günün boş saatleri. `dayStart` dükkan saat diliminde o günün 00:00'ı
 * olmalı — pencereye girip girmediğini doğrulamak çağıranın işi
 * (`parseBookableDate`), bu sorgu verilen günü hesaplar.
 *
 * `opensAt` **ertesi günün** açılış saatidir: seçili gün kapalıysa ya da dolduysa
 * sihirbaz "yarın şu saatte" diyebilsin diye durur.
 */
export async function getAvailability(
  barberId: string,
  durationMinutes: number,
  dayStart: Date,
  now: Date = new Date(),
) {
  const settings = await getSettings();
  const dayEnd = addMinutes(dayStart, 24 * 60);
  const dow = shopDayOfWeek(dayStart);

  const [working, { busy, off }, nextDayRows] = await Promise.all([
    getWorkingIntervals(barberId, dow),
    getBarberDayIntervals(barberId, dayStart, dayEnd),
    prisma.workingHours.findMany({
      where: { barberId, dayOfWeek: (dow + 1) % 7, isOff: false },
      orderBy: { startTime: "asc" },
      take: 1,
    }),
  ]);

  const slots = computeSlots({
    dayStart,
    workingIntervals: working,
    busy,
    durationMinutes,
    slotStepMinutes: settings.slotStepMinutes,
    ...leadFilter(dayStart, now, settings.minLeadMinutes),
  });

  return {
    slots,
    // Tam gün izinli gün de kapalıdır (`isFullyOff`): gün çipleriyle aynı
    // kuralı okumazsa aynı gün için çip "Kapalı", sihirbaz "dolu" derdi.
    isOpen: working.length > 0 && !isFullyOff(dayStart, working, off),
    opensAt: nextDayRows[0]?.startTime ?? null,
  };
}

/** Gün çiplerinin ihtiyacı: her gün açık mı, kaç saat boş. */
export type DaySummary = { dateKey: string; open: boolean; slotCount: number };

/**
 * Pencereye giren her gün için tek bakışta özet. Gün başına ayrı sorgu
 * atmaz: berberin yedi çalışma satırı ve bütün pencerenin doluluğu birer kez
 * okunur, gün ayrımı bellekte yapılır.
 *
 * `open`, çalışma saati olmayan günü (berber o gün çalışmıyor) **ve** tam gün
 * izinli günü kapsar: ikisi de ziyaretçiye "Kapalı" olarak görünür. Çalışıyor
 * ama yeri kalmamış gün `open: true, slotCount: 0` ile "Dolu" der.
 */
export async function getDaySummaries(
  barberId: string,
  durationMinutes: number,
  now: Date = new Date(),
): Promise<DaySummary[]> {
  const settings = await getSettings();
  const days = bookableDays(now);
  if (days.length === 0) return [];
  const rangeStart = days[0].dayStart;
  const rangeEnd = addMinutes(days[days.length - 1].dayStart, 24 * 60);

  const [hours, appointments, timeOffs] = await Promise.all([
    prisma.workingHours.findMany({ where: { barberId, isOff: false } }),
    prisma.appointment.findMany({
      where: { barberId, status: "SCHEDULED", startsAt: { lt: rangeEnd }, endsAt: { gt: rangeStart } },
      select: { startsAt: true, endsAt: true },
    }),
    prisma.timeOff.findMany({
      where: { barberId, startsAt: { lt: rangeEnd }, endsAt: { gt: rangeStart } },
      select: { startsAt: true, endsAt: true },
    }),
  ]);

  const busy: Interval[] = [...appointments, ...timeOffs].map((x) => ({ start: x.startsAt, end: x.endsAt }));
  const off: Interval[] = timeOffs.map((x) => ({ start: x.startsAt, end: x.endsAt }));

  return days.map((day) => {
    const working = hours
      .filter((h) => h.dayOfWeek === day.dayOfWeek)
      .map((h) => ({ startMinutes: parseTime(h.startTime), endMinutes: parseTime(h.endTime) }));
    const slots = computeSlots({
      dayStart: day.dayStart,
      workingIntervals: working,
      busy,
      durationMinutes,
      slotStepMinutes: settings.slotStepMinutes,
      ...leadFilter(day.dayStart, now, settings.minLeadMinutes),
    });
    return {
      dateKey: day.dateKey,
      open: working.length > 0 && !isFullyOff(day.dayStart, working, off),
      slotCount: slots.length,
    };
  });
}
