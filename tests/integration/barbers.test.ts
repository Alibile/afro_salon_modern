import { describe, it, expect, vi } from "vitest";
import { prisma } from "@/lib/db";
import type { SessionUser } from "@/lib/auth-helpers";

vi.mock("@/lib/storage", () => ({
  deleteObject: vi.fn(async () => {}),
  createPresignedUpload: vi.fn(),
}));

import { createBarberAs, saveWorkingHoursAs, updateBarberAs } from "@/actions/impl/barbers";

const admin: SessionUser = { id: "a", name: "Admin", email: "a@t", role: "ADMIN", barberId: null, locale: "tr" };

describe("barbers actions", () => {
  it("creates user+barber with default hours (Sunday off)", async () => {
    const r = await createBarberAs(admin, { name: "Kwame Mensah", email: "K@t.co", password: "Sifre123!", photoKey: "barbers/a.jpg", bio: "" });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const b = await prisma.barber.findUnique({ where: { id: r.data.barberId }, include: { user: true, workingHours: true } });
    expect(b?.user.role).toBe("BARBER");
    expect(b?.user.email).toBe("k@t.co");
    expect(b?.workingHours).toHaveLength(7);
    expect(b?.workingHours.find((h) => h.dayOfWeek === 0)?.isOff).toBe(true);
  });

  it("saveWorkingHours replaces rows", async () => {
    const r = await createBarberAs(admin, { name: "Kwame Mensah", email: "k@t.co", password: "Sifre123!", photoKey: "barbers/a.jpg" });
    if (!r.ok) throw new Error();
    const days = [0, 1, 2, 3, 4, 5, 6].map((d) => ({ dayOfWeek: d, isOff: d === 0 || d === 1, startTime: "10:00", endTime: "20:00" }));
    const s = await saveWorkingHoursAs(admin, r.data.barberId, { days });
    expect(s.ok).toBe(true);
    const rows = await prisma.workingHours.findMany({ where: { barberId: r.data.barberId }, orderBy: { dayOfWeek: "asc" } });
    expect(rows).toHaveLength(7);
    expect(rows[1].isOff).toBe(true);
    expect(rows[2].startTime).toBe("10:00");
  });

  it("saveWorkingHours fails for unknown barber", async () => {
    const days = [0, 1, 2, 3, 4, 5, 6].map((d) => ({ dayOfWeek: d, isOff: d === 0, startTime: "09:00", endTime: "19:00" }));
    const s = await saveWorkingHoursAs(admin, "yok", { days });
    expect(s).toEqual({ ok: false, error: "errors.barberNotFound" });
  });

  it("updateBarber changes name and active flag", async () => {
    const r = await createBarberAs(admin, { name: "Kwame Mensah", email: "k@t.co", password: "Sifre123!", photoKey: "barbers/a.jpg" });
    if (!r.ok) throw new Error();
    await updateBarberAs(admin, r.data.barberId, { name: "Kwame M.", bio: "Fade", photoKey: "barbers/b.jpg", isActive: false });
    const b = await prisma.barber.findUnique({ where: { id: r.data.barberId }, include: { user: true } });
    expect(b?.user.name).toBe("Kwame M.");
    expect(b?.isActive).toBe(false);
    expect(b?.photoKey).toBe("barbers/b.jpg");
  });
});
