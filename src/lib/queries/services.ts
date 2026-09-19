import { prisma } from "@/lib/db";
import { asI18nText, pick } from "@/lib/i18n-content";

/**
 * Panel listesi. `name` panel kullanıcısının dilindeki ad (satır başlığı,
 * silme onayı), `nameI18n` ise düzenleme formunun üç sekmesini dolduran ham
 * içerik — biri olmadan liste okunamaz, öbürü olmadan düzenlenemez.
 */
export async function listServicesForAdmin(locale: string) {
  const rows = await prisma.service.findMany({
    orderBy: [{ isActive: "desc" }, { sortOrder: "asc" }],
    include: { _count: { select: { appointmentServices: true } } },
  });
  return rows.map((s) => ({
    id: s.id,
    name: pick(s.nameI18n, locale),
    nameI18n: asI18nText(s.nameI18n),
    durationMinutes: s.durationMinutes,
    priceKurus: s.priceKurus,
    sortOrder: s.sortOrder,
    isActive: s.isActive,
    usageCount: s._count.appointmentServices,
  }));
}
