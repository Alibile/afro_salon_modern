import { prisma } from "@/lib/db";
import { ok, fail, type ActionResult } from "@/lib/action-result";
import type { SessionUser } from "@/lib/auth-helpers";
import { asAdminActor } from "@/lib/staff-scope";
import { serviceSchema, type ServiceInput } from "@/schemas/service";

export async function upsertServiceAs(actor: SessionUser | null, input: ServiceInput & { id?: string }): Promise<ActionResult<{ id: string }>> {
  if (!asAdminActor(actor)) return fail("Yetkiniz yok");
  const parsed = serviceSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Geçersiz bilgi");
  const data = { name: parsed.data.name, durationMinutes: parsed.data.durationMinutes, priceKurus: Math.round(parsed.data.priceLira * 100), sortOrder: parsed.data.sortOrder };
  if (input.id) {
    const existing = await prisma.service.findUnique({ where: { id: input.id } });
    if (!existing) return fail("Hizmet bulunamadı");
  }
  const s = input.id
    ? await prisma.service.update({ where: { id: input.id }, data })
    : await prisma.service.create({ data });
  return ok({ id: s.id });
}

export async function toggleServiceAs(actor: SessionUser | null, id: string, isActive: boolean): Promise<ActionResult<void>> {
  if (!asAdminActor(actor)) return fail("Yetkiniz yok");
  const existing = await prisma.service.findUnique({ where: { id } });
  if (!existing) return fail("Hizmet bulunamadı");
  await prisma.service.update({ where: { id }, data: { isActive } });
  return ok(undefined);
}
