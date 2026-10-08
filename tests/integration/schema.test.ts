import { describe, it, expect } from "vitest";
import { prisma } from "@/lib/db";
import { createBarber, createCustomer } from "./helpers";

describe("appointment_no_overlap constraint", () => {
  it("rejects overlapping SCHEDULED appointments for same barber", async () => {
    const { barber } = await createBarber();
    const customer = await createCustomer();
    const startsAt = new Date("2026-09-17T07:00:00Z");
    const endsAt = new Date("2026-09-17T07:30:00Z");
    await prisma.appointment.create({ data: { barberId: barber.id, customerId: customer.id, startsAt, endsAt } });

    await expect(
      prisma.appointment.create({
        data: {
          barberId: barber.id,
          customerId: customer.id,
          startsAt: new Date("2026-09-17T07:15:00Z"),
          endsAt: new Date("2026-09-17T07:45:00Z"),
        },
      }),
    ).rejects.toThrow(/appointment_no_overlap/);
  });

  it("allows overlap when first one is CANCELLED", async () => {
    const { barber } = await createBarber();
    const customer = await createCustomer();
    await prisma.appointment.create({
      data: {
        barberId: barber.id,
        customerId: customer.id,
        startsAt: new Date("2026-09-17T07:00:00Z"),
        endsAt: new Date("2026-09-17T07:30:00Z"),
        status: "CANCELLED",
      },
    });
    const second = await prisma.appointment.create({
      data: {
        barberId: barber.id,
        customerId: customer.id,
        startsAt: new Date("2026-09-17T07:00:00Z"),
        endsAt: new Date("2026-09-17T07:30:00Z"),
      },
    });
    expect(second.id).toBeTruthy();
  });

  it("allows back-to-back appointments", async () => {
    const { barber } = await createBarber();
    const customer = await createCustomer();
    await prisma.appointment.create({
      data: { barberId: barber.id, customerId: customer.id, startsAt: new Date("2026-09-17T07:00:00Z"), endsAt: new Date("2026-09-17T07:30:00Z") },
    });
    const second = await prisma.appointment.create({
      data: { barberId: barber.id, customerId: customer.id, startsAt: new Date("2026-09-17T07:30:00Z"), endsAt: new Date("2026-09-17T08:00:00Z") },
    });
    expect(second.id).toBeTruthy();
  });

  it("içerik tabloları: ContentBlock anahtarla, SiteImage yuvayla tekil; FaqItem sıralı", async () => {
    await prisma.contentBlock.create({ data: { key: "hero.headline1", textI18n: { tr: "Deneme" } } });
    await expect(prisma.contentBlock.create({ data: { key: "hero.headline1", textI18n: { tr: "İkinci" } } })).rejects.toThrow();
    await prisma.siteImage.create({ data: { slot: "hero", storageKey: "site/x.jpg", width: 2000, height: 1333 } });
    await expect(prisma.siteImage.create({ data: { slot: "hero", storageKey: "site/y.jpg", width: 2000, height: 1333 } })).rejects.toThrow();
    const f = await prisma.faqItem.create({ data: { questionI18n: { tr: "Soru?" }, answerI18n: { tr: "Cevap, on karakter." } } });
    expect(f.sortOrder).toBe(0);
    expect(f.isActive).toBe(true);
  });
});
