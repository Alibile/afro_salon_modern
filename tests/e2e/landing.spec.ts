import { test, expect } from "@playwright/test";

/**
 * Ana sayfanın Tur 6'da eklenen parçaları: paket düzeni, "Nasıl çalışır",
 * SSS, tıkla-yükle harita, hero'daki uygun saat sayacı ve marka dosyaları.
 *
 * Tarayıcı profili Pixel 7 (bkz. `playwright.config.ts`): bölüm bağlantıları
 * mobil menünün içindedir, masaüstü çubuğunda değil.
 */

test.describe("paket bölümü", () => {
  test("tek hizmet varken fiyat, süre ve dahil olanlar görünür", async ({ page }) => {
    await page.goto("/");
    const services = page.locator("#hizmetler");
    await expect(services.getByRole("heading", { name: "Yıkama + Kesim + Sakal" })).toBeVisible();
    await expect(services.getByText("700,00 ₺", { exact: true })).toBeVisible();
    await expect(services.getByText("45 dakika", { exact: true })).toBeVisible();
    await expect(services.getByText("Saç yıkama", { exact: true })).toBeVisible();
    await expect(services.getByText("Kesim ve şekillendirme")).toBeVisible();
    await expect(services.getByText("Sakal tıraşı ve düzeltme")).toBeVisible();
    await expect(services.getByRole("link", { name: "Bugün randevu al" })).toHaveAttribute("href", "/randevu");
  });

  test("İngilizce paket kendi dilinde basılır", async ({ page }) => {
    await page.goto("/en");
    const services = page.locator("#hizmetler");
    await expect(services.getByRole("heading", { name: "Wash, cut & beard" })).toBeVisible();
    await expect(services.getByText("Included in the price")).toBeVisible();
    await expect(services.getByText("₺700.00", { exact: true })).toBeVisible();
  });
});

test.describe("nasıl çalışır", () => {
  test("üç numaralı adım sırayla durur", async ({ page }) => {
    await page.goto("/#nasil");
    const steps = page.locator("#nasil ol > li");
    await expect(steps).toHaveCount(3);
    await expect(steps.nth(0)).toContainText("Berberini seç");
    await expect(steps.nth(1)).toContainText("Bugünkü saatini seç");
    await expect(steps.nth(2)).toContainText("Gel, otur");
    // İptal penceresi ayarlardan gelir; metne gömülü sabit bir sayı değil.
    await expect(page.locator("#nasil")).toContainText(/\d+ dakika kala iptal edebilirsin/);
  });
});

test.describe("SSS", () => {
  test("soruya tıklayınca cevap açılır", async ({ page }) => {
    await page.goto("/#sss");
    const first = page.locator("#sss details").first();
    const answer = first.locator("p");
    await expect(answer).toBeHidden();
    await first.getByText("Randevu nasıl alınır?").click();
    await expect(answer).toBeVisible();
    await expect(answer).toContainText("Randevu yalnızca bugün için açılır");
  });

  test("altı soru var ve İngilizcesi de açılır", async ({ page }) => {
    await page.goto("/en#sss");
    const items = page.locator("#sss details");
    await expect(items).toHaveCount(6);
    await items.first().getByText("How do I book?").click();
    await expect(items.first().locator("p")).toBeVisible();
  });
});

test.describe("harita", () => {
  test("iframe ancak düğmeye basılınca gelir", async ({ page }) => {
    await page.goto("/#iletisim");
    const map = page.locator("#iletisim iframe");
    await expect(map).toHaveCount(0);
    // Düğme `.label` sınıfıyla büyük harfe çevriliyor ve erişilebilir ad da
    // öyle hesaplanıyor: "HARİTAYI YÜKLE". Playwright'ın ada göre eşleşmesi
    // büyük/küçük harf duyarsızdır ama Türkçe'de "İ"nin küçüğü "i̇"dir, "ı"
    // değil — ada göre aramak bu tek kelimede tutmaz. Düğme yapıyla bulunur.
    await page.locator('#iletisim button[type="button"]').click();
    await expect(map).toHaveAttribute("src", /google\.com\/maps/);
  });
});

test.describe("hero sayacı", () => {
  test("bugünün uygun saat sayısı durum satırının yanında", async ({ page }) => {
    await page.goto("/");
    // E2E veritabanında berberler gün boyu açık: ya sayı ya "doluyuz" satırı.
    await expect(page.locator("h1").locator("xpath=preceding-sibling::p[1]")).toContainText(
      /\d+ boş randevu|Bugün doluyuz/,
    );
  });
});

test.describe("marka", () => {
  test("üst çubuk logosu ana sayfaya gider, menüde 'Ana Sayfa' maddesi yoktur", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: "Afro Salon Modern — Ana Sayfa" })).toHaveAttribute("href", "/");
    await page.getByRole("button", { name: "Menüyü aç" }).click();
    const menu = page.locator("#mobil-menu");
    await expect(menu.getByRole("link", { name: "Ana Sayfa", exact: true })).toHaveCount(0);
    await expect(menu.getByRole("link", { name: "Hizmet & Fiyat" })).toBeVisible();
  });

  test("ikon ve paylaşım görseli servis edilir", async ({ request }) => {
    const icon = await request.get("/icon.svg");
    expect(icon.status()).toBe(200);
    expect(icon.headers()["content-type"]).toContain("image/svg+xml");

    const apple = await request.get("/apple-icon");
    expect(apple.status()).toBe(200);
    expect(apple.headers()["content-type"]).toContain("image/png");

    for (const path of ["/opengraph-image", "/en/opengraph-image"]) {
      const og = await request.get(path);
      expect(og.status(), path).toBe(200);
      expect(og.headers()["content-type"], path).toContain("image/png");
    }
  });
});
