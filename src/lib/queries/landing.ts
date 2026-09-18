import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { getActiveBarbers, getActiveServices } from "@/lib/queries/booking";
import { getShopStatus } from "@/lib/shop-status";
import { getGalleryData } from "@/lib/queries/gallery";

/** Hafta listesi pazartesiden başlar; `Date.getDay()` sıralaması pazardan. */
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

/** Randevu sayfasının başlığında kullanılan hafif durum sorgusu. */
export async function getTodayShopStatus(now: Date = new Date()) {
  const rows = await prisma.workingHours.findMany({
    where: { barber: { isActive: true } },
    select: { dayOfWeek: true, isOff: true, startTime: true, endTime: true },
  });
  return getShopStatus(rows, now);
}

/**
 * Haftalık çalışma saatleri: gün adı burada üretilmez, gün numarası taşınır.
 * Adı basacak olan bileşen ziyaretçinin dilini bilir (`weekdayName`), sorgu
 * bilmez; kapalı gün de metin değil `null` ile anlatılır.
 */
export type WeeklyHoursRow = { dayOfWeek: number; opensAt: string | null; closesAt: string | null };

export async function getLandingData(now: Date = new Date()) {
  const [settings, services, barbers, hoursRows, gallery, testimonials] = await Promise.all([
    getSettings(),
    getActiveServices(),
    getActiveBarbers(),
    prisma.workingHours.findMany({ where: { barber: { isActive: true } }, select: { dayOfWeek: true, isOff: true, startTime: true, endTime: true } }),
    getGalleryData(),
    prisma.testimonial.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: { id: true, name: true, text: true, rating: true },
    }),
  ]);
  const status = getShopStatus(hoursRows, now);
  const weeklyHours: WeeklyHoursRow[] = WEEK_ORDER.map((d) => {
    const open = hoursRows.filter((r) => r.dayOfWeek === d && !r.isOff);
    if (open.length === 0) return { dayOfWeek: d, opensAt: null, closesAt: null };
    return {
      dayOfWeek: d,
      opensAt: open.map((r) => r.startTime).sort()[0],
      closesAt: open.map((r) => r.endTime).sort().at(-1)!,
    };
  });
  return { settings, status, services, barbers, gallery, testimonials, weeklyHours };
}
