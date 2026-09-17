import { prisma } from "@/lib/db";
import { ok, fail, type ActionResult } from "@/lib/action-result";
import type { SessionUser } from "@/lib/auth-helpers";
import { asStaffActor } from "@/lib/staff-scope";
import { deleteObject } from "@/lib/storage";
import { MAX_PHOTOS_PER_CUSTOMER } from "@/lib/photos";
import { addHaircutPhotoSchema, type AddHaircutPhotoInput } from "@/schemas/photo";

export async function addHaircutPhotoAs(
  actorInput: SessionUser | null,
  input: AddHaircutPhotoInput,
): Promise<ActionResult<{ id: string; deletedKeys: string[] }>> {
  const actor = asStaffActor(actorInput);
  if (!actor) return fail("Yetkiniz yok");
  if (!input.storageKey) return fail("Fotoğraf yüklenmemiş");

  const parsed = addHaircutPhotoSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Geçersiz bilgi");
  const data = parsed.data;

  const barberId = actor.role === "BARBER" ? actor.barberId : data.barberId;
  if (!barberId) return fail("Berber seçilmedi");

  const customer = await prisma.user.findFirst({ where: { id: data.customerId, role: "CUSTOMER" } });
  if (!customer) return fail("Müşteri bulunamadı");

  if (data.appointmentId) {
    const appointment = await prisma.appointment.findFirst({ where: { id: data.appointmentId, customerId: customer.id } });
    if (!appointment) return fail("Randevu bulunamadı");
  }

  const { created, removed } = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${customer.id}))`;
    const created = await tx.haircutPhoto.create({
      data: { customerId: customer.id, barberId, storageKey: data.storageKey, appointmentId: data.appointmentId ?? null },
    });
    const all = await tx.haircutPhoto.findMany({ where: { customerId: customer.id }, orderBy: [{ createdAt: "asc" }, { id: "asc" }] });
    const excess = all.slice(0, Math.max(0, all.length - MAX_PHOTOS_PER_CUSTOMER));
    if (excess.length) await tx.haircutPhoto.deleteMany({ where: { id: { in: excess.map((p) => p.id) } } });
    return { created, removed: excess.map((p) => p.storageKey) };
  });

  await Promise.all(removed.map((k) => deleteObject(k)));
  return ok({ id: created.id, deletedKeys: removed });
}

export async function deleteHaircutPhotoAs(actorInput: SessionUser | null, id: string): Promise<ActionResult<{ customerId: string }>> {
  const actor = asStaffActor(actorInput);
  if (!actor) return fail("Yetkiniz yok");
  const photo = await prisma.haircutPhoto.findFirst({ where: { id, ...(actor.role === "ADMIN" ? {} : { barberId: actor.barberId ?? "__none__" }) } });
  if (!photo) return fail("Fotoğraf bulunamadı");
  await prisma.haircutPhoto.delete({ where: { id } });
  await deleteObject(photo.storageKey);
  return ok({ customerId: photo.customerId });
}
