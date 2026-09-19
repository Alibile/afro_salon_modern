import { prisma } from "@/lib/db";
import { asI18nText } from "@/lib/i18n-content";

export async function listBarbersForAdmin() {
  const rows = await prisma.barber.findMany({ include: { user: { select: { name: true, email: true } } }, orderBy: { user: { name: "asc" } } });
  return rows.map((b) => ({ id: b.id, name: b.user.name, email: b.user.email, photoKey: b.photoKey, isActive: b.isActive }));
}

/**
 * Düzenleme formunun verisi. Tanıtım burada **ham** üç dilli nesne olarak
 * döner (`bioI18n`): panel formu üç sekmeyi de doldurur, seçilmiş tek bir dil
 * onu düzenlemeye yetmez.
 */
export async function getBarberDetail(barberId: string) {
  const b = await prisma.barber.findUnique({
    where: { id: barberId },
    include: {
      user: { select: { name: true, email: true } },
      workingHours: { orderBy: { dayOfWeek: "asc" } },
      _count: { select: { appointments: true, photos: true } },
    },
  });
  if (!b) return null;
  const hours = [0, 1, 2, 3, 4, 5, 6].map((d) => {
    const row = b.workingHours.find((h) => h.dayOfWeek === d);
    // Satırı olmayan gün formda salonun varsayılan saatleriyle (kapalı olarak) açılır.
    return { dayOfWeek: d, isOff: row?.isOff ?? true, startTime: row?.startTime ?? "11:00", endTime: row?.endTime ?? "22:30" };
  });
  return {
    id: b.id,
    name: b.user.name,
    email: b.user.email,
    bioI18n: asI18nText(b.bioI18n),
    photoKey: b.photoKey,
    isActive: b.isActive,
    hours,
    appointmentCount: b._count.appointments,
    photoCount: b._count.photos,
  };
}
