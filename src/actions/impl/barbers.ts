import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import { ok, fail, type ActionResult } from "@/lib/action-result";
import { firstIssueKey } from "@/lib/errors";
import type { SessionUser } from "@/lib/auth-helpers";
import { asAdminActor } from "@/lib/staff-scope";
import { createBarberSchema, updateBarberSchema, workingHoursSchema, type CreateBarberInput, type UpdateBarberInput, type WorkingHoursInput } from "@/schemas/barber";
import { deleteObject } from "@/lib/storage";

const DEFAULT_HOURS = [0, 1, 2, 3, 4, 5, 6].map((d) => ({ dayOfWeek: d, startTime: "09:00", endTime: "19:00", isOff: d === 0 }));

export async function createBarberAs(actor: SessionUser | null, input: CreateBarberInput): Promise<ActionResult<{ barberId: string }>> {
  if (!asAdminActor(actor)) return fail("errors.notAllowed");
  const parsed = createBarberSchema.safeParse(input);
  if (!parsed.success) return fail(firstIssueKey(parsed.error));
  const { name, email, password, bio, photoKey } = parsed.data;
  if (await prisma.user.findUnique({ where: { email } })) return fail("errors.emailTaken");

  const passwordHash = await bcrypt.hash(password, 10);
  const barber = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({ data: { name, email, passwordHash, role: "BARBER" } });
    const b = await tx.barber.create({ data: { userId: user.id, bio: bio || null, photoKey } });
    await tx.workingHours.createMany({ data: DEFAULT_HOURS.map((h) => ({ ...h, barberId: b.id })) });
    return b;
  });
  return ok({ barberId: barber.id });
}

export async function updateBarberAs(actor: SessionUser | null, barberId: string, input: UpdateBarberInput): Promise<ActionResult<void>> {
  if (!asAdminActor(actor)) return fail("errors.notAllowed");
  const parsed = updateBarberSchema.safeParse(input);
  if (!parsed.success) return fail(firstIssueKey(parsed.error));
  const existing = await prisma.barber.findUnique({ where: { id: barberId } });
  if (!existing) return fail("errors.barberNotFound");
  const { name, bio, photoKey, isActive } = parsed.data;
  await prisma.$transaction([
    prisma.user.update({ where: { id: existing.userId }, data: { name } }),
    prisma.barber.update({ where: { id: barberId }, data: { bio: bio || null, photoKey, isActive } }),
  ]);
  if (existing.photoKey !== photoKey && !existing.photoKey.startsWith("seed/") && !existing.photoKey.startsWith("landing/"))
    await deleteObject(existing.photoKey);
  return ok(undefined);
}

export async function saveWorkingHoursAs(actor: SessionUser | null, barberId: string, input: WorkingHoursInput): Promise<ActionResult<void>> {
  if (!asAdminActor(actor)) return fail("errors.notAllowed");
  const parsed = workingHoursSchema.safeParse(input);
  if (!parsed.success) return fail(firstIssueKey(parsed.error));
  const b = await prisma.barber.findUnique({ where: { id: barberId } });
  if (!b) return fail("errors.barberNotFound");
  await prisma.$transaction([
    prisma.workingHours.deleteMany({ where: { barberId } }),
    prisma.workingHours.createMany({ data: parsed.data.days.map((d) => ({ ...d, barberId })) }),
  ]);
  return ok(undefined);
}

export async function resetBarberPasswordAs(actor: SessionUser | null, barberId: string, newPassword: string): Promise<ActionResult<void>> {
  if (!asAdminActor(actor)) return fail("errors.notAllowed");
  if (newPassword.length < 8) return fail("errors.passwordMin8");
  const b = await prisma.barber.findUnique({ where: { id: barberId } });
  if (!b) return fail("errors.barberNotFound");
  await prisma.user.update({ where: { id: b.userId }, data: { passwordHash: await bcrypt.hash(newPassword, 10) } });
  return ok(undefined);
}

export async function deleteBarberAs(actorInput: SessionUser | null, barberId: string): Promise<ActionResult<void>> {
  const actor = asAdminActor(actorInput);
  if (!actor) return fail("errors.notAllowed");
  const existing = await prisma.barber.findUnique({ where: { id: barberId } });
  if (!existing) return fail("errors.barberNotFound");
  if (existing.userId === actor.id) return fail("errors.cannotDeleteOwnAccount");
  const [appointmentCount, photoCount, customerAppointmentCount, customerPhotoCount] = await Promise.all([
    prisma.appointment.count({ where: { barberId } }),
    prisma.haircutPhoto.count({ where: { barberId } }),
    prisma.appointment.count({ where: { customerId: existing.userId } }),
    prisma.haircutPhoto.count({ where: { customerId: existing.userId } }),
  ]);
  if (appointmentCount > 0 || photoCount > 0) return fail("errors.barberHasHistory");
  // Berberin kullanıcı hesabı aynı zamanda müşteri olarak da kayıt taşıyabilir;
  // bu durumda user.delete yabancı anahtar hatası verir, önce burada durdururuz.
  if (customerAppointmentCount > 0 || customerPhotoCount > 0)
    return fail("errors.userHasHistory");
  try {
    await prisma.$transaction([
      prisma.timeOff.deleteMany({ where: { barberId } }),
      prisma.workingHours.deleteMany({ where: { barberId } }),
      prisma.barber.delete({ where: { id: barberId } }),
      prisma.user.delete({ where: { id: existing.userId } }),
    ]);
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2003")
      return fail("errors.barberHasRelations");
    throw e;
  }
  if (!existing.photoKey.startsWith("seed/") && !existing.photoKey.startsWith("landing/")) await deleteObject(existing.photoKey);
  return ok(undefined);
}
