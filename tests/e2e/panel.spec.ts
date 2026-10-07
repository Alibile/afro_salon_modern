import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers";

/**
 * Panel kabuğu (Tur 8): gruplanmış menü, sayfa başlığı, telefonda yatay
 * şerit. Profil Pixel 7; geniş ekran testleri ölçüyü kendisi ayarlar.
 */
test.describe("panel kabuğu", () => {
  test("yönetici menüsü iki gruba ayrılır, geniş ekranda grup başlıkları görünür", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await loginAs(page, "admin@afrosalon.local");
    await expect(page).toHaveURL(/\/panel$/);
    const nav = page.getByRole("navigation", { name: "Panel menüsü" });
    await expect(nav.getByText("Günlük iş")).toBeVisible();
    await expect(nav.getByText("Yönetim")).toBeVisible();
    await expect(nav.getByRole("link")).toHaveCount(10);
    await expect(nav.getByRole("link", { name: "Bugün" })).toHaveAttribute("aria-current", "page");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/^Bugün, /);
  });

  test("berber Yönetim grubunu görmez", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await loginAs(page, "kwame@afrosalon.local");
    const nav = page.getByRole("navigation", { name: "Panel menüsü" });
    await expect(nav.getByText("Günlük iş")).toBeVisible();
    await expect(nav.getByText("Yönetim")).toHaveCount(0);
    await expect(nav.getByRole("link", { name: "Ayarlar" })).toHaveCount(0);
  });

  test("telefonda menü yatay kayan şerittir, grup başlıkları gizli", async ({ page }) => {
    await loginAs(page, "admin@afrosalon.local");
    const nav = page.getByRole("navigation", { name: "Panel menüsü" });
    await expect(nav.getByText("Günlük iş")).toBeHidden();
    const overflow = await nav.evaluate((el) => el.scrollWidth > el.clientWidth);
    expect(overflow).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(412);
    // Şerit maddeleri dokunma hedefi (≥ 44 px); dil anahtarı telefonda da çubukta.
    const link = await nav.getByRole("link", { name: "Randevular" }).boundingBox();
    expect(link!.height).toBeGreaterThanOrEqual(44);
    await expect(page.getByRole("group", { name: "Dil" })).toBeVisible();
  });

  test("koyu temada aktif menü maddesi zeminden ayrılır", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.setViewportSize({ width: 1280, height: 900 });
    await loginAs(page, "admin@afrosalon.local");
    const active = page.getByRole("navigation", { name: "Panel menüsü" }).getByRole("link", { name: "Bugün" });
    const colors = await active.evaluate((el) => {
      const s = getComputedStyle(el);
      return { bg: s.backgroundColor, border: s.borderLeftColor, body: getComputedStyle(document.body).backgroundColor };
    });
    expect(colors.bg).not.toBe(colors.body);
    expect(colors.bg).not.toBe("rgba(0, 0, 0, 0)");
    expect(colors.border).not.toBe("rgba(0, 0, 0, 0)");
  });

  test("randevu tablosu telefonda kart listesine düşer", async ({ page }) => {
    await loginAs(page, "admin@afrosalon.local");
    await page.goto("/panel/randevular");
    await expect(page.getByRole("heading", { level: 1, name: "Randevular" })).toBeVisible();
    // Filtreler etiketli: tarih kutuları etiketleriyle bulunur.
    await expect(page.getByLabel("Başlangıç")).toBeVisible();
    await expect(page.getByLabel("Bitiş")).toBeVisible();
    await expect(page.getByRole("button", { name: "Uygula" })).toBeVisible();
    const table = page.locator("table");
    await expect(table).toBeVisible();
    await expect(table.locator("thead")).toBeHidden();
    // İlk satırın her hücresi kendi etiketini taşır; durum metni okunur.
    const firstRow = table.locator("tbody tr").first();
    await expect(firstRow).toBeVisible();
    await expect(firstRow.locator('td[data-label="Durum"]')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(412);
  });

  test("hizmetler listesi tabloda, yeni kayıt formu başlıktaki düğmeyle açılır", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await loginAs(page, "admin@afrosalon.local");
    await page.goto("/panel/hizmetler");
    await expect(page.getByRole("heading", { level: 1, name: "Hizmetler" })).toBeVisible();
    // Form kapalı: ad alanı yok. Düğme açar, "Kapat" kapatır.
    await expect(page.getByRole("heading", { name: "Yeni hizmet", level: 2 })).toHaveCount(0);
    await page.getByRole("button", { name: "Yeni hizmet" }).click();
    await expect(page.getByRole("heading", { name: "Yeni hizmet", level: 2 })).toBeVisible();
    await expect(page.getByLabel("Süre (dk)")).toBeVisible();
    await page.getByRole("button", { name: "Kapat" }).click();
    await expect(page.getByRole("heading", { name: "Yeni hizmet", level: 2 })).toHaveCount(0);
    // Liste bir tablo; başlık satırında Ad ve Fiyat sütunları var.
    const table = page.locator("table");
    await expect(table.getByRole("columnheader", { name: "Ad" })).toBeVisible();
    await expect(table.getByRole("columnheader", { name: "Fiyat (₺)" })).toBeVisible();
    await expect(table.getByRole("cell", { name: "Yıkama + Kesim + Sakal" })).toBeVisible();
    // Yeni kayıt paneli ve satır içi düzenleme aynı anda açıkken alan id'leri çakışmaz.
    await page.getByRole("button", { name: "Yeni hizmet" }).click();
    await table.getByRole("button", { name: "Düzenle", exact: true }).first().click();
    await expect(page.getByLabel("Fiyat (₺)")).toHaveCount(2);
    const duplicates = await page.evaluate(() => {
      const ids = Array.from(document.querySelectorAll("[id]")).map((el) => el.id);
      return ids.filter((id, i) => ids.indexOf(id) !== i);
    });
    expect(duplicates).toEqual([]);
  });

  test("berber detayı Düzenle ile açılır ve formları gösterir", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await loginAs(page, "admin@afrosalon.local");
    await page.goto("/panel/berberler");
    await page.getByRole("link", { name: "Düzenle" }).first().click();
    await expect(page).toHaveURL(/\/panel\/berberler\/[^/]+$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/Kwame Mensah|Yusuf Adeyemi/);
    await expect(page.getByRole("heading", { name: "Çalışma saatleri" })).toBeVisible();
    await expect(page.getByLabel("Ad Soyad")).toBeVisible();
    await expect(page.getByRole("button", { name: /^Sil/ })).toBeVisible();
    expect(errors).toEqual([]);
  });
});
