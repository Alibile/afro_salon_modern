import { test, expect } from "@playwright/test";

/**
 * Üç dilli yönlendirmenin duman testi. Türkçe varsayılan ve öneksiz olduğu için
 * (bkz. `src/i18n/routing.ts`, `localePrefix: "as-needed"`) diğer testler adres
 * değiştirmeden çalışmaya devam eder; burada önekli yolların, dil anahtarının
 * ve müşteri yüzünün üç dildeki metinleri doğrulanır.
 */
test.describe("çok dilli yönlendirme", () => {
  test("İngilizce önek sayfayı en diliyle açar", async ({ page }) => {
    await page.goto("/en");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.getByRole("link", { name: "Book now" }).first()).toBeVisible();
  });

  test("Türkçe önek almaz", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL("/");
    await expect(page.locator("html")).toHaveAttribute("lang", "tr");
  });

  test("tanınmayan dil 404 verir", async ({ page }) => {
    const response = await page.goto("/de");
    expect(response?.status()).toBe(404);
  });

  test("dil anahtarı aynı sayfada dil değiştirir", async ({ page }) => {
    await page.goto("/randevu");
    // Mobil genişlikte üst çubuk tek satır: anahtar başlıktaki menüde durur.
    // Erişilebilir ad görünen kodu da taşır ("İngilizce (EN)").
    await page.getByRole("navigation", { name: "Ana menü" }).getByRole("link", { name: "İngilizce (EN)" }).click();
    await expect(page).toHaveURL("/en/randevu");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
  });

  // Sihirbazın taşıdığı seçim sorgu dizesinde durur; dil değiştirmek onu
  // düşürürse ziyaretçi öbür dilde boş bir sihirbazla karşılaşır.
  test("dil anahtarı sorgu dizesini korur", async ({ page }) => {
    await page.goto("/randevu?b=test&t=deneme");
    await page.getByRole("navigation", { name: "Ana menü" }).getByRole("link", { name: "Fransızca (FR)" }).click();
    await expect(page).toHaveURL("/fr/randevu?b=test&t=deneme");
  });

  test("korumalı sayfa yönlendirmesi dili korur", async ({ page }) => {
    await page.goto("/en/panel");
    await expect(page).toHaveURL("/en/giris?next=%2Fen%2Fpanel");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
  });
});

test.describe("müşteri yüzü çevirileri", () => {
  test("İngilizce hero düğmesi randevu sayfasına gider", async ({ page }) => {
    await page.goto("/en");
    const cta = page.getByRole("link", { name: "Book today" });
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute("href", "/en/randevu");
    await cta.click();
    await expect(page).toHaveURL("/en/randevu");
    await expect(page.getByRole("heading", { name: "1. Choose a service" })).toBeVisible();
  });

  test("Fransızca sihirbaz kendi dilinde açılır", async ({ page }) => {
    const response = await page.goto("/fr/randevu");
    expect(response?.status()).toBe(200);
    await expect(page.locator("html")).toHaveAttribute("lang", "fr");
    await expect(page.getByRole("heading", { name: "1. Choisir une prestation" })).toBeVisible();
  });

  test("İngilizce giriş formu İngilizce etiketler taşır", async ({ page }) => {
    await page.goto("/en/giris");
    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
  });
});

test.describe.serial("İngilizce randevu akışı", () => {
  const stamp = Date.now();
  const customer = { name: `E2E EN ${stamp}`, email: `e2e-en-${stamp}@test.local`, password: "Sifre123!" };

  test("İngilizce kayıt olup bugün için randevu alır", async ({ page }) => {
    await page.goto("/en/randevu");
    await page.getByRole("button", { name: /Saç Kesimi/ }).click();
    await page.getByRole("button", { name: /Kwame Mensah/ }).click();

    const slots = page.locator('section:has(h2:text("3. Choose a time")) button');
    const closed = page.getByText(/closed today|No times left/i);
    await expect(slots.first().or(closed)).toBeVisible();
    test.skip(await closed.isVisible(), "Dükkan şu an kapalı, slot testi atlandı");

    await slots.first().click();
    await page.getByRole("button", { name: "Sign in and confirm" }).click();
    await expect(page).toHaveURL(/\/en\/giris/);
    await page.getByRole("link", { name: "Sign up" }).click();
    await page.getByLabel("Full name").fill(customer.name);
    await page.getByLabel("Email").fill(customer.email);
    await page.getByLabel("Password").fill(customer.password);
    await page.getByRole("button", { name: "Sign up" }).click();

    // Seçimler adresten geri gelir; onay düğmesi artık oturum açmış hâlini gösterir.
    await expect(page.getByRole("button", { name: "Confirm booking" })).toBeEnabled();
    await page.getByRole("button", { name: "Confirm booking" }).click();
    await expect(page).toHaveURL("/en/randevularim");
    await expect(page.getByRole("heading", { name: "Today's appointment" })).toBeVisible();
    await expect(page.getByText("Scheduled")).toBeVisible();
  });
});
