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
});
