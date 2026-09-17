import { describe, it, expect } from "vitest";
import { prisma } from "@/lib/db";
import { createBarber, createCustomer, createService } from "./helpers";
import { getTodayAvailability } from "@/lib/queries/booking";
import { createAppointment } from "@/actions/appointments";

// Perşembe 2026-09-17 10:00 Istanbul = 07:00Z
const NOW = new Date("2026-09-17T07:00:00Z");
const SUNDAY_NOW = new Date("2026-09-20T07:00:00Z");

describe("getTodayAvailability", () => {
  it("lists slots after now+lead within working hours", async () => {
    const { barber } = await createBarber();
    const r = await getTodayAvailability(barber.id, 30, NOW);
    expect(r.isOpenToday).toBe(true);
    // 10:00 + 15dk lead = 10:15 → ilk slot 10:15 (15dk adım)
    expect(r.slots[0].toISOString()).toBe("2026-09-17T07:15:00.000Z");
    // son slot 18:30 (19:00 kapanış, 30dk hizmet)
    expect(r.slots.at(-1)!.toISOString()).toBe("2026-09-17T15:30:00.000Z");
  });

  it("is closed on Sunday", async () => {
    const { barber } = await createBarber();
    const r = await getTodayAvailability(barber.id, 30, SUNDAY_NOW);
    expect(r.isOpenToday).toBe(false);
    expect(r.slots).toEqual([]);
    expect(r.opensAt).toBe("09:00"); // yarın (Pazartesi) açılış
  });

  it("excludes existing appointments and time off", async () => {
    const { barber } = await createBarber();
    const customer = await createCustomer();
    await prisma.appointment.create({
      data: { barberId: barber.id, customerId: customer.id, startsAt: new Date("2026-09-17T08:00:00Z"), endsAt: new Date("2026-09-17T08:30:00Z") },
    });
    await prisma.timeOff.create({
      data: { barberId: barber.id, startsAt: new Date("2026-09-17T09:00:00Z"), endsAt: new Date("2026-09-17T10:00:00Z") },
    });
    const r = await getTodayAvailability(barber.id, 30, NOW);
    const iso = r.slots.map((d) => d.toISOString());
    expect(iso).not.toContain("2026-09-17T08:00:00.000Z");
    expect(iso).not.toContain("2026-09-17T07:45:00.000Z"); // 07:45-08:15 çakışır
    expect(iso).not.toContain("2026-09-17T09:30:00.000Z");
    expect(iso).toContain("2026-09-17T08:30:00.000Z");
    expect(iso).toContain("2026-09-17T10:00:00.000Z");
  });
});

describe("createAppointment", () => {
  it("creates appointment with service snapshots", async () => {
    const { barber } = await createBarber();
    const customer = await createCustomer();
    const s1 = await createService({ name: "Saç", durationMinutes: 30, priceKurus: 40000 });
    const s2 = await createService({ name: "Sakal", durationMinutes: 15, priceKurus: 20000 });

    const r = await createAppointment(
      { barberId: barber.id, serviceIds: [s1.id, s2.id], startsAt: "2026-09-17T08:00:00.000Z" },
      { now: NOW, customerId: customer.id },
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const appt = await prisma.appointment.findUnique({ where: { id: r.data.id }, include: { services: true } });
    expect(appt?.endsAt.toISOString()).toBe("2026-09-17T08:45:00.000Z");
    expect(appt?.services.map((s) => s.priceSnapshot).sort()).toEqual([20000, 40000]);
    expect(appt?.services.find((s) => s.serviceId === s1.id)?.nameSnapshot).toBe("Saç");
  });

  it("rejects slot in the past / before lead time", async () => {
    const { barber } = await createBarber();
    const customer = await createCustomer();
    const s1 = await createService();
    const r = await createAppointment(
      { barberId: barber.id, serviceIds: [s1.id], startsAt: "2026-09-17T07:00:00.000Z" },
      { now: NOW, customerId: customer.id },
    );
    expect(r).toEqual({ ok: false, error: "Bu saat artık uygun değil, lütfen başka bir saat seçin" });
  });

  it("rejects conflicting slot (second booking of same time)", async () => {
    const { barber } = await createBarber();
    const c1 = await createCustomer();
    const c2 = await createCustomer();
    const s1 = await createService();
    const input = { barberId: barber.id, serviceIds: [s1.id], startsAt: "2026-09-17T08:00:00.000Z" };
    const first = await createAppointment(input, { now: NOW, customerId: c1.id });
    expect(first.ok).toBe(true);
    const second = await createAppointment(input, { now: NOW, customerId: c2.id });
    expect(second.ok).toBe(false);
  });

  it("rejects when slot not aligned to step", async () => {
    const { barber } = await createBarber();
    const customer = await createCustomer();
    const s1 = await createService();
    const r = await createAppointment(
      { barberId: barber.id, serviceIds: [s1.id], startsAt: "2026-09-17T08:07:00.000Z" },
      { now: NOW, customerId: customer.id },
    );
    expect(r.ok).toBe(false);
  });

  it("rejects inactive service", async () => {
    const { barber } = await createBarber();
    const customer = await createCustomer();
    const s1 = await prisma.service.create({ data: { name: "Eski", durationMinutes: 30, priceKurus: 100, isActive: false } });
    const r = await createAppointment(
      { barberId: barber.id, serviceIds: [s1.id], startsAt: "2026-09-17T08:00:00.000Z" },
      { now: NOW, customerId: customer.id },
    );
    expect(r).toEqual({ ok: false, error: "Seçilen hizmet bulunamadı" });
  });
});
