import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers";

/**
 * Panelden içerik yönetimi (Tur 9): metin girilince ana sayfa onu basar,
 * boşaltılınca çeviri dosyasındaki metne döner; SSS serbest liste.
 */
test.describe.serial("içerik yönetimi", () => {
  test("berber İçerik sayfasına giremez", async ({ page }) => {
    await loginAs(page, "kwame@afrosalon.local");
    await page.goto("/panel/icerik");
    await expect(page).toHaveURL(/\/403$/);
  });

  test("hero manşeti panelden değişir ve boşaltınca varsayılana döner", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await loginAs(page, "admin@afrosalon.local");
    await page.goto("/panel/icerik");
    await expect(page.getByRole("heading", { level: 1, name: "İçerik" })).toBeVisible();
    const hero = page.locator("section").filter({ has: page.getByRole("heading", { name: "Hero" }) });
    const line1 = hero.getByRole("textbox", { name: "Manşet 1. satır" });
    // Alan boşken yer tutucu çeviri dosyasının metnidir.
    await expect(line1).toHaveAttribute("placeholder", "KIVRIMIN KENDİ");
    await line1.fill("Deneme manşeti");
    await hero.getByRole("button", { name: "Kaydet" }).click();
    await expect(page.getByText("İçerik kaydedildi").first()).toBeVisible();

    await page.goto("/");
    await expect(page.locator("h1")).toContainText("Deneme manşeti");
    await expect(page.locator("h1")).toContainText("GEOMETRİSİ VAR.");

    await page.goto("/panel/icerik");
    await hero.getByRole("textbox", { name: "Manşet 1. satır" }).fill("");
    await hero.getByRole("button", { name: "Kaydet" }).click();
    await expect(page.getByText("İçerik kaydedildi").first()).toBeVisible();
    await page.goto("/");
    await expect(page.locator("h1")).toContainText("KIVRIMIN KENDİ");
  });

  test("SSS'ye soru eklenir, ana sayfada ve yapısal veride görünür, silinir", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await loginAs(page, "admin@afrosalon.local");
    await page.goto("/panel/icerik");
    const faq = page.locator("section").filter({ has: page.getByRole("heading", { name: "Sıkça sorulanlar" }) });
    await faq.getByRole("button", { name: "Yeni soru" }).click();
    const question = `E2E sorusu ${Date.now()}?`;
    await faq.getByRole("textbox", { name: "Soru" }).fill(question);
    await faq.getByRole("textbox", { name: "Cevap" }).fill("E2E cevabı; en geç {minutes} dakika kala.");
    await faq.getByRole("button", { name: "Ekle" }).click();
    await expect(page.getByText("Soru eklendi").first()).toBeVisible();
    await expect(faq.getByText(question)).toBeVisible();

    await page.goto("/#sss");
    const item = page.locator("#sss details").filter({ hasText: question });
    await expect(item).toHaveCount(1);
    await item.locator("summary").click();
    // Yer tutucu dolduruldu: "{minutes}" değil sayı basılır.
    await expect(item.locator("p")).toContainText(/E2E cevabı; en geç \d+ dakika kala\./);
    const jsonLd = await page.locator('script[type="application/ld+json"]').first().textContent();
    expect(jsonLd).toContain(question);

    await page.goto("/panel/icerik");
    const row = faq.locator("li").filter({ hasText: question });
    await row.getByRole("button", { name: /^Sil/ }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Sil" }).click();
    await expect(faq.getByText(question)).toHaveCount(0);
  });

  test("telefonda İçerik sayfası yana taşmaz", async ({ page }) => {
    await loginAs(page, "admin@afrosalon.local");
    await page.goto("/panel/icerik");
    await expect(page.getByRole("heading", { level: 1, name: "İçerik" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(412);
  });
});
