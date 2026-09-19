import { describe, it, expect } from "vitest";
import { prisma } from "@/lib/db";
import { createBarber, createCustomer, createService } from "./helpers";
import { getCustomerAppointments, getCustomerPhotos } from "@/lib/queries/customer";

// Perşembe 2026-09-17 10:00 Istanbul = 07:00Z
const NOW = new Date("2026-09-17T07:00:00Z");

async function appt(
  customerId: string,
  barberId: string,
  startsAt: string,
  overrides: Partial<{ status: "SCHEDULED" | "COMPLETED" | "CANCELLED" | "NO_SHOW" }> = {},
) {
  return prisma.appointment.create({
    data: {
      customerId,
      barberId,
      startsAt: new Date(startsAt),
      endsAt: new Date(new Date(startsAt).getTime() + 30 * 60_000),
      status: overrides.status ?? "SCHEDULED",
    },
  });
}

describe("getCustomerAppointments", () => {
  /**
   * Randevu penceresi bir haftaya açıldı: "bugünkü randevum" yerine bugünden
   * başlayan bütün planlı randevular yaklaşan listede, en yakından uzağa
   * doğru durur.
   */
  it("partitions appointments into upcoming (from the Istanbul day start) and past, ordered", async () => {
    const { barber } = await createBarber();
    const c = await createCustomer();

    const midnight = await appt(c.id, barber.id, "2026-09-16T21:00:00Z"); // İstanbul'da tam gece yarısı → bugüne ait
    const at08 = await appt(c.id, barber.id, "2026-09-17T08:00:00Z");
    const at12 = await appt(c.id, barber.id, "2026-09-17T12:00:00Z");
    const tomorrow = await appt(c.id, barber.id, "2026-09-18T08:00:00Z");
    const completedToday = await appt(c.id, barber.id, "2026-09-17T06:00:00Z", { status: "COMPLETED" });
    const yesterday = await appt(c.id, barber.id, "2026-09-16T10:00:00Z");

    const { upcoming, past } = await getCustomerAppointments(c.id, NOW);

    expect(upcoming.map((a) => a.id)).toEqual([midnight.id, at08.id, at12.id, tomorrow.id]);
    expect(past.map((a) => a.id)).toEqual([completedToday.id, yesterday.id]);
    expect(upcoming.some((a) => past.some((p) => p.id === a.id))).toBe(false);
  });

  it("computes canCancel based on the default 120 minute window", async () => {
    const { barber } = await createBarber();
    const c = await createCustomer();

    const at12 = await appt(c.id, barber.id, "2026-09-17T12:00:00Z"); // 300 dk sonra
    const at08 = await appt(c.id, barber.id, "2026-09-17T08:00:00Z"); // 60 dk sonra
    const completed = await appt(c.id, barber.id, "2026-09-17T06:00:00Z", { status: "COMPLETED" });
    const boundary = await appt(c.id, barber.id, "2026-09-17T09:00:00Z"); // tam 120 dk sonra

    const { upcoming, past } = await getCustomerAppointments(c.id, NOW);
    const all = [...upcoming, ...past];
    const byId = (id: string) => all.find((a) => a.id === id)!;

    expect(byId(at12.id).canCancel).toBe(true);
    expect(byId(at08.id).canCancel).toBe(false);
    expect(byId(completed.id).canCancel).toBe(false);
    expect(byId(boundary.id).canCancel).toBe(true);
  });

  it("includes totalKurus, services and barberName from AppointmentService snapshots", async () => {
    const { user, barber } = await createBarber({ name: "Ahmet Usta" });
    const c = await createCustomer();
    const s1 = await createService({ name: "Saç Kesimi", priceKurus: 40000 });
    const s2 = await createService({ name: "Sakal", priceKurus: 20000 });
    const a = await appt(c.id, barber.id, "2026-09-17T12:00:00Z");
    await prisma.appointmentService.createMany({
      data: [
        { appointmentId: a.id, serviceId: s1.id, nameSnapshot: "Saç Kesimi", durationSnapshot: s1.durationMinutes, priceSnapshot: s1.priceKurus },
        { appointmentId: a.id, serviceId: s2.id, nameSnapshot: "Sakal", durationSnapshot: s2.durationMinutes, priceSnapshot: s2.priceKurus },
      ],
    });

    const { upcoming } = await getCustomerAppointments(c.id, NOW);
    const view = upcoming.find((v) => v.id === a.id)!;

    expect(view.totalKurus).toBe(60000);
    expect(view.services).toEqual(
      expect.arrayContaining([
        { name: "Saç Kesimi", priceSnapshot: 40000 },
        { name: "Sakal", priceSnapshot: 20000 },
      ]),
    );
    expect(view.barberName).toBe(user.name);
  });
});

describe("getCustomerPhotos", () => {
  it("returns newest first with barberName", async () => {
    const { user, barber } = await createBarber({ name: "Mehmet Usta" });
    const c = await createCustomer();
    const older = await prisma.haircutPhoto.create({
      data: { customerId: c.id, barberId: barber.id, storageKey: "photos/older.jpg", createdAt: new Date("2026-09-10T10:00:00Z") },
    });
    const newer = await prisma.haircutPhoto.create({
      data: { customerId: c.id, barberId: barber.id, storageKey: "photos/newer.jpg", createdAt: new Date("2026-09-15T10:00:00Z") },
    });

    const photos = await getCustomerPhotos(c.id);

    expect(photos.map((p) => p.id)).toEqual([newer.id, older.id]);
    expect(photos.every((p) => p.barberName === user.name)).toBe(true);
  });
});
