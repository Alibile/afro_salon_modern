"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { ok, fail, type ActionResult } from "@/lib/action-result";
import { getSessionUser, type SessionUser } from "@/lib/auth-helpers";
import { serviceSchema, type ServiceInput } from "@/schemas/service";

async function requireAdminActor(actor?: SessionUser) {
  const u = actor ?? (await getSessionUser());
  return u?.role === "ADMIN" ? u : null;
}

export async function upsertService(input: ServiceInput & { id?: string }, opts: { actor?: SessionUser } = {}): Promise<ActionResult<{ id: string }>> {
  if (!(await requireAdminActor(opts.actor))) return fail("Yetkiniz yok");
  const parsed = serviceSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Geçersiz bilgi");
  const data = { name: parsed.data.name, durationMinutes: parsed.data.durationMinutes, priceKurus: Math.round(parsed.data.priceLira * 100), sortOrder: parsed.data.sortOrder };
  const s = input.id
    ? await prisma.service.update({ where: { id: input.id }, data })
    : await prisma.service.create({ data });
  if (!opts.actor) revalidatePath("/panel/hizmetler");
  return ok({ id: s.id });
}

export async function toggleService(id: string, isActive: boolean, opts: { actor?: SessionUser } = {}): Promise<ActionResult<void>> {
  if (!(await requireAdminActor(opts.actor))) return fail("Yetkiniz yok");
  await prisma.service.update({ where: { id }, data: { isActive } });
  if (!opts.actor) revalidatePath("/panel/hizmetler");
  return ok(undefined);
}
