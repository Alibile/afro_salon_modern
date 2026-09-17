"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { ok, fail, type ActionResult } from "@/lib/action-result";
import { getSessionUser, type SessionUser } from "@/lib/auth-helpers";
import { deleteObject } from "@/lib/storage";
import { MAX_PHOTOS_PER_CUSTOMER } from "@/lib/photos";

async function resolveActor(actor?: SessionUser) {
  const u = actor ?? (await getSessionUser());
  return u && (u.role === "BARBER" || u.role === "ADMIN") ? u : null;
}

export async function addHaircutPhoto(
  input: { customerId: string; storageKey: string; appointmentId?: string; barberId?: string },
  opts: { actor?: SessionUser } = {},
): Promise<ActionResult<{ id: string; deletedKeys: string[] }>> {
  const actor = await resolveActor(opts.actor);
  if (!actor) return fail("Yetkiniz yok");
  if (!input.storageKey) return fail("Fotoğraf yüklenmemiş");

  const barberId = actor.role === "BARBER" ? actor.barberId : input.barberId;
  if (!barberId) return fail("Berber seçilmedi");

  const customer = await prisma.user.findFirst({ where: { id: input.customerId, role: "CUSTOMER" } });
  if (!customer) return fail("Müşteri bulunamadı");

  const { created, removed } = await prisma.$transaction(async (tx) => {
    const created = await tx.haircutPhoto.create({
      data: { customerId: customer.id, barberId, storageKey: input.storageKey, appointmentId: input.appointmentId ?? null },
    });
    const all = await tx.haircutPhoto.findMany({ where: { customerId: customer.id }, orderBy: [{ createdAt: "asc" }, { id: "asc" }] });
    const excess = all.slice(0, Math.max(0, all.length - MAX_PHOTOS_PER_CUSTOMER));
    if (excess.length) await tx.haircutPhoto.deleteMany({ where: { id: { in: excess.map((p) => p.id) } } });
    return { created, removed: excess.map((p) => p.storageKey) };
  });

  await Promise.all(removed.map((k) => deleteObject(k)));
  if (!opts.actor) revalidatePath(`/panel/musteriler/${customer.id}`);
  return ok({ id: created.id, deletedKeys: removed });
}

export async function deleteHaircutPhoto(id: string, opts: { actor?: SessionUser } = {}): Promise<ActionResult<void>> {
  const actor = await resolveActor(opts.actor);
  if (!actor) return fail("Yetkiniz yok");
  const photo = await prisma.haircutPhoto.findFirst({ where: { id, ...(actor.role === "ADMIN" ? {} : { barberId: actor.barberId ?? "__none__" }) } });
  if (!photo) return fail("Fotoğraf bulunamadı");
  await prisma.haircutPhoto.delete({ where: { id } });
  await deleteObject(photo.storageKey);
  if (!opts.actor) revalidatePath(`/panel/musteriler/${photo.customerId}`);
  return ok(undefined);
}
