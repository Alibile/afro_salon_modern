import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { shopDayStart, addMinutes } from "@/lib/time";

export type AppointmentView = {
  id: string;
  startsAt: Date;
  endsAt: Date;
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
  barberName: string;
  services: { name: string; priceSnapshot: number }[];
  totalKurus: number;
  canCancel: boolean;
};

export async function getCustomerAppointments(customerId: string, now: Date = new Date()) {
  const settings = await getSettings();
  const dayStart = shopDayStart(now);
  const dayEnd = addMinutes(dayStart, 24 * 60);
  const rows = await prisma.appointment.findMany({
    where: { customerId },
    include: { barber: { include: { user: { select: { name: true } } } }, services: true },
    orderBy: { startsAt: "desc" },
    take: 50,
  });
  const views: AppointmentView[] = rows.map((a) => ({
    id: a.id,
    startsAt: a.startsAt,
    endsAt: a.endsAt,
    status: a.status,
    barberName: a.barber.user.name,
    services: a.services.map((s) => ({ name: s.nameSnapshot, priceSnapshot: s.priceSnapshot })),
    totalKurus: a.services.reduce((t, s) => t + s.priceSnapshot, 0),
    canCancel: a.status === "SCHEDULED" && a.startsAt.getTime() - now.getTime() >= settings.cancellationWindowMinutes * 60_000,
  }));
  const today = views.filter((v) => v.status === "SCHEDULED" && v.startsAt >= dayStart && v.startsAt < dayEnd).reverse();
  const past = views.filter((v) => !today.some((t) => t.id === v.id));
  return { today, past };
}

export async function getCustomerPhotos(customerId: string) {
  const rows = await prisma.haircutPhoto.findMany({
    where: { customerId },
    include: { barber: { include: { user: { select: { name: true } } } } },
    orderBy: { createdAt: "desc" },
  });
  return rows.map((p) => ({ id: p.id, storageKey: p.storageKey, createdAt: p.createdAt, barberName: p.barber.user.name }));
}
