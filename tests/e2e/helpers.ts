import type { Page } from "@playwright/test";

/**
 * Giriş formunu doldurup gönderir ve yönlendirmeyi bekler. Seed hesapları:
 * admin@afrosalon.local (yönetici), kwame@ ve yusuf@afrosalon.local (berber);
 * şifre `SEED_PASSWORD` (varsayılan Sifre123!).
 */
export async function loginAs(page: Page, email: string, password = "Sifre123!", locale = "") {
  await page.goto(`${locale}/giris`);
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.locator("form button[type=submit]").click();
  await page.waitForURL((url) => !url.pathname.endsWith("/giris"));
}
