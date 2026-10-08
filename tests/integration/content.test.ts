import { describe, it, expect, vi } from "vitest";
import { prisma } from "@/lib/db";
import { createBarber } from "./helpers";
import { saveContentBlocksAs } from "@/actions/impl/content";
import { upsertFaqItemAs, toggleFaqItemAs, moveFaqItemAs, deleteFaqItemAs } from "@/actions/impl/faq";
import { setSiteImageAs, clearSiteImageAs } from "@/actions/impl/site-images";
import { getContentMap, getActiveFaq, getSiteImages } from "@/lib/queries/content";
import { peekSiteImages } from "@/lib/site-images-cache";
import { deleteObject } from "@/lib/storage";
import type { SessionUser } from "@/lib/auth-helpers";

vi.mock("@/lib/storage", () => ({ deleteObject: vi.fn(async () => undefined) }));

const admin: SessionUser = { id: "a1", name: "Admin", email: "a@t", role: "ADMIN", barberId: null, locale: "tr" };
const KEY = (n: string) => `site/${n}-1111-4222-8333-444455556666.jpg`;

describe("içerik blokları", () => {
  it("kaydeder, okur; boş değer satırı siler; bilinmeyen anahtar reddedilir", async () => {
    expect((await saveContentBlocksAs(admin, { "hero.headline1": { tr: "Yeni manşet", en: "New line" }, "faq.note": { tr: "" } })).ok).toBe(true);
    let map = await getContentMap();
    expect(map["hero.headline1"]).toEqual({ tr: "Yeni manşet", en: "New line" });
    expect(map["faq.note"]).toBeUndefined();
    expect((await saveContentBlocksAs(admin, { "hero.headline1": { tr: "", en: "", fr: "" } })).ok).toBe(true);
    map = await getContentMap();
    expect(map["hero.headline1"]).toBeUndefined();
    expect(await saveContentBlocksAs(admin, { "hero.scroll": { tr: "x" } })).toEqual({ ok: false, error: "errors.invalidInput" });
  });

  it("üst sınırı aşan metin reddedilir, berber yazamaz", async () => {
    expect((await saveContentBlocksAs(admin, { "hero.headline1": { tr: "x".repeat(41) } })).ok).toBe(false);
    const { user, barber } = await createBarber();
    expect(await saveContentBlocksAs({ ...user, role: "BARBER", barberId: barber.id, locale: "tr" }, { "hero.headline1": { tr: "a" } })).toEqual({ ok: false, error: "errors.notAllowed" });
  });
});

describe("SSS", () => {
  it("ekler, sıralar, pasife alır, siler; kısa soru ve cevap reddedilir", async () => {
    const a = await upsertFaqItemAs(admin, { question: { tr: "İlk soru?" }, answer: { tr: "İlk cevap, on karakter." }, sortOrder: 0 });
    const b = await upsertFaqItemAs(admin, { question: { tr: "İkinci soru?", en: "Second?" }, answer: { tr: "İkinci cevap, on karakter." }, sortOrder: 1 });
    expect(a.ok && b.ok).toBe(true);
    if (!a.ok || !b.ok) return;
    expect((await getActiveFaq("en")).map((f) => f.question)).toEqual(["İlk soru?", "Second?"]);
    expect((await moveFaqItemAs(admin, b.data.id, "up")).ok).toBe(true);
    expect((await getActiveFaq("tr")).map((f) => f.question)).toEqual(["İkinci soru?", "İlk soru?"]);
    expect((await toggleFaqItemAs(admin, a.data.id, false)).ok).toBe(true);
    expect((await getActiveFaq("tr")).map((f) => f.question)).toEqual(["İkinci soru?"]);
    expect((await upsertFaqItemAs(admin, { id: b.data.id, question: { tr: "İkinci soru (yeni)?" }, answer: { tr: "İkinci cevap, on karakter." }, sortOrder: 0 })).ok).toBe(true);
    expect((await getActiveFaq("tr"))[0].question).toBe("İkinci soru (yeni)?");
    expect((await deleteFaqItemAs(admin, a.data.id)).ok).toBe(true);
    expect(await prisma.faqItem.count()).toBe(1);
    expect(await upsertFaqItemAs(admin, { question: { tr: "A?" }, answer: { tr: "Yeterince uzun cevap." }, sortOrder: 0 })).toEqual({ ok: false, error: "errors.faqQuestionMin3" });
    expect(await upsertFaqItemAs(admin, { question: { tr: "Soru?" }, answer: { tr: "kısa" }, sortOrder: 0 })).toEqual({ ok: false, error: "errors.faqAnswerMin10" });
    expect(await deleteFaqItemAs(admin, "yok")).toEqual({ ok: false, error: "errors.faqNotFound" });
  });
});

describe("görsel yuvaları", () => {
  it("yazar, değiştirince eskisini depodan siler, temizler; boyut ve oran denetlenir", async () => {
    expect((await setSiteImageAs(admin, { slot: "hero", storageKey: KEY("aaaaaaaa"), width: 2400, height: 1600 })).ok).toBe(true);
    // Yazım süreç içi anlık görüntüyü unutturur; okuma yeniden hatırlar (ön yükleme için).
    expect(peekSiteImages()).toBeNull();
    expect((await getSiteImages()).hero).toMatchObject({ storageKey: KEY("aaaaaaaa"), width: 2400, height: 1600 });
    expect(peekSiteImages()?.hero?.storageKey).toBe(KEY("aaaaaaaa"));
    expect((await setSiteImageAs(admin, { slot: "hero", storageKey: KEY("bbbbbbbb"), width: 3000, height: 2000 })).ok).toBe(true);
    expect(vi.mocked(deleteObject)).toHaveBeenCalledWith(KEY("aaaaaaaa"));
    // Çok küçük ve yanlış oran reddedilir; `uploads/site/` (yerel disk) kabul edilir.
    expect(await setSiteImageAs(admin, { slot: "hero", storageKey: KEY("cccccccc"), width: 800, height: 533 })).toEqual({ ok: false, error: "errors.imageTooSmall" });
    expect(await setSiteImageAs(admin, { slot: "heroMobile", storageKey: KEY("dddddddd"), width: 2400, height: 1600 })).toEqual({ ok: false, error: "errors.invalidAspectRatio" });
    expect((await setSiteImageAs(admin, { slot: "about", storageKey: `uploads/${KEY("eeeeeeee")}`, width: 1200, height: 1500 })).ok).toBe(true);
    expect(await setSiteImageAs(admin, { slot: "logo" as never, storageKey: KEY("ffffffff"), width: 2400, height: 1600 })).toEqual({ ok: false, error: "errors.invalidImageSlot" });
    expect((await clearSiteImageAs(admin, "hero")).ok).toBe(true);
    expect(peekSiteImages()).toBeNull();
    expect(vi.mocked(deleteObject)).toHaveBeenCalledWith(KEY("bbbbbbbb"));
    const images = await getSiteImages();
    expect(images.hero).toBeNull();
    expect(images.about?.storageKey).toBe(`uploads/${KEY("eeeeeeee")}`);
    expect((await clearSiteImageAs(admin, "hero")).ok).toBe(true); // boş yuvayı temizlemek hata değil
  });
});
