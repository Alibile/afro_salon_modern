import { describe, it, expect } from "vitest";
import { prisma } from "@/lib/db";
import { createBarber, createCustomer, createService } from "./helpers";
import { getLandingData } from "@/lib/queries/landing";

const NOW = new Date("2026-09-17T07:00:00Z");

describe("getLandingData", () => {
  it("returns services, barbers, status and newest 8 gallery photos", async () => {
    const { barber } = await createBarber();
    const c = await createCustomer();
    await createService({ name: "Saç", sortOrder: 2 });
    await createService({ name: "Sakal", sortOrder: 1 });
    for (let i = 0; i < 10; i++) {
      await prisma.haircutPhoto.create({ data: { customerId: c.id, barberId: barber.id, storageKey: `haircuts/${i}.jpg`, createdAt: new Date(Date.UTC(2026, 8, 1 + i)) } });
    }
    const d = await getLandingData(NOW);
    expect(d.status.text).toBe("Bugün açık · 09:00–19:00");
    expect(d.services.map((s) => s.name)).toEqual(["Sakal", "Saç"]);
    expect(d.barbers).toHaveLength(1);
    expect(d.gallery).toHaveLength(8);
    expect(d.gallery[0].storageKey).toBe("haircuts/9.jpg");
    expect(d.weeklyHours).toHaveLength(7);
    expect(d.weeklyHours[0]).toEqual({ dayLabel: "Pazartesi", text: "09:00–19:00" });
    expect(d.weeklyHours[6]).toEqual({ dayLabel: "Pazar", text: "Kapalı" });
  });
});
