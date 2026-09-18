import { describe, it, expect, vi, beforeEach } from "vitest";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db";
import type { SessionUser } from "@/lib/auth-helpers";

vi.mock("@/lib/storage", () => ({
  deleteObject: vi.fn(async () => {}),
  createPresignedUpload: vi.fn(),
}));

import { deleteObject } from "@/lib/storage";
import {
  addGalleryPhotosAs,
  updateGalleryPhotoAs,
  deleteGalleryPhotoAs,
  moveGalleryPhotoAs,
} from "@/actions/impl/gallery";
import { getGalleryData } from "@/lib/queries/gallery";

const admin: SessionUser = { id: "a", name: "Admin", email: "a@t", role: "ADMIN", barberId: null };
const barber: SessionUser = { id: "b", name: "B", email: "b@t", role: "BARBER", barberId: "x" };
const customer: SessionUser = { id: "c", name: "C", email: "c@t", role: "CUSTOMER", barberId: null };

/** Presign ucunun ürettiği biçimde geçerli bir R2 anahtarı. */
const key = () => `gallery/${randomUUID()}.jpg`;
const item = (over: Partial<{ storageKey: string; width: number; height: number }> = {}) => ({
  storageKey: over.storageKey ?? key(),
  width: over.width ?? 1600,
  height: over.height ?? 1200,
});

async function addOne(over: Parameters<typeof item>[0] = {}) {
  const r = await addGalleryPhotosAs(admin, [item(over)]);
  if (!r.ok) throw new Error(`beklenmeyen hata: ${r.error}`);
  return r.data.ids[0];
}

beforeEach(() => {
  vi.mocked(deleteObject).mockClear();
});

describe("addGalleryPhotosAs", () => {
  it("admin birden çok fotoğrafı tek çağrıda ekler, sıra numaralarını artırarak verir", async () => {
    const items = [item(), item(), item()];
    const r = await addGalleryPhotosAs(admin, items);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.ids).toHaveLength(3);
    const rows = await prisma.galleryPhoto.findMany({ orderBy: { sortOrder: "asc" } });
    expect(rows.map((p) => p.storageKey)).toEqual(items.map((i) => i.storageKey));
    expect(rows.map((p) => p.sortOrder)).toEqual([0, 1, 2]);
    expect(rows.every((p) => p.isActive)).toBe(true);
    expect(rows[0].caption).toBe("");
    expect(rows[0].tags).toEqual([]);
    expect(rows[0].width).toBe(1600);
    expect(rows[0].height).toBe(1200);
  });

  it("yeni fotoğraflar mevcutların arkasına eklenir", async () => {
    await addGalleryPhotosAs(admin, [item(), item()]);
    const second = await addGalleryPhotosAs(admin, [item()]);
    expect(second.ok).toBe(true);
    const rows = await prisma.galleryPhoto.findMany({ orderBy: { sortOrder: "asc" } });
    expect(rows.map((p) => p.sortOrder)).toEqual([0, 1, 2]);
  });

  it("yalnızca presign ucunun ürettiği anahtar biçimini kabul eder", async () => {
    for (const bad of ["haircuts/a.jpg", "gallery/../x.jpg", "gallery/abc.jpg", "gallery/x.gif", "../secret.jpg"]) {
      const r = await addGalleryPhotosAs(admin, [item({ storageKey: bad })]);
      expect(r).toEqual({ ok: false, error: "Geçersiz fotoğraf anahtarı" });
    }
    expect(await prisma.galleryPhoto.count()).toBe(0);
  });

  it("seed'in kullandığı landing/ anahtarını kabul eder", async () => {
    const r = await addGalleryPhotosAs(admin, [item({ storageKey: "landing/gallery-3.jpg" })]);
    expect(r.ok).toBe(true);
  });

  it("boyutsuz ya da boş listeyi reddeder", async () => {
    expect((await addGalleryPhotosAs(admin, [])).ok).toBe(false);
    expect((await addGalleryPhotosAs(admin, [item({ width: 0 })])).ok).toBe(false);
    expect((await addGalleryPhotosAs(admin, [item({ height: -3 })])).ok).toBe(false);
  });

  it("aşırı uzun/geniş oranları reddeder, uç sınırları kabul eder", async () => {
    // Masonry oranı olduğu gibi kullanır: 100×5000 bir sütunu tek başına uzatırdı.
    expect(await addGalleryPhotosAs(admin, [item({ width: 100, height: 5000 })])).toEqual({
      ok: false,
      error: "Geçersiz görsel oranı",
    });
    expect(await addGalleryPhotosAs(admin, [item({ width: 5000, height: 100 })])).toEqual({
      ok: false,
      error: "Geçersiz görsel oranı",
    });
    expect((await addGalleryPhotosAs(admin, [item({ width: 400, height: 2000 })])).ok).toBe(true);
    expect((await addGalleryPhotosAs(admin, [item({ width: 2000, height: 400 })])).ok).toBe(true);
  });

  it("tek seferde 24'ten fazla fotoğraf kabul etmez", async () => {
    const many = Array.from({ length: 25 }, () => item());
    expect(await addGalleryPhotosAs(admin, many)).toEqual({
      ok: false,
      error: "Tek seferde en fazla 24 fotoğraf yüklenebilir",
    });
    expect(await prisma.galleryPhoto.count()).toBe(0);
  });

  it("aynı depo anahtarı iki kez eklenemez", async () => {
    const storageKey = key();
    expect((await addGalleryPhotosAs(admin, [item({ storageKey })])).ok).toBe(true);
    // Benzersiz indeks veritabanı düzeyinde: ikinci ekleme reddedilir.
    await expect(addGalleryPhotosAs(admin, [item({ storageKey })])).rejects.toThrow();
    expect(await prisma.galleryPhoto.count()).toBe(1);
  });

  it("berber ve müşteri reddedilir", async () => {
    expect(await addGalleryPhotosAs(barber, [item()])).toEqual({ ok: false, error: "Yetkiniz yok" });
    expect(await addGalleryPhotosAs(customer, [item()])).toEqual({ ok: false, error: "Yetkiniz yok" });
    expect(await addGalleryPhotosAs(null, [item()])).toEqual({ ok: false, error: "Yetkiniz yok" });
    expect(await prisma.galleryPhoto.count()).toBe(0);
  });
});

describe("updateGalleryPhotoAs", () => {
  it("başlık ve etiketleri kaydeder, etiketleri kırpıp tekilleştirir", async () => {
    const id = await addOne();
    const r = await updateGalleryPhotoAs(admin, id, { caption: "  Yüksek fade  ", tags: " Fade , fade ,  Line-up " });
    expect(r.ok).toBe(true);
    const p = await prisma.galleryPhoto.findUniqueOrThrow({ where: { id } });
    expect(p.caption).toBe("Yüksek fade");
    expect(p.tags).toEqual(["Fade", "Line-up"]);
  });

  it("etiket dizisini de kabul eder", async () => {
    const id = await addOne();
    await updateGalleryPhotoAs(admin, id, { tags: ["Afro", "Twist"] });
    expect((await prisma.galleryPhoto.findUniqueOrThrow({ where: { id } })).tags).toEqual(["Afro", "Twist"]);
  });

  it("6'dan fazla etiketi ve çok kısa/uzun etiketi reddeder", async () => {
    const id = await addOne();
    const many = await updateGalleryPhotoAs(admin, id, { tags: "a1,b2,c3,d4,e5,f6,g7" });
    expect(many).toEqual({ ok: false, error: "Etiketler 2–20 karakter, en fazla 6" });
    const short = await updateGalleryPhotoAs(admin, id, { tags: "F" });
    expect(short).toEqual({ ok: false, error: "Etiketler 2–20 karakter, en fazla 6" });
    const long = await updateGalleryPhotoAs(admin, id, { tags: "x".repeat(21) });
    expect(long).toEqual({ ok: false, error: "Etiketler 2–20 karakter, en fazla 6" });
    expect((await prisma.galleryPhoto.findUniqueOrThrow({ where: { id } })).tags).toEqual([]);
  });

  it("etiket alanı verilip de boş kalırsa reddeder", async () => {
    const id = await addOne();
    expect(await updateGalleryPhotoAs(admin, id, { tags: "  ,  " })).toEqual({ ok: false, error: "En az bir etiket girin" });
  });

  it("yalnızca isActive gönderildiğinde etiket ve başlığa dokunmaz", async () => {
    const id = await addOne();
    await updateGalleryPhotoAs(admin, id, { caption: "Twist", tags: "Twist" });
    const r = await updateGalleryPhotoAs(admin, id, { isActive: false });
    expect(r.ok).toBe(true);
    const p = await prisma.galleryPhoto.findUniqueOrThrow({ where: { id } });
    expect(p.isActive).toBe(false);
    expect(p.caption).toBe("Twist");
    expect(p.tags).toEqual(["Twist"]);
  });

  it("uzun başlığı reddeder", async () => {
    const id = await addOne();
    const r = await updateGalleryPhotoAs(admin, id, { caption: "x".repeat(121) });
    expect(r.ok).toBe(false);
  });

  it("olmayan fotoğrafta bulunamadı döner", async () => {
    expect(await updateGalleryPhotoAs(admin, "yok", { caption: "x" })).toEqual({ ok: false, error: "Fotoğraf bulunamadı" });
  });

  it("berber reddedilir", async () => {
    const id = await addOne();
    expect(await updateGalleryPhotoAs(barber, id, { caption: "x" })).toEqual({ ok: false, error: "Yetkiniz yok" });
  });
});

describe("moveGalleryPhotoAs", () => {
  async function order() {
    const rows = await prisma.galleryPhoto.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }] });
    return rows.map((r) => r.id);
  }

  it("fotoğrafı bir yukarı ve bir aşağı taşır", async () => {
    const a = await addOne();
    const b = await addOne();
    const c = await addOne();
    expect(await order()).toEqual([a, b, c]);

    expect((await moveGalleryPhotoAs(admin, c, "up")).ok).toBe(true);
    expect(await order()).toEqual([a, c, b]);

    expect((await moveGalleryPhotoAs(admin, a, "down")).ok).toBe(true);
    expect(await order()).toEqual([c, a, b]);
  });

  it("baştaki yukarı, sondaki aşağı taşınınca sıra değişmez", async () => {
    const a = await addOne();
    const b = await addOne();
    expect((await moveGalleryPhotoAs(admin, a, "up")).ok).toBe(true);
    expect((await moveGalleryPhotoAs(admin, b, "down")).ok).toBe(true);
    expect(await order()).toEqual([a, b]);
  });

  it("olmayan fotoğrafta bulunamadı döner", async () => {
    expect(await moveGalleryPhotoAs(admin, "yok", "up")).toEqual({ ok: false, error: "Fotoğraf bulunamadı" });
  });

  it("berber reddedilir", async () => {
    const id = await addOne();
    expect(await moveGalleryPhotoAs(barber, id, "up")).toEqual({ ok: false, error: "Yetkiniz yok" });
  });
});

describe("deleteGalleryPhotoAs", () => {
  it("satırı siler ve R2 nesnesini kaldırır", async () => {
    const storageKey = key();
    const id = await addOne({ storageKey });
    const r = await deleteGalleryPhotoAs(admin, id);
    expect(r.ok).toBe(true);
    expect(await prisma.galleryPhoto.count()).toBe(0);
    expect(deleteObject).toHaveBeenCalledWith(storageKey);
  });

  it("landing/ anahtarlı (depoya ait olmayan) fotoğrafı R2'den silmeye çalışmaz", async () => {
    const id = await addOne({ storageKey: "landing/gallery-5.jpg" });
    const r = await deleteGalleryPhotoAs(admin, id);
    expect(r.ok).toBe(true);
    expect(await prisma.galleryPhoto.count()).toBe(0);
    expect(deleteObject).not.toHaveBeenCalled();
  });

  it("olmayan fotoğrafta bulunamadı döner", async () => {
    expect(await deleteGalleryPhotoAs(admin, "yok")).toEqual({ ok: false, error: "Fotoğraf bulunamadı" });
  });

  it("berber reddedilir, satır durur", async () => {
    const id = await addOne();
    expect(await deleteGalleryPhotoAs(barber, id)).toEqual({ ok: false, error: "Yetkiniz yok" });
    expect(await prisma.galleryPhoto.count()).toBe(1);
    expect(deleteObject).not.toHaveBeenCalled();
  });
});

describe("getGalleryData", () => {
  it("yalnızca aktif fotoğrafları sırayla ve etiketleri tekil/sıralı döner", async () => {
    const a = await addOne();
    const b = await addOne();
    const c = await addOne();
    await updateGalleryPhotoAs(admin, a, { caption: "Fade", tags: "Fade, Sakal" });
    await updateGalleryPhotoAs(admin, b, { tags: "Afro, Fade" });
    await updateGalleryPhotoAs(admin, c, { tags: "Twist", isActive: false });

    const d = await getGalleryData();
    expect(d.photos.map((p) => p.id)).toEqual([a, b]);
    expect(d.photos[0].caption).toBe("Fade");
    expect(d.photos[0].width).toBe(1600);
    // "Afro" ve "Sakal" sabit listeden (liste sırasıyla), "Fade" serbest: sona gelir.
    expect(d.tags).toEqual(["Afro", "Sakal", "Fade"]);
  });

  it("etiketleri sabit kategori sırasına dizer, listede olmayanları sona alır", async () => {
    const a = await addOne();
    const b = await addOne();
    await updateGalleryPhotoAs(admin, a, { tags: "Sakal, Ombre" });
    await updateGalleryPhotoAs(admin, b, { tags: "Low Taper Fade, Afro" });

    const d = await getGalleryData();
    expect(d.tags).toEqual(["Low Taper Fade", "Afro", "Sakal", "Ombre"]);
  });

  it("galeri boşsa boş liste döner", async () => {
    const d = await getGalleryData();
    expect(d.photos).toEqual([]);
    expect(d.tags).toEqual([]);
  });

  it("kesim fotoğraflarını (HaircutPhoto) galeriye karıştırmaz", async () => {
    const { createBarber, createCustomer } = await import("./helpers");
    const { barber: b } = await createBarber();
    const c = await createCustomer();
    await prisma.haircutPhoto.create({ data: { customerId: c.id, barberId: b.id, storageKey: "haircuts/x.jpg" } });
    const d = await getGalleryData();
    expect(d.photos).toEqual([]);
  });
});
