import { test, expect } from "@playwright/test";

/**
 * Üç dilli yönlendirmenin duman testi. Türkçe varsayılan ve öneksiz olduğu için
 * (bkz. `src/i18n/routing.ts`, `localePrefix: "as-needed"`) diğer testler adres
 * değiştirmeden çalışmaya devam eder; burada yalnızca önekli yolların ve dil
 * anahtarının davranışı doğrulanır.
 */
test.describe("çok dilli yönlendirme", () => {
  test("İngilizce önek sayfayı en diliyle açar", async ({ page }) => {
    await page.goto("/en");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    // Gezinme etiketleri mesaj dosyasından gelir; gövde metinleri Task 2'de taşınacak.
    await expect(page.getByRole("link", { name: "Book now" }).first()).toBeVisible();
  });

  test("Türkçe önek almaz", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL("/");
    await expect(page.locator("html")).toHaveAttribute("lang", "tr");
  });

  test("Fransızca randevu sayfası açılır", async ({ page }) => {
    const response = await page.goto("/fr/randevu");
    expect(response?.status()).toBe(200);
    await expect(page.locator("html")).toHaveAttribute("lang", "fr");
    await expect(page.getByRole("heading", { name: "1. Hizmet seç" })).toBeVisible();
  });

  test("tanınmayan dil 404 verir", async ({ page }) => {
    const response = await page.goto("/de");
    expect(response?.status()).toBe(404);
  });

  test("dil anahtarı aynı sayfada dil değiştirir", async ({ page }) => {
    await page.goto("/randevu");
    // Mobil genişlikte üst çubuk tek satır: anahtar başlıktaki menüde durur.
    await page.getByRole("navigation", { name: "Ana menü" }).getByRole("link", { name: "İngilizce" }).click();
    await expect(page).toHaveURL("/en/randevu");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
  });

  test("korumalı sayfa yönlendirmesi dili korur", async ({ page }) => {
    await page.goto("/en/panel");
    await expect(page).toHaveURL("/en/giris?next=%2Fen%2Fpanel");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
  });
});
