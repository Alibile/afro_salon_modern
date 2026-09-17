import { prisma } from "@/lib/db";

export async function listServicesForAdmin() {
  const rows = await prisma.service.findMany({
    orderBy: [{ isActive: "desc" }, { sortOrder: "asc" }],
    include: { _count: { select: { appointmentServices: true } } },
  });
  return rows.map((s) => ({
    id: s.id,
    name: s.name,
    durationMinutes: s.durationMinutes,
    priceKurus: s.priceKurus,
    sortOrder: s.sortOrder,
    isActive: s.isActive,
    usageCount: s._count.appointmentServices,
  }));
}
