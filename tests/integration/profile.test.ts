import { describe, it, expect, vi } from "vitest";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { createBarber } from "./helpers";
import type { SessionUser } from "@/lib/auth-helpers";

vi.mock("@/lib/storage", () => ({
  deleteObject: vi.fn(async () => {}),
  createPresignedUpload: vi.fn(),
}));

import { deleteObject } from "@/lib/storage";
import { updateOwnProfileAs, changeOwnPasswordAs } from "@/actions/impl/profile";

const asBarber = (u: { id: string; name: string; email: string }, barberId: string): SessionUser => ({ ...u, role: "BARBER", barberId });
const asAdmin = (u: { id: string; name: string; email: string }): SessionUser => ({ ...u, role: "ADMIN", barberId: null });
const customer: SessionUser = { id: "c1", name: "Müşteri", email: "c@t", role: "CUSTOMER", barberId: null };

describe("profile actions", () => {
  it("barber updates own name, phone, bio and photo", async () => {
    const { user, barber } = await createBarber();
    const actor = asBarber(user, barber.id);
    const r = await updateOwnProfileAs(actor, { name: "Yeni İsim", phone: "5551112233", bio: "Fade ustası", photoKey: "barbers/new.jpg" });
    expect(r.ok).toBe(true);

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    const dbBarber = await prisma.barber.findUnique({ where: { id: barber.id } });
    expect(dbUser?.name).toBe("Yeni İsim");
    expect(dbUser?.phone).toBe("5551112233");
    expect(dbBarber?.bio).toBe("Fade ustası");
    expect(dbBarber?.photoKey).toBe("barbers/new.jpg");
    expect(deleteObject).toHaveBeenCalledWith("barbers/test.jpg");
  });

  it("does not touch other users' records", async () => {
    const { user: user1, barber: barber1 } = await createBarber();
    const { user: user2, barber: barber2 } = await createBarber();
    const actor = asBarber(user1, barber1.id);
    await updateOwnProfileAs(actor, { name: "Değişen", phone: "", bio: "", photoKey: "barbers/test.jpg" });

    const dbUser2 = await prisma.user.findUnique({ where: { id: user2.id } });
    const dbBarber2 = await prisma.barber.findUnique({ where: { id: barber2.id } });
    expect(dbUser2?.name).toBe(user2.name);
    expect(dbBarber2?.bio).toBe(barber2.bio);
  });

  it("does not delete R2 photo when key unchanged", async () => {
    const { user, barber } = await createBarber();
    const actor = asBarber(user, barber.id);
    vi.mocked(deleteObject).mockClear();
    await updateOwnProfileAs(actor, { name: user.name, phone: "", bio: "", photoKey: barber.photoKey });
    expect(deleteObject).not.toHaveBeenCalled();
  });

  it("never touches isActive or role", async () => {
    const { user, barber } = await createBarber();
    const actor = asBarber(user, barber.id);
    await updateOwnProfileAs(actor, { name: "İsim", phone: "", bio: "", photoKey: barber.photoKey });
    const dbBarber = await prisma.barber.findUnique({ where: { id: barber.id } });
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    expect(dbBarber?.isActive).toBe(true);
    expect(dbUser?.role).toBe("BARBER");
  });

  it("admin without a barber record updates name and phone only", async () => {
    const adminUser = await prisma.user.create({
      data: { name: "Admin Test", email: "admin-profile@test.local", passwordHash: "x", role: "ADMIN" },
    });
    const actor = asAdmin(adminUser);
    const r = await updateOwnProfileAs(actor, { name: "Admin Güncel", phone: "5559998877" });
    expect(r.ok).toBe(true);
    const dbUser = await prisma.user.findUnique({ where: { id: adminUser.id } });
    expect(dbUser?.name).toBe("Admin Güncel");
    expect(dbUser?.phone).toBe("5559998877");
  });

  it("CUSTOMER is refused", async () => {
    const r = await updateOwnProfileAs(customer, { name: "Deneme", phone: "" });
    expect(r).toEqual({ ok: false, error: "Yetkiniz yok" });
  });

  it("wrong current password is refused", async () => {
    const passwordHash = await bcrypt.hash("DogruSifre123", 10);
    const user = await prisma.user.create({
      data: { name: "Şifre Test", email: "sifre-test@test.local", passwordHash, role: "BARBER" },
    });
    const barber = await prisma.barber.create({ data: { userId: user.id, photoKey: "barbers/test.jpg" } });
    const actor = asBarber(user, barber.id);
    const r = await changeOwnPasswordAs(actor, { currentPassword: "YanlisSifre", newPassword: "YeniSifre123" });
    expect(r).toEqual({ ok: false, error: "Mevcut şifre hatalı" });
  });

  it("correct current password changes the hash", async () => {
    const passwordHash = await bcrypt.hash("DogruSifre123", 10);
    const user = await prisma.user.create({
      data: { name: "Şifre Test 2", email: "sifre-test-2@test.local", passwordHash, role: "BARBER" },
    });
    const barber = await prisma.barber.create({ data: { userId: user.id, photoKey: "barbers/test.jpg" } });
    const actor = asBarber(user, barber.id);
    const r = await changeOwnPasswordAs(actor, { currentPassword: "DogruSifre123", newPassword: "YeniSifre123" });
    expect(r.ok).toBe(true);
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    expect(dbUser?.passwordHash).not.toBe(passwordHash);
    expect(await bcrypt.compare("YeniSifre123", dbUser!.passwordHash)).toBe(true);
  });

  it("changeOwnPassword CUSTOMER is refused", async () => {
    const r = await changeOwnPasswordAs(customer, { currentPassword: "x", newPassword: "YeniSifre123" });
    expect(r).toEqual({ ok: false, error: "Yetkiniz yok" });
  });
});
