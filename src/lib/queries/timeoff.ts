import { prisma } from "@/lib/db";
import type { SessionUser } from "@/lib/auth-helpers";
import { staffScope } from "@/lib/staff-scope";
import { shopDayStart } from "@/lib/time";

export async function listUpcomingTimeOff(user: SessionUser, now: Date = new Date()) {
  const rows = await prisma.timeOff.findMany({
    where: { ...staffScope(user), endsAt: { gte: shopDayStart(now) } },
    include: { barber: { include: { user: { select: { name: true } } } } },
    orderBy: { startsAt: "asc" },
  });
  return rows.map((t) => ({ id: t.id, barberName: t.barber.user.name, startsAt: t.startsAt, endsAt: t.endsAt, reason: t.reason }));
}
