import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import { ok, fail, type ActionResult } from "@/lib/action-result";
import { firstIssueKey } from "@/lib/errors";
import type { SessionUser } from "@/lib/auth-helpers";
import { asAdminActor } from "@/lib/staff-scope";
import { serviceSchema, type ServiceInput } from "@/schemas/service";

export async function upsertServiceAs(actor: SessionUser | null, input: ServiceInput & { id?: string }): Promise<ActionResult<{ id: string }>> {
  if (!asAdminActor(actor)) return fail("errors.notAllowed");
  const parsed = serviceSchema.safeParse(input);
  if (!parsed.success) return fail(firstIssueKey(parsed.error));
  const data = {
    nameI18n: parsed.data.name,
    durationMinutes: parsed.data.durationMinutes,
    priceKurus: Math.round(parsed.data.priceLira * 100),
    sortOrder: parsed.data.sortOrder,
  };
  if (input.id) {
    const existing = await prisma.service.findUnique({ where: { id: input.id } });
    if (!existing) return fail("errors.serviceNotFound");
  }
  const s = input.id
    ? await prisma.service.update({ where: { id: input.id }, data })
    : await prisma.service.create({ data });
  return ok({ id: s.id });
}

export async function toggleServiceAs(actor: SessionUser | null, id: string, isActive: boolean): Promise<ActionResult<void>> {
  if (!asAdminActor(actor)) return fail("errors.notAllowed");
  const existing = await prisma.service.findUnique({ where: { id } });
  if (!existing) return fail("errors.serviceNotFound");
  await prisma.service.update({ where: { id }, data: { isActive } });
  return ok(undefined);
}

export async function deleteServiceAs(actor: SessionUser | null, id: string): Promise<ActionResult<void>> {
  if (!asAdminActor(actor)) return fail("errors.notAllowed");
  const existing = await prisma.service.findUnique({ where: { id } });
  if (!existing) return fail("errors.serviceNotFound");
  const usageCount = await prisma.appointmentService.count({ where: { serviceId: id } });
  if (usageCount > 0) return fail("errors.serviceInUse");
  try {
    await prisma.service.delete({ where: { id } });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2003")
      return fail("errors.serviceHasRelations");
    throw e;
  }
  return ok(undefined);
}
