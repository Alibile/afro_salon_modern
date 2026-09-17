import { prisma } from "@/lib/db";
import type { SessionUser } from "@/lib/auth-helpers";
import { staffScope } from "@/lib/staff-scope";
import { addMinutes, shopDayStart } from "@/lib/time";

export type PanelAppointment = {
  id: string; startsAt: Date; endsAt: Date; status: "SCHEDULED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
  customerId: string; customerName: string; customerPhone: string | null; services: string[]; totalKurus: number;
};

export async function getTodayBoard(user: SessionUser, now: Date = new Date()) {
  const dayStart = shopDayStart(now);
  const dayEnd = addMinutes(dayStart, 24 * 60);
  const barbers = await prisma.barber.findMany({
    where: { isActive: true, ...(user.role === "ADMIN" ? {} : { id: user.barberId ?? "__none__" }) },
    include: {
      user: { select: { name: true } },
      appointments: {
        where: { startsAt: { gte: dayStart, lt: dayEnd } },
        include: { customer: { select: { id: true, name: true, phone: true } }, services: true },
        orderBy: { startsAt: "asc" },
      },
    },
    orderBy: { user: { name: "asc" } },
  });
  return {
    dayStart,
    columns: barbers.map((b) => ({
      barberId: b.id,
      barberName: b.user.name,
      appointments: b.appointments.map<PanelAppointment>((a) => ({
        id: a.id, startsAt: a.startsAt, endsAt: a.endsAt, status: a.status,
        customerId: a.customer.id, customerName: a.customer.name, customerPhone: a.customer.phone,
        services: a.services.map((s) => s.nameSnapshot),
        totalKurus: a.services.reduce((t, s) => t + s.priceSnapshot, 0),
      })),
    })),
  };
}

export async function listAppointments(user: SessionUser, filter: { from: Date; to: Date; barberId?: string; status?: PanelAppointment["status"] }) {
  const scope = staffScope(user);
  const rows = await prisma.appointment.findMany({
    where: {
      ...scope,
      ...(filter.barberId && !scope.barberId ? { barberId: filter.barberId } : {}),
      ...(filter.status ? { status: filter.status } : {}),
      startsAt: { gte: filter.from, lt: filter.to },
    },
    include: { customer: { select: { id: true, name: true, phone: true } }, barber: { include: { user: { select: { name: true } } } }, services: true },
    orderBy: { startsAt: "desc" },
    take: 200,
  });
  return rows.map((a) => ({
    id: a.id, startsAt: a.startsAt, endsAt: a.endsAt, status: a.status, barberName: a.barber.user.name,
    customerId: a.customer.id, customerName: a.customer.name, customerPhone: a.customer.phone,
    services: a.services.map((s) => s.nameSnapshot), totalKurus: a.services.reduce((t, s) => t + s.priceSnapshot, 0),
  }));
}
