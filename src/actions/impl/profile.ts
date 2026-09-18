import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { ok, fail, type ActionResult } from "@/lib/action-result";
import { firstIssueKey } from "@/lib/errors";
import type { SessionUser } from "@/lib/auth-helpers";
import { asStaffActor } from "@/lib/staff-scope";
import { userProfileSchema, barberProfileSchema, changePasswordSchema, isUploadedBarberPhotoKey, type UserProfileInput, type BarberProfileInput, type ChangePasswordInput } from "@/schemas/profile";
import { deleteObject } from "@/lib/storage";

export async function updateOwnProfileAs(actorInput: SessionUser | null, input: UserProfileInput | BarberProfileInput): Promise<ActionResult<void>> {
  const actor = asStaffActor(actorInput);
  if (!actor) return fail("errors.notAllowed");

  if (actor.barberId) {
    const parsed = barberProfileSchema.safeParse(input);
    if (!parsed.success) return fail(firstIssueKey(parsed.error));
    const { name, phone, bio, photoKey } = parsed.data;
    const existing = await prisma.barber.findUnique({ where: { id: actor.barberId } });
    if (!existing) return fail("errors.barberNotFound");
    // Anahtar ya bu kullanıcının kendi yüklemesinden gelmiş olmalı ya da
    // değişmemiş olmalı; başka bir nesnenin anahtarı kabul edilmez.
    if (photoKey !== existing.photoKey && !isUploadedBarberPhotoKey(photoKey)) return fail("errors.invalidPhotoKey");
    await prisma.$transaction([
      prisma.user.update({ where: { id: actor.id }, data: { name, phone: phone || null } }),
      prisma.barber.update({ where: { id: actor.barberId }, data: { bio: bio || null, photoKey } }),
    ]);
    if (existing.photoKey !== photoKey && !existing.photoKey.startsWith("seed/") && !existing.photoKey.startsWith("landing/"))
      await deleteObject(existing.photoKey);
    return ok(undefined);
  }

  const parsed = userProfileSchema.safeParse(input);
  if (!parsed.success) return fail(firstIssueKey(parsed.error));
  const { name, phone } = parsed.data;
  await prisma.user.update({ where: { id: actor.id }, data: { name, phone: phone || null } });
  return ok(undefined);
}

export async function changeOwnPasswordAs(actorInput: SessionUser | null, input: ChangePasswordInput): Promise<ActionResult<void>> {
  const actor = asStaffActor(actorInput);
  if (!actor) return fail("errors.notAllowed");
  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) return fail(firstIssueKey(parsed.error));
  const { currentPassword, newPassword } = parsed.data;

  const user = await prisma.user.findUnique({ where: { id: actor.id } });
  if (!user) return fail("errors.userNotFound");
  if (!(await bcrypt.compare(currentPassword, user.passwordHash))) return fail("errors.wrongPassword");

  await prisma.user.update({ where: { id: actor.id }, data: { passwordHash: await bcrypt.hash(newPassword, 10) } });
  return ok(undefined);
}
