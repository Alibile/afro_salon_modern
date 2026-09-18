import { describe, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db";
import { createBarber, createCustomer } from "./helpers";
import { searchCustomers, getCustomerDetail } from "@/lib/queries/customers";
import type { SessionUser } from "@/lib/auth-helpers";

const admin: SessionUser = { id: "a", name: "Admin", email: "a@t", role: "ADMIN", barberId: null, locale: "tr" };
const asBarber = (u: { id: string; name: string; email: string }, barberId: string): SessionUser => ({ ...u, role: "BARBER", barberId, locale: "tr" });

async function appt(customerId: string, barberId: string, startsAt: string, status: "SCHEDULED" | "COMPLETED" = "COMPLETED") {
  return prisma.appointment.create({
    data: { customerId, barberId, startsAt: new Date(startsAt), endsAt: new Date(new Date(startsAt).getTime() + 30 * 60_000), status },
  });
}

describe("searchCustomers", () => {
  it("shows a barber only the customers they have served", async () => {
    const b1 = await createBarber();
    const b2 = await createBarber();
    const mine = await createCustomer({ name: "Benim Müşterim" });
    const theirs = await createCustomer({ name: "Öteki Müşteri" });
    await appt(mine.id, b1.barber.id, "2026-09-16T08:00:00Z");
    await appt(theirs.id, b2.barber.id, "2026-09-16T09:00:00Z");

    const forBarber = await searchCustomers(asBarber(b1.user, b1.barber.id), "");
    expect(forBarber.map((c) => c.id)).toEqual([mine.id]);

    const forAdmin = await searchCustomers(admin, "");
    expect(forAdmin.map((c) => c.id).sort()).toEqual([mine.id, theirs.id].sort());
  });

  it("reports lastVisit from the barber's own completed appointments", async () => {
    const b1 = await createBarber();
    const b2 = await createBarber();
    const c = await createCustomer();
    const own = await appt(c.id, b1.barber.id, "2026-09-10T08:00:00Z");
    await appt(c.id, b2.barber.id, "2026-09-15T08:00:00Z");

    const [row] = await searchCustomers(asBarber(b1.user, b1.barber.id), "");
    expect(row.lastVisit?.toISOString()).toBe(own.startsAt.toISOString());
  });
});

describe("getCustomerDetail", () => {
  it("returns null for a customer the barber never served", async () => {
    const b1 = await createBarber();
    const b2 = await createBarber();
    const theirs = await createCustomer();
    await appt(theirs.id, b2.barber.id, "2026-09-16T09:00:00Z");

    expect(await getCustomerDetail(asBarber(b1.user, b1.barber.id), theirs.id)).toBeNull();
    expect(await getCustomerDetail(admin, theirs.id)).not.toBeNull();
  });

  it("limits appointments and photos to the barber's own records", async () => {
    const b1 = await createBarber();
    const b2 = await createBarber();
    const c = await createCustomer();
    const own = await appt(c.id, b1.barber.id, "2026-09-16T08:00:00Z");
    const other = await appt(c.id, b2.barber.id, "2026-09-16T09:00:00Z");
    const ownPhoto = await prisma.haircutPhoto.create({ data: { customerId: c.id, barberId: b1.barber.id, storageKey: `haircuts/${randomUUID()}.jpg` } });
    await prisma.haircutPhoto.create({ data: { customerId: c.id, barberId: b2.barber.id, storageKey: `haircuts/${randomUUID()}.jpg` } });

    const forBarber = await getCustomerDetail(asBarber(b1.user, b1.barber.id), c.id);
    expect(forBarber?.appointments.map((a) => a.id)).toEqual([own.id]);
    expect(forBarber?.photos.map((p) => p.id)).toEqual([ownPhoto.id]);

    const forAdmin = await getCustomerDetail(admin, c.id);
    expect(forAdmin?.appointments.map((a) => a.id).sort()).toEqual([own.id, other.id].sort());
    expect(forAdmin?.photos).toHaveLength(2);
  });
});
