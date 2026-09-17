import { describe, it, expect, vi } from "vitest";
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

describe("haircut photos", () => {
  it("keeps only the 4 newest, deleting oldest from db and storage", async () => {
    const { user, barber } = await createBarber();
    const c = await createCustomer();
    const actor = asBarber(user, barber.id);
    for (let i = 1; i <= 5; i++) {
      const r = await addHaircutPhotoAs(actor, { customerId: c.id, storageKey: `haircuts/p${i}.jpg` });
      expect(r.ok).toBe(true);
      if (r.ok && i === 5) expect(r.data.deletedKeys).toEqual(["haircuts/p1.jpg"]);
    }
    const rows = await prisma.haircutPhoto.findMany({ where: { customerId: c.id }, orderBy: { createdAt: "asc" } });
    expect(rows.map((p) => p.storageKey)).toEqual(["haircuts/p2.jpg", "haircuts/p3.jpg", "haircuts/p4.jpg", "haircuts/p5.jpg"]);
    expect(deleteObject).toHaveBeenCalledWith("haircuts/p1.jpg");
  });

  it("barber cannot delete another barber's photo", async () => {
    const b1 = await createBarber();
    const b2 = await createBarber();
    const c = await createCustomer();
    const r = await addHaircutPhotoAs(asBarber(b1.user, b1.barber.id), { customerId: c.id, storageKey: "haircuts/x.jpg" });
    if (!r.ok) throw new Error();
    expect((await deleteHaircutPhotoAs(asBarber(b2.user, b2.barber.id), r.data.id)).ok).toBe(false);
    expect((await deleteHaircutPhotoAs(asBarber(b1.user, b1.barber.id), r.data.id)).ok).toBe(true);
  });

  it("rejects unknown customer", async () => {
    const { user, barber } = await createBarber();
    const r = await addHaircutPhotoAs(asBarber(user, barber.id), { customerId: "yok", storageKey: "haircuts/x.jpg" });
    expect(r).toEqual({ ok: false, error: "Müşteri bulunamadı" });
  });

  it("keeps the cap under concurrent adds", async () => {
    const { user, barber } = await createBarber();
    const c = await createCustomer();
    const actor = asBarber(user, barber.id);
    for (let i = 1; i <= 3; i++) await addHaircutPhotoAs(actor, { customerId: c.id, storageKey: `haircuts/base${i}.jpg` });
    const results = await Promise.all([1, 2, 3].map((i) => addHaircutPhotoAs(actor, { customerId: c.id, storageKey: `haircuts/race${i}.jpg` })));
    expect(results.every((r) => r.ok)).toBe(true);
    const count = await prisma.haircutPhoto.count({ where: { customerId: c.id } });
    expect(count).toBe(4);
    const deleted = results.flatMap((r) => (r.ok ? r.data.deletedKeys : []));
    expect(deleted).toHaveLength(2);
  });
});
