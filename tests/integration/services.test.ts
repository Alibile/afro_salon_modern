import { describe, it, expect } from "vitest";
import { prisma } from "@/lib/db";
import { upsertService, toggleService } from "@/actions/services";
import type { SessionUser } from "@/lib/auth-helpers";

const admin: SessionUser = { id: "a", name: "Admin", email: "a@t", role: "ADMIN", barberId: null };
const barber: SessionUser = { id: "b", name: "B", email: "b@t", role: "BARBER", barberId: "x" };

describe("services actions", () => {
  it("admin creates with kurus conversion", async () => {
    const r = await upsertService({ name: "Saç", durationMinutes: 30, priceLira: 400.5, sortOrder: 1 }, { actor: admin });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const s = await prisma.service.findUnique({ where: { id: r.data.id } });
    expect(s?.priceKurus).toBe(40050);
  });
  it("admin updates existing", async () => {
    const c = await upsertService({ name: "Saç", durationMinutes: 30, priceLira: 400, sortOrder: 1 }, { actor: admin });
    if (!c.ok) throw new Error();
    const u = await upsertService({ id: c.data.id, name: "Saç Kesimi", durationMinutes: 45, priceLira: 450, sortOrder: 1 }, { actor: admin });
    expect(u.ok).toBe(true);
    expect((await prisma.service.findUnique({ where: { id: c.data.id } }))?.name).toBe("Saç Kesimi");
  });
  it("barber is refused", async () => {
    const r = await upsertService({ name: "Saç", durationMinutes: 30, priceLira: 400, sortOrder: 1 }, { actor: barber });
    expect(r).toEqual({ ok: false, error: "Yetkiniz yok" });
  });
  it("toggle deactivates", async () => {
    const c = await upsertService({ name: "Saç", durationMinutes: 30, priceLira: 400, sortOrder: 1 }, { actor: admin });
    if (!c.ok) throw new Error();
    await toggleService(c.data.id, false, { actor: admin });
    expect((await prisma.service.findUnique({ where: { id: c.data.id } }))?.isActive).toBe(false);
  });
  it("upsert non-existent returns not found", async () => {
    const r = await upsertService({ id: "yok", name: "Saç", durationMinutes: 30, priceLira: 400, sortOrder: 1 }, { actor: admin });
    expect(r).toEqual({ ok: false, error: "Hizmet bulunamadı" });
  });
  it("toggle non-existent returns not found", async () => {
    const r = await toggleService("yok", false, { actor: admin });
    expect(r).toEqual({ ok: false, error: "Hizmet bulunamadı" });
  });
});
