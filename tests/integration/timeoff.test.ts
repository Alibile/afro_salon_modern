import { describe, it, expect } from "vitest";
import { prisma } from "@/lib/db";
import { createBarber, createCustomer } from "./helpers";
import { createTimeOff, deleteTimeOff } from "@/actions/timeoff";
import type { SessionUser } from "@/lib/auth-helpers";

const asBarber = (u: { id: string; name: string; email: string }, barberId: string): SessionUser => ({ ...u, role: "BARBER", barberId });

describe("timeoff", () => {
  it("all-day off covers Istanbul day and reports conflicts", async () => {
    const { user, barber } = await createBarber();
    const c = await createCustomer();
    await prisma.appointment.create({ data: { customerId: c.id, barberId: barber.id, startsAt: new Date("2026-09-17T08:00:00Z"), endsAt: new Date("2026-09-17T08:30:00Z") } });
    const r = await createTimeOff({ barberId: barber.id, date: "2026-09-17", allDay: true, reason: "Hasta" }, { actor: asBarber(user, barber.id) });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.conflicts).toBe(1);
    const t = await prisma.timeOff.findUnique({ where: { id: r.data.id } });
    expect(t?.startsAt.toISOString()).toBe("2026-09-16T21:00:00.000Z");
    expect(t?.endsAt.toISOString()).toBe("2026-09-17T21:00:00.000Z");
  });

  it("partial off uses given hours", async () => {
    const { user, barber } = await createBarber();
    const r = await createTimeOff({ barberId: barber.id, date: "2026-09-17", allDay: false, startTime: "13:00", endTime: "15:00" }, { actor: asBarber(user, barber.id) });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const t = await prisma.timeOff.findUnique({ where: { id: r.data.id } });
    expect(t?.startsAt.toISOString()).toBe("2026-09-17T10:00:00.000Z");
    expect(t?.endsAt.toISOString()).toBe("2026-09-17T12:00:00.000Z");
  });

  it("barber cannot create for another barber", async () => {
    const b1 = await createBarber();
    const b2 = await createBarber();
    const r = await createTimeOff({ barberId: b2.barber.id, date: "2026-09-17", allDay: true }, { actor: asBarber(b1.user, b1.barber.id) });
    expect(r).toEqual({ ok: false, error: "Yetkiniz yok" });
  });

  it("delete respects scope", async () => {
    const b1 = await createBarber();
    const b2 = await createBarber();
    const r = await createTimeOff({ barberId: b1.barber.id, date: "2026-09-17", allDay: true }, { actor: asBarber(b1.user, b1.barber.id) });
    if (!r.ok) throw new Error();
    expect((await deleteTimeOff(r.data.id, { actor: asBarber(b2.user, b2.barber.id) })).ok).toBe(false);
    expect((await deleteTimeOff(r.data.id, { actor: asBarber(b1.user, b1.barber.id) })).ok).toBe(true);
  });
});
