import { describe, it, expect } from "vitest";
import { prisma } from "@/lib/db";
import { createBarber, createCustomer } from "./helpers";
import { cancelAppointmentByCustomer } from "@/actions/appointments";

async function appt(customerId: string, barberId: string, startsAt: string) {
  return prisma.appointment.create({
    data: { customerId, barberId, startsAt: new Date(startsAt), endsAt: new Date(new Date(startsAt).getTime() + 30 * 60_000) },
  });
}

describe("cancelAppointmentByCustomer", () => {
  it("cancels when more than window remains (default 120 min)", async () => {
    const { barber } = await createBarber();
    const c = await createCustomer();
    const a = await appt(c.id, barber.id, "2026-09-17T12:00:00Z");
    const r = await cancelAppointmentByCustomer(a.id, { now: new Date("2026-09-17T09:00:00Z"), customerId: c.id });
    expect(r.ok).toBe(true);
    const after = await prisma.appointment.findUnique({ where: { id: a.id } });
    expect(after?.status).toBe("CANCELLED");
    expect(after?.cancelledBy).toBe("CUSTOMER");
  });

  it("refuses inside the window", async () => {
    const { barber } = await createBarber();
    const c = await createCustomer();
    const a = await appt(c.id, barber.id, "2026-09-17T12:00:00Z");
    const r = await cancelAppointmentByCustomer(a.id, { now: new Date("2026-09-17T10:30:00Z"), customerId: c.id });
    expect(r).toEqual({ ok: false, error: "Randevuya 120 dakikadan az kaldığı için iptal edilemez, lütfen dükkanı arayın" });
  });

  it("refuses other customer's appointment", async () => {
    const { barber } = await createBarber();
    const c1 = await createCustomer();
    const c2 = await createCustomer();
    const a = await appt(c1.id, barber.id, "2026-09-17T12:00:00Z");
    const r = await cancelAppointmentByCustomer(a.id, { now: new Date("2026-09-17T08:00:00Z"), customerId: c2.id });
    expect(r).toEqual({ ok: false, error: "Randevu bulunamadı" });
  });

  it("refuses already cancelled", async () => {
    const { barber } = await createBarber();
    const c = await createCustomer();
    const a = await appt(c.id, barber.id, "2026-09-17T12:00:00Z");
    await prisma.appointment.update({ where: { id: a.id }, data: { status: "CANCELLED" } });
    const r = await cancelAppointmentByCustomer(a.id, { now: new Date("2026-09-17T08:00:00Z"), customerId: c.id });
    expect(r.ok).toBe(false);
  });
});
