import { describe, it, expect, beforeEach } from "vitest";
import { peekSiteImages, rememberSiteImages, forgetSiteImages } from "@/lib/site-images-cache";

/**
 * Hero ön yüklemesi ilk `await`ten önce duyurulmalı (aksi hâlde `<head>`e
 * girmiyor); yuvalar ise veritabanında. Süreç içi son görüntü bunu çözer:
 * sayfa önce anlık görüntüyle duyurur, sonra gerçek veriyi okur.
 */
describe("site-images-cache", () => {
  const images = { hero: { storageKey: "site/a.jpg", width: 2400, height: 1600 }, heroMobile: null, about: null };
  beforeEach(() => forgetSiteImages());

  it("başlangıçta boş; hatırlanan görüntü geri okunur; unutulunca yine boş", () => {
    expect(peekSiteImages()).toBeNull();
    rememberSiteImages(images);
    expect(peekSiteImages()).toEqual(images);
    forgetSiteImages();
    expect(peekSiteImages()).toBeNull();
  });
});
