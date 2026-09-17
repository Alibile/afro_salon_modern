import { prisma } from "@/lib/db";
import type { SessionUser } from "@/lib/auth-helpers";
import { staffScope } from "@/lib/staff-scope";
import type { AppointmentView } from "@/lib/queries/customer";

/**
 * Spec §5: BARBER yalnızca "kendi müşterilerini" görür, yani kendisiyle en az
 * bir randevusu olanları. ADMIN için kısıt yok.
 */
export async function searchCustomers(actor: SessionUser, q: string) {
  const scope = staffScope(actor);
  const term = q.trim();
  const rows = await prisma.user.findMany({
    where: {
      role: "CUSTOMER",
      ...(scope.barberId ? { appointments: { some: { barberId: scope.barberId } } } : {}),
      ...(term ? { OR: [{ name: { contains: term, mode: "insensitive" } }, { phone: { contains: term } }, { email: { contains: term, mode: "insensitive" } }] } : {}),
    },
    include: { appointments: { where: { status: "COMPLETED", ...scope }, orderBy: { startsAt: "desc" }, take: 1, select: { startsAt: true } } },
    orderBy: { name: "asc" },
    take: 100,
  });
  return rows.map((u) => ({ id: u.id, name: u.name, email: u.email, phone: u.phone, lastVisit: u.appointments[0]?.startsAt ?? null }));
}

export async function getCustomerDetail(actor: SessionUser, id: string) {
  const scope = staffScope(actor);
  const u = await prisma.user.findFirst({
    where: {
      id,
      role: "CUSTOMER",
      ...(scope.barberId ? { appointments: { some: { barberId: scope.barberId } } } : {}),
    },
    include: {
      appointments: { where: scope, include: { barber: { include: { user: { select: { name: true } } } }, services: true }, orderBy: { startsAt: "desc" }, take: 30 },
      photos: { where: scope, include: { barber: { include: { user: { select: { name: true } } } } }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!u) return null;
  const appointments: AppointmentView[] = u.appointments.map((a) => ({
    id: a.id, startsAt: a.startsAt, endsAt: a.endsAt, status: a.status, barberName: a.barber.user.name,
    services: a.services.map((s) => ({ name: s.nameSnapshot, priceSnapshot: s.priceSnapshot })),
    totalKurus: a.services.reduce((t, s) => t + s.priceSnapshot, 0), canCancel: false,
  }));
  return {
    id: u.id, name: u.name, email: u.email, phone: u.phone, appointments,
    photos: u.photos.map((p) => ({ id: p.id, storageKey: p.storageKey, createdAt: p.createdAt, barberName: p.barber.user.name, barberId: p.barberId })),
  };
}
