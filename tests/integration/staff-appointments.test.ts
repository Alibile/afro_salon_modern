import { describe, it, expect } from "vitest";
import { prisma } from "@/lib/db";
import { createBarber, createCustomer } from "./helpers";
import { setAppointmentStatusAs } from "@/actions/impl/staff-appointments";
import type { SessionUser } from "@/lib/auth-helpers";

const asUser = (u: { id: string; name: string; email: string; role: "BARBER" | "ADMIN" }, barberId: string | null): SessionUser => ({ ...u, barberId, locale: "tr" });

async function appt(customerId: string, barberId: string) {
  return prisma.appointment.create({ data: { customerId, barberId, startsAt: new Date("2026-09-17T08:00:00Z"), endsAt: new Date("2026-09-17T08:30:00Z") } });
}

describe("setAppointmentStatus", () => {
  it("barber completes own appointment", async () => {
    const { user, barber } = await createBarber();
    const c = await createCustomer();
    const a = await appt(c.id, barber.id);
    const r = await setAppointmentStatusAs(asUser({ ...user, role: "BARBER" }, barber.id), a.id, "COMPLETED");
    expect(r.ok).toBe(true);
    expect((await prisma.appointment.findUnique({ where: { id: a.id } }))?.status).toBe("COMPLETED");
  });

  it("barber cannot touch another barber's appointment", async () => {
    const b1 = await createBarber();
    const b2 = await createBarber();
    const c = await createCustomer();
    const a = await appt(c.id, b1.barber.id);
    const r = await setAppointmentStatusAs(asUser({ ...b2.user, role: "BARBER" }, b2.barber.id), a.id, "COMPLETED");
    expect(r).toEqual({ ok: false, error: "errors.appointmentNotFound" });
  });

  it("admin cancels any appointment with cancelledBy STAFF", async () => {
    const b1 = await createBarber();
    const c = await createCustomer();
    const admin = await prisma.user.create({ data: { name: "Admin", email: "admin@t.local", passwordHash: "x", role: "ADMIN" } });
    const a = await appt(c.id, b1.barber.id);
    const r = await setAppointmentStatusAs(asUser({ ...admin, role: "ADMIN" }, null), a.id, "CANCELLED");
    expect(r.ok).toBe(true);
    const after = await prisma.appointment.findUnique({ where: { id: a.id } });
    expect(after?.status).toBe("CANCELLED");
    expect(after?.cancelledBy).toBe("STAFF");
  });

  it("cannot change a non-SCHEDULED appointment", async () => {
    const { user, barber } = await createBarber();
    const c = await createCustomer();
    const a = await appt(c.id, barber.id);
    await prisma.appointment.update({ where: { id: a.id }, data: { status: "CANCELLED" } });
    const r = await setAppointmentStatusAs(asUser({ ...user, role: "BARBER" }, barber.id), a.id, "COMPLETED");
    expect(r.ok).toBe(false);
  });
});
