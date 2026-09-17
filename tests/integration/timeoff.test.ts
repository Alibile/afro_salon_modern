import { describe, it, expect } from "vitest";
import { prisma } from "@/lib/db";
import { createBarber, createCustomer } from "./helpers";
import { createTimeOffAs, deleteTimeOffAs } from "@/actions/impl/timeoff";
import type { SessionUser } from "@/lib/auth-helpers";

const asBarber = (u: { id: string; name: string; email: string }, barberId: string): SessionUser => ({ ...u, role: "BARBER", barberId });

describe("timeoff", () => {
  it("all-day off covers Istanbul day and reports conflicts", async () => {
    const { user, barber } = await createBarber();
    const c = await createCustomer();
    await prisma.appointment.create({ data: { customerId: c.id, barberId: barber.id, startsAt: new Date("2026-09-17T08:00:00Z"), endsAt: new Date("2026-09-17T08:30:00Z") } });
    const r = await createTimeOffAs(asBarber(user, barber.id), { barberId: barber.id, date: "2026-09-17", allDay: true, reason: "Hasta" });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.conflicts).toBe(1);
    const t = await prisma.timeOff.findUnique({ where: { id: r.data.id } });
    expect(t?.startsAt.toISOString()).toBe("2026-09-16T21:00:00.000Z");
    expect(t?.endsAt.toISOString()).toBe("2026-09-17T21:00:00.000Z");
  });

  it("partial off uses given hours", async () => {
    const { user, barber } = await createBarber();
    const r = await createTimeOffAs(asBarber(user, barber.id), { barberId: barber.id, date: "2026-09-17", allDay: false, startTime: "13:00", endTime: "15:00" });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const t = await prisma.timeOff.findUnique({ where: { id: r.data.id } });
    expect(t?.startsAt.toISOString()).toBe("2026-09-17T10:00:00.000Z");
    expect(t?.endsAt.toISOString()).toBe("2026-09-17T12:00:00.000Z");
  });

  it("barber cannot create for another barber", async () => {
    const b1 = await createBarber();
    const b2 = await createBarber();
    const r = await createTimeOffAs(asBarber(b1.user, b1.barber.id), { barberId: b2.barber.id, date: "2026-09-17", allDay: true });
    expect(r).toEqual({ ok: false, error: "Yetkiniz yok" });
  });

  it("delete respects scope", async () => {
    const b1 = await createBarber();
    const b2 = await createBarber();
    const r = await createTimeOffAs(asBarber(b1.user, b1.barber.id), { barberId: b1.barber.id, date: "2026-09-17", allDay: true });
    if (!r.ok) throw new Error();
    expect((await deleteTimeOffAs(asBarber(b2.user, b2.barber.id), r.data.id)).ok).toBe(false);
    expect((await deleteTimeOffAs(asBarber(b1.user, b1.barber.id), r.data.id)).ok).toBe(true);
  });

  it("admin creating time off for nonexistent barber fails", async () => {
    const admin: SessionUser = { id: "a", name: "Admin", email: "a@t", role: "ADMIN", barberId: null };
    const r = await createTimeOffAs(admin, { barberId: "yok", date: "2026-09-17", allDay: true });
    expect(r).toEqual({ ok: false, error: "Berber bulunamadı" });
  });
});
