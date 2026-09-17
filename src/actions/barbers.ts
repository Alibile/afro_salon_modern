"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { ok, fail, type ActionResult } from "@/lib/action-result";
import { getSessionUser, type SessionUser } from "@/lib/auth-helpers";
import { createBarberSchema, updateBarberSchema, workingHoursSchema, type CreateBarberInput, type UpdateBarberInput, type WorkingHoursInput } from "@/schemas/barber";
import { deleteObject } from "@/lib/storage";

const DEFAULT_HOURS = [0, 1, 2, 3, 4, 5, 6].map((d) => ({ dayOfWeek: d, startTime: "09:00", endTime: "19:00", isOff: d === 0 }));

async function requireAdminActor(actor?: SessionUser) {
  const u = actor ?? (await getSessionUser());
  return u?.role === "ADMIN" ? u : null;
}

export async function createBarber(input: CreateBarberInput, opts: { actor?: SessionUser } = {}): Promise<ActionResult<{ barberId: string }>> {
  if (!(await requireAdminActor(opts.actor))) return fail("Yetkiniz yok");
  const parsed = createBarberSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Geçersiz bilgi");
  const { name, email, password, bio, photoKey } = parsed.data;
  if (await prisma.user.findUnique({ where: { email } })) return fail("Bu e-posta ile zaten bir hesap var");

  const passwordHash = await bcrypt.hash(password, 10);
  const barber = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({ data: { name, email, passwordHash, role: "BARBER" } });
    const b = await tx.barber.create({ data: { userId: user.id, bio: bio || null, photoKey } });
    await tx.workingHours.createMany({ data: DEFAULT_HOURS.map((h) => ({ ...h, barberId: b.id })) });
    return b;
  });
  if (!opts.actor) revalidatePath("/panel/berberler");
  return ok({ barberId: barber.id });
}

export async function updateBarber(barberId: string, input: UpdateBarberInput, opts: { actor?: SessionUser } = {}): Promise<ActionResult<void>> {
  if (!(await requireAdminActor(opts.actor))) return fail("Yetkiniz yok");
  const parsed = updateBarberSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Geçersiz bilgi");
  const existing = await prisma.barber.findUnique({ where: { id: barberId } });
  if (!existing) return fail("Berber bulunamadı");
  const { name, bio, photoKey, isActive } = parsed.data;
  await prisma.$transaction([
    prisma.user.update({ where: { id: existing.userId }, data: { name } }),
    prisma.barber.update({ where: { id: barberId }, data: { bio: bio || null, photoKey, isActive } }),
  ]);
  if (existing.photoKey !== photoKey && !existing.photoKey.startsWith("seed/") && !opts.actor) await deleteObject(existing.photoKey);
  if (!opts.actor) revalidatePath("/panel/berberler");
  return ok(undefined);
}

export async function saveWorkingHours(barberId: string, input: WorkingHoursInput, opts: { actor?: SessionUser } = {}): Promise<ActionResult<void>> {
  if (!(await requireAdminActor(opts.actor))) return fail("Yetkiniz yok");
  const parsed = workingHoursSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Geçersiz bilgi");
  const b = await prisma.barber.findUnique({ where: { id: barberId } });
  if (!b) return fail("Berber bulunamadı");
  await prisma.$transaction([
    prisma.workingHours.deleteMany({ where: { barberId } }),
    prisma.workingHours.createMany({ data: parsed.data.days.map((d) => ({ ...d, barberId })) }),
  ]);
  if (!opts.actor) revalidatePath(`/panel/berberler/${barberId}`);
  return ok(undefined);
}

export async function resetBarberPassword(barberId: string, newPassword: string, opts: { actor?: SessionUser } = {}): Promise<ActionResult<void>> {
  if (!(await requireAdminActor(opts.actor))) return fail("Yetkiniz yok");
  if (newPassword.length < 8) return fail("Şifre en az 8 karakter olmalı");
  const b = await prisma.barber.findUnique({ where: { id: barberId } });
  if (!b) return fail("Berber bulunamadı");
  await prisma.user.update({ where: { id: b.userId }, data: { passwordHash: await bcrypt.hash(newPassword, 10) } });
  return ok(undefined);
}
