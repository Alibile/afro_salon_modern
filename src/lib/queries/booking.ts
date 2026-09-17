import { prisma } from "@/lib/db";
import { computeSlots, type Interval, type WorkingInterval } from "@/lib/availability";
import { addMinutes, parseTime, shopDayOfWeek, shopDayStart } from "@/lib/time";
import { getSettings } from "@/lib/settings";

export async function getActiveServices() {
  return prisma.service.findMany({ where: { isActive: true }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });
}

export async function getActiveBarbers() {
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
    bio: b.bio,
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
