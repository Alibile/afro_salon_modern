import { describe, it, expect } from "vitest";
import { prisma } from "@/lib/db";
import { upsertTestimonialAs, toggleTestimonialAs, deleteTestimonialAs } from "@/actions/impl/testimonials";
import type { SessionUser } from "@/lib/auth-helpers";

const admin: SessionUser = { id: "a", name: "Admin", email: "a@t", role: "ADMIN", barberId: null };
const barber: SessionUser = { id: "b", name: "B", email: "b@t", role: "BARBER", barberId: "x" };

const sample = { name: "Emre K.", text: "Harika bir deneyimdi, kesinlikle tavsiye ederim.", rating: 5, sortOrder: 1 };

describe("testimonials actions", () => {
  it("admin creates a testimonial", async () => {
    const r = await upsertTestimonialAs(admin, sample);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const t = await prisma.testimonial.findUnique({ where: { id: r.data.id } });
    expect(t?.name).toBe("Emre K.");
    expect(t?.rating).toBe(5);
    expect(t?.isActive).toBe(true);
  });

  it("admin updates existing", async () => {
    const c = await upsertTestimonialAs(admin, sample);
    if (!c.ok) throw new Error();
    const u = await upsertTestimonialAs(admin, { id: c.data.id, name: "Emre Kaya", text: "Güncellenmiş yorum metni burada yer alıyor.", rating: 4, sortOrder: 2 });
    expect(u.ok).toBe(true);
    const t = await prisma.testimonial.findUnique({ where: { id: c.data.id } });
    expect(t?.name).toBe("Emre Kaya");
    expect(t?.rating).toBe(4);
  });

  it("barber is refused on upsert", async () => {
    const r = await upsertTestimonialAs(barber, sample);
    expect(r).toEqual({ ok: false, error: "Yetkiniz yok" });
  });

  it("rejects invalid rating", async () => {
    const r = await upsertTestimonialAs(admin, { ...sample, rating: 6 });
    expect(r.ok).toBe(false);
  });

  it("toggle deactivates", async () => {
    const c = await upsertTestimonialAs(admin, sample);
    if (!c.ok) throw new Error();
    await toggleTestimonialAs(admin, c.data.id, false);
    expect((await prisma.testimonial.findUnique({ where: { id: c.data.id } }))?.isActive).toBe(false);
  });

  it("toggle refused for barber", async () => {
    const c = await upsertTestimonialAs(admin, sample);
    if (!c.ok) throw new Error();
    const r = await toggleTestimonialAs(barber, c.data.id, false);
    expect(r).toEqual({ ok: false, error: "Yetkiniz yok" });
  });

  it("delete removes the row, count 0", async () => {
    const c = await upsertTestimonialAs(admin, sample);
    if (!c.ok) throw new Error();
    const r = await deleteTestimonialAs(admin, c.data.id);
    expect(r.ok).toBe(true);
    expect(await prisma.testimonial.count()).toBe(0);
  });

  it("delete refused for barber", async () => {
    const c = await upsertTestimonialAs(admin, sample);
    if (!c.ok) throw new Error();
    const r = await deleteTestimonialAs(barber, c.data.id);
    expect(r).toEqual({ ok: false, error: "Yetkiniz yok" });
  });

  it("upsert non-existent returns not found", async () => {
    const r = await upsertTestimonialAs(admin, { id: "yok", ...sample });
    expect(r).toEqual({ ok: false, error: "Yorum bulunamadı" });
  });

  it("toggle non-existent returns not found", async () => {
    const r = await toggleTestimonialAs(admin, "yok", false);
    expect(r).toEqual({ ok: false, error: "Yorum bulunamadı" });
  });

  it("delete non-existent returns not found", async () => {
    const r = await deleteTestimonialAs(admin, "yok");
    expect(r).toEqual({ ok: false, error: "Yorum bulunamadı" });
  });
});
