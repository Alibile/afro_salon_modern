import { describe, it, expect, vi } from "vitest";
import { prisma } from "@/lib/db";
import type { SessionUser } from "@/lib/auth-helpers";
import { createBarber, createCustomer, createService } from "./helpers";

vi.mock("@/lib/storage", () => ({
  deleteObject: vi.fn(async () => {}),
  createPresignedUpload: vi.fn(),
}));

import { deleteObject } from "@/lib/storage";
import { deleteServiceAs } from "@/actions/impl/services";
import { deleteBarberAs } from "@/actions/impl/barbers";

const admin: SessionUser = { id: "a", name: "Admin", email: "a@t", role: "ADMIN", barberId: null };
const barberActor: SessionUser = { id: "b", name: "B", email: "b@t", role: "BARBER", barberId: "x" };

describe("deleteServiceAs", () => {
  it("refuses barber actor", async () => {
    const s = await createService();
    const r = await deleteServiceAs(barberActor, s.id);
    expect(r).toEqual({ ok: false, error: "Yetkiniz yok" });
  });

  it("refuses when service missing", async () => {
    const r = await deleteServiceAs(admin, "yok");
    expect(r).toEqual({ ok: false, error: "Hizmet bulunamadı" });
  });

  it("refuses when used in past appointments", async () => {
    const s = await createService();
    const customer = await createCustomer();
    const { barber } = await createBarber();
    const appointment = await prisma.appointment.create({
      data: {
        customerId: customer.id,
        barberId: barber.id,
        startsAt: new Date("2026-01-01T10:00:00.000Z"),
        endsAt: new Date("2026-01-01T10:30:00.000Z"),
        status: "COMPLETED",
      },
    });
    await prisma.appointmentService.create({
      data: { appointmentId: appointment.id, serviceId: s.id, nameSnapshot: s.name, durationSnapshot: s.durationMinutes, priceSnapshot: s.priceKurus },
    });
    const r = await deleteServiceAs(admin, s.id);
    expect(r).toEqual({ ok: false, error: "Bu hizmet geçmiş randevularda kullanılmış, silinemez; pasife alın" });
    expect(await prisma.service.count()).toBe(1);
  });

  it("deletes an unused service", async () => {
    const s = await createService();
    const r = await deleteServiceAs(admin, s.id);
    expect(r.ok).toBe(true);
    expect(await prisma.service.count()).toBe(0);
  });
});

describe("deleteBarberAs", () => {
  it("refuses barber actor", async () => {
    const { barber } = await createBarber();
    const r = await deleteBarberAs(barberActor, barber.id);
    expect(r).toEqual({ ok: false, error: "Yetkiniz yok" });
  });

  it("refuses when barber missing", async () => {
    const r = await deleteBarberAs(admin, "yok");
    expect(r).toEqual({ ok: false, error: "Berber bulunamadı" });
  });

  it("refuses when barber has appointment history", async () => {
    const { barber } = await createBarber();
    const customer = await createCustomer();
    await prisma.appointment.create({
      data: {
        customerId: customer.id,
        barberId: barber.id,
        startsAt: new Date("2026-01-01T10:00:00.000Z"),
        endsAt: new Date("2026-01-01T10:30:00.000Z"),
        status: "COMPLETED",
      },
    });
    const r = await deleteBarberAs(admin, barber.id);
    expect(r).toEqual({ ok: false, error: "Bu berberin randevu veya fotoğraf geçmişi var, silinemez; pasife alın" });
    expect(await prisma.barber.count()).toBe(1);
  });

  it("refuses when barber has photo history", async () => {
    const { barber } = await createBarber();
    const customer = await createCustomer();
    await prisma.haircutPhoto.create({
      data: { customerId: customer.id, barberId: barber.id, storageKey: "haircuts/x.jpg" },
    });
    const r = await deleteBarberAs(admin, barber.id);
    expect(r).toEqual({ ok: false, error: "Bu berberin randevu veya fotoğraf geçmişi var, silinemez; pasife alın" });
  });

  it("refuses admin deleting their own barber record", async () => {
    const { user, barber } = await createBarber();
    const selfAdmin: SessionUser = { id: user.id, name: user.name, email: user.email, role: "ADMIN", barberId: barber.id };
    const r = await deleteBarberAs(selfAdmin, barber.id);
    expect(r).toEqual({ ok: false, error: "Kendi hesabınızı silemezsiniz" });
    expect(await prisma.barber.count()).toBe(1);
  });

  it("deletes a clean barber: user, barber, working hours all gone; photo deleted from storage unless seed/landing", async () => {
    const { user, barber } = await createBarber();
    const r = await deleteBarberAs(admin, barber.id);
    expect(r.ok).toBe(true);
    expect(await prisma.barber.count()).toBe(0);
    expect(await prisma.user.findUnique({ where: { id: user.id } })).toBeNull();
    expect(await prisma.workingHours.count({ where: { barberId: barber.id } })).toBe(0);
    expect(deleteObject).toHaveBeenCalledWith(barber.photoKey);
  });

  it("does not call deleteObject for seed/landing photo keys", async () => {
    const { barber } = await createBarber();
    await prisma.barber.update({ where: { id: barber.id }, data: { photoKey: "seed/team-1.jpg" } });
    vi.mocked(deleteObject).mockClear();
    const r = await deleteBarberAs(admin, barber.id);
    expect(r.ok).toBe(true);
    expect(deleteObject).not.toHaveBeenCalled();
  });
});
