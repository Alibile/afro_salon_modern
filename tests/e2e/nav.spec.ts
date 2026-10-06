import { test, expect } from "@playwright/test";

/**
 * Tek üst çubuk (Tur 8): ana sayfa ve iç sayfalar aynı `SiteNav` bileşenini
 * kullanır. Profil Pixel 7, yani telefon; geniş ekran testleri ölçüyü kendisi
 * ayarlar.
 */
test.describe("iç sayfa üst çubuğu", () => {
  test("randevu sayfasında logo ve menü var, randevu düğmesi yok", async ({ page }) => {
    await page.goto("/randevu");
    const header = page.getByRole("banner");
    await expect(header.getByRole("link", { name: "Afro Salon Modern — Ana Sayfa" })).toHaveAttribute("href", "/");
    await expect(header.getByRole("button", { name: "Menüyü aç" })).toBeVisible();
    await expect(header.getByRole("link", { name: "Randevu al", exact: true })).toHaveCount(0);
  });

  test("randevularım sayfasında randevu düğmesi çubukta durur", async ({ page }) => {
    await page.goto("/giris");
    await page.fill("#email", "admin@afrosalon.local");
    await page.fill("#password", "Sifre123!");
    await page.getByRole("button", { name: "Giriş yap" }).click();
    await page.waitForURL(/\/(panel|$)/);
    await page.goto("/randevularim");
    const header = page.getByRole("banner");
    await expect(header.getByRole("link", { name: "Randevu al", exact: true })).toHaveAttribute("href", "/randevu");
    await expect(header.getByRole("link", { name: "Afro Salon Modern — Ana Sayfa" })).toBeVisible();
    // Çubuk tek satır: marka solda, düğmeler sağda; ikinci satıra kırılmaz.
    const box = await header.boundingBox();
    expect(box!.height).toBeLessThanOrEqual(80);
    // Telefonda "Randevu al" rahat bir dokunma hedefi (≥ 44 px).
    const cta = await header.getByRole("link", { name: "Randevu al", exact: true }).boundingBox();
    expect(cta!.height).toBeGreaterThanOrEqual(44);
    // Oturum açıkken çıkış menüdedir: müşteri altbilgiye inmek zorunda kalmaz.
    await header.getByRole("button", { name: "Menüyü aç" }).click();
    await expect(page.locator("#mobil-menu").getByRole("button", { name: "Çıkış" })).toBeVisible();
  });

  test("telefonda çubuk tek satır kalır ve sayfa yana kaymaz", async ({ page }) => {
    await page.goto("/");
    const header = page.getByRole("banner");
    // Hero çubuğu 80 px + 1 px alt çizgi; tek satırın kanıtı iki satırın (≥ 120) altında kalmasıdır.
    const box = await header.boundingBox();
    expect(box!.height).toBeLessThanOrEqual(84);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(412);
    // Dil ve tema anahtarı telefonda menünün içindedir, çubukta değil.
    await expect(header.getByRole("group", { name: "Dil" })).toBeHidden();
    await page.getByRole("button", { name: "Menüyü aç" }).click();
    await expect(page.locator("#mobil-menu").getByRole("group", { name: "Dil" })).toBeVisible();
  });

  test("Bebas Neue artık yüklenmiyor", async ({ page }) => {
    await page.goto("/");
    const families = await page.evaluate(() => Array.from(document.fonts).map((f) => f.family));
    expect(families.some((f) => /bebas/i.test(f))).toBe(false);
  });
});
