import { describe, it, expect, vi } from "vitest";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db";
import { createBarber, createCustomer } from "./helpers";
import type { SessionUser } from "@/lib/auth-helpers";

vi.mock("@/lib/storage", () => ({
  deleteObject: vi.fn(async () => {}),
  createPresignedUpload: vi.fn(),
}));

import { deleteObject } from "@/lib/storage";
import { addHaircutPhotoAs, deleteHaircutPhotoAs } from "@/actions/impl/photos";

const asBarber = (u: { id: string; name: string; email: string }, barberId: string): SessionUser => ({ ...u, role: "BARBER", barberId });

/** Presign ucunun ürettiği biçimde geçerli bir R2 anahtarı (haircuts/<uuid>.jpg) */
const keys = new Map<string, string>();
function key(label: string) {
  const existing = keys.get(label);
  if (existing) return existing;
  const created = `haircuts/${randomUUID()}.jpg`;
  keys.set(label, created);
  return created;
}

describe("haircut photos", () => {
  it("keeps only the 4 newest, deleting oldest from db and storage", async () => {
    const { user, barber } = await createBarber();
    const c = await createCustomer();
    const actor = asBarber(user, barber.id);
    for (let i = 1; i <= 5; i++) {
      const r = await addHaircutPhotoAs(actor, { customerId: c.id, storageKey: key(`p${i}`) });
      expect(r.ok).toBe(true);
      if (r.ok && i === 5) expect(r.data.deletedKeys).toEqual([key("p1")]);
    }
    const rows = await prisma.haircutPhoto.findMany({ where: { customerId: c.id }, orderBy: { createdAt: "asc" } });
    expect(rows.map((p) => p.storageKey)).toEqual([key("p2"), key("p3"), key("p4"), key("p5")]);
    expect(deleteObject).toHaveBeenCalledWith(key("p1"));
  });

  it("barber cannot delete another barber's photo", async () => {
    const b1 = await createBarber();
    const b2 = await createBarber();
    const c = await createCustomer();
    const r = await addHaircutPhotoAs(asBarber(b1.user, b1.barber.id), { customerId: c.id, storageKey: key("x") });
    if (!r.ok) throw new Error();
    expect((await deleteHaircutPhotoAs(asBarber(b2.user, b2.barber.id), r.data.id)).ok).toBe(false);
    expect((await deleteHaircutPhotoAs(asBarber(b1.user, b1.barber.id), r.data.id)).ok).toBe(true);
  });

  it("rejects unknown customer", async () => {
    const { user, barber } = await createBarber();
    const r = await addHaircutPhotoAs(asBarber(user, barber.id), { customerId: "yok", storageKey: key("x") });
    expect(r).toEqual({ ok: false, error: "Müşteri bulunamadı" });
  });

  it("keeps the cap under concurrent adds", async () => {
    const { user, barber } = await createBarber();
    const c = await createCustomer();
    const actor = asBarber(user, barber.id);
    for (let i = 1; i <= 3; i++) await addHaircutPhotoAs(actor, { customerId: c.id, storageKey: key(`base${i}`) });
    const results = await Promise.all([1, 2, 3].map((i) => addHaircutPhotoAs(actor, { customerId: c.id, storageKey: key(`race${i}`) })));
    expect(results.every((r) => r.ok)).toBe(true);
    const count = await prisma.haircutPhoto.count({ where: { customerId: c.id } });
    expect(count).toBe(4);
    const deleted = results.flatMap((r) => (r.ok ? r.data.deletedKeys : []));
    expect(deleted).toHaveLength(2);
  });
  it("rejects a storage key outside the haircuts prefix", async () => {
    const { user, barber } = await createBarber();
    const c = await createCustomer();
    const r = await addHaircutPhotoAs(asBarber(user, barber.id), { customerId: c.id, storageKey: `barbers/${randomUUID()}.jpg` });
    expect(r).toEqual({ ok: false, error: "Geçersiz fotoğraf anahtarı" });
  });

  it("rejects an appointment belonging to another customer", async () => {
    const { user, barber } = await createBarber();
    const c1 = await createCustomer();
    const c2 = await createCustomer();
    const appointment = await prisma.appointment.create({
      data: { customerId: c2.id, barberId: barber.id, startsAt: new Date("2026-09-17T08:00:00Z"), endsAt: new Date("2026-09-17T08:30:00Z") },
    });
    const r = await addHaircutPhotoAs(asBarber(user, barber.id), {
      customerId: c1.id,
      storageKey: `haircuts/${randomUUID()}.jpg`,
      appointmentId: appointment.id,
    });
    expect(r).toEqual({ ok: false, error: "Randevu bulunamadı" });
    expect(await prisma.haircutPhoto.count({ where: { customerId: c1.id } })).toBe(0);
  });
});
