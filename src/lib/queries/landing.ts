import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { getActiveBarbers, getActiveServices } from "@/lib/queries/booking";
import { getShopStatus } from "@/lib/shop-status";

export const DAY_LABELS = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

/** Randevu sayfasının başlığında kullanılan hafif durum sorgusu. */
export async function getTodayShopStatus(now: Date = new Date()) {
  const rows = await prisma.workingHours.findMany({
    where: { barber: { isActive: true } },
    select: { dayOfWeek: true, isOff: true, startTime: true, endTime: true },
  });
  return getShopStatus(rows, now);
}

export async function getLandingData(now: Date = new Date()) {
  const [settings, services, barbers, hoursRows, gallery, testimonials] = await Promise.all([
    getSettings(),
    getActiveServices(),
    getActiveBarbers(),
    prisma.workingHours.findMany({ where: { barber: { isActive: true } }, select: { dayOfWeek: true, isOff: true, startTime: true, endTime: true } }),
    prisma.haircutPhoto.findMany({ orderBy: { createdAt: "desc" }, take: 8, select: { id: true, storageKey: true } }),
    prisma.testimonial.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: { id: true, name: true, text: true, rating: true },
    }),
  ]);
  const status = getShopStatus(hoursRows, now);
  const weeklyHours = WEEK_ORDER.map((d) => {
    const open = hoursRows.filter((r) => r.dayOfWeek === d && !r.isOff);
    if (open.length === 0) return { dayLabel: DAY_LABELS[d], text: "Kapalı" };
    const o = open.map((r) => r.startTime).sort()[0];
    const c = open.map((r) => r.endTime).sort().at(-1)!;
    return { dayLabel: DAY_LABELS[d], text: `${o}–${c}` };
  });
  return { settings, status, services, barbers, gallery, testimonials, weeklyHours };
}
