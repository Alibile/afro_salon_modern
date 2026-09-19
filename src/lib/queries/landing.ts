import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { getActiveBarbers, getActiveServices } from "@/lib/queries/booking";
import { getShopStatus } from "@/lib/shop-status";
import { getGalleryData } from "@/lib/queries/gallery";
import { pick } from "@/lib/i18n-content";

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

/**
 * Ana sayfanın tüm verisi, ziyaretçinin dilinde. Panelden girilen içerik
 * (hizmet adı, hakkımızda, galeri başlığı, berber tanıtımı) `Json` sütunlarda
 * üç dilde durur; seçim burada yapılır ki bölüm bileşenleri düz metin almaya
 * devam etsin.
 */
export async function getLandingData(locale: string, now: Date = new Date()) {
  const [settingsRow, services, barbers, hoursRows, gallery, testimonials] = await Promise.all([
    getSettings(),
    getActiveServices(locale),
    getActiveBarbers(locale),
    prisma.workingHours.findMany({ where: { barber: { isActive: true } }, select: { dayOfWeek: true, isOff: true, startTime: true, endTime: true } }),
    getGalleryData(locale),
    prisma.testimonial.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: { id: true, name: true, text: true, rating: true },
    }),
  ]);
  const settings = {
    ...settingsRow,
    aboutTitle: pick(settingsRow.aboutTitleI18n, locale),
    aboutText: pick(settingsRow.aboutTextI18n, locale),
    whyUs1Title: pick(settingsRow.whyUs1TitleI18n, locale),
    whyUs1Text: pick(settingsRow.whyUs1TextI18n, locale),
    whyUs2Title: pick(settingsRow.whyUs2TitleI18n, locale),
    whyUs2Text: pick(settingsRow.whyUs2TextI18n, locale),
    whyUs3Title: pick(settingsRow.whyUs3TitleI18n, locale),
    whyUs3Text: pick(settingsRow.whyUs3TextI18n, locale),
  };
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
