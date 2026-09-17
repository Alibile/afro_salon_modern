import { prisma } from "@/lib/db";

export async function listBarbersForAdmin() {
  const rows = await prisma.barber.findMany({ include: { user: { select: { name: true, email: true } } }, orderBy: { user: { name: "asc" } } });
  return rows.map((b) => ({ id: b.id, name: b.user.name, email: b.user.email, photoKey: b.photoKey, isActive: b.isActive }));
}

export async function getBarberDetail(barberId: string) {
  const b = await prisma.barber.findUnique({
    where: { id: barberId },
    include: { user: { select: { name: true, email: true } }, workingHours: { orderBy: { dayOfWeek: "asc" } } },
  });
  if (!b) return null;
  const hours = [0, 1, 2, 3, 4, 5, 6].map((d) => {
    const row = b.workingHours.find((h) => h.dayOfWeek === d);
    return { dayOfWeek: d, isOff: row?.isOff ?? true, startTime: row?.startTime ?? "09:00", endTime: row?.endTime ?? "19:00" };
  });
  return { id: b.id, name: b.user.name, email: b.user.email, bio: b.bio ?? "", photoKey: b.photoKey, isActive: b.isActive, hours };
}
