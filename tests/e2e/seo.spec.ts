import { test, expect } from "@playwright/test";

/**
 * Üç dilli sitenin arama motorlarına bakan yüzü: hreflang bağlantıları, site
 * haritası, `robots.txt` ve oturum ardındaki sayfaların `noindex` etiketi.
 *
 * Adresler `.env.test` içindeki `NEXT_PUBLIC_SITE_URL` (http://localhost:3100)
 * üzerinden mutlaklaşır; testler konağı da birlikte doğrular, çünkü göreli
 * kalmış bir hreflang bağlantısı geçersizdir.
 */
const BASE = "http://localhost:3100";

test.describe("hreflang bağlantıları", () => {
  test("İngilizce sayfa öbür iki dile ve x-default'a bağlanır", async ({ page }) => {
    await page.goto("/en");
    // Kök adres `metadataBase` ile birleşince sondaki çizgisiz kalır: aynı sayfa.
    await expect(page.locator('link[rel="alternate"][hreflang="tr"]')).toHaveAttribute("href", BASE);
    await expect(page.locator('link[rel="alternate"][hreflang="fr"]')).toHaveAttribute("href", `${BASE}/fr`);
    await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute("href", `${BASE}/en`);
    // Dili eşleşmeyen ziyaretçi salonun kendi diline düşer: Türkçe, öneksiz.
    await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveAttribute("href", BASE);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `${BASE}/en`);
  });

  test("Türkçe ana sayfa öneksiz canonical taşır", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", BASE);
    await expect(page.locator('link[rel="alternate"][hreflang="fr"]')).toHaveAttribute("href", `${BASE}/fr`);
  });

  // Alt sayfanın dil bağlantıları ana sayfayı değil kendi çevirilerini gösterir.
  test("randevu sayfası kendi dil bağlantılarını taşır", async ({ page }) => {
    await page.goto("/fr/randevu");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `${BASE}/fr/randevu`);
    await expect(page.locator('link[rel="alternate"][hreflang="tr"]')).toHaveAttribute("href", `${BASE}/randevu`);
    await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute("href", `${BASE}/en/randevu`);
    await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveAttribute("href", `${BASE}/randevu`);
  });
});

test.describe("sitemap.xml ve robots.txt", () => {
  /**
   * İkisi de `[locale]` ağacının dışında duruyor (bkz. `src/app/sitemap.ts`).
   * Dil segmentinin altına düşselerdi 404 verirlerdi; bu yüzden sınanan şey
   * yalnızca içerik değil, servis edildikleri.
   */
  test("site haritası üç dilin sayfalarını listeler", async ({ request }) => {
    const response = await request.get("/sitemap.xml");
    expect(response.status()).toBe(200);
    const xml = await response.text();
    for (const url of [`${BASE}/`, `${BASE}/en`, `${BASE}/fr`, `${BASE}/randevu`, `${BASE}/en/randevu`, `${BASE}/fr/randevu`]) {
      expect(xml).toContain(`<loc>${url}</loc>`);
    }
    expect(xml).toContain("/fr/randevu");
    // Oturum ardındaki sayfalar site haritasına girmez.
    expect(xml).not.toContain("/panel");
    expect(xml).not.toContain("/randevularim");
  });

  test("robots.txt paneli kapatır ve site haritasını gösterir", async ({ request }) => {
    const response = await request.get("/robots.txt");
    expect(response.status()).toBe(200);
    const text = await response.text();
    expect(text).toContain("Disallow: /panel");
    expect(text).toContain("Disallow: /en/panel");
    expect(text).toContain("Disallow: /randevularim");
    expect(text).toContain("Disallow: /giris");
    expect(text).toContain("Disallow: /kayit");
    expect(text).toContain("Disallow: /api");
    expect(text).toContain(`Sitemap: ${BASE}/sitemap.xml`);
  });
});

test.describe("noindex", () => {
  test("giriş sayfası dizine girmez", async ({ page }) => {
    await page.goto("/giris");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex");
  });

  test("İngilizce kayıt sayfası da dizine girmez", async ({ page }) => {
    await page.goto("/en/kayit");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex");
  });

  // Asıl risk ters yönde: etiket herkese açık sayfalara sızarsa site aramadan düşer.
  test("herkese açık sayfalarda noindex yoktur", async ({ page }) => {
    // Öneksiz yollar önce: `NEXT_LOCALE` çerezi bir kez EN/FR'ye yazıldıktan
    // sonra `/randevu` o dile yönlenir ve test adresi kaybederdi.
    for (const path of ["/", "/randevu", "/en", "/en/randevu", "/fr", "/fr/randevu"]) {
      await page.goto(path);
      await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
    }
  });
});

test.describe("sayfa başlıkları", () => {
  test("ana sayfa ve randevu sayfası kendi başlığını taşır", async ({ page }) => {
    // Öneksiz Türkçe yol önce okunur: dil çerezi EN/FR'ye yazıldıktan sonra
    // `/randevu` o dile yönlenirdi.
    await page.goto("/randevu");
    await expect(page).toHaveTitle("Randevu al — Afro Salon Modern");
    await page.goto("/en");
    await expect(page).toHaveTitle("Afro Salon Modern — Afro barbering, booked the same day");
    await page.goto("/fr/randevu");
    await expect(page).toHaveTitle("Prendre rendez-vous — Afro Salon Modern");
  });
});
