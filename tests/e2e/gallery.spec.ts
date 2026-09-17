import { test, expect } from "@playwright/test";

// Seed'in eklediği 8 galeri fotoğrafından 4'ü "Afro" etiketli (prisma/seed.ts).
// Bu testler saate bağlı değildir: dükkânın açık/kapalı olması sonucu etkilemez.
const SEEDED_TOTAL = 8;
const AFRO_COUNT = 4;

test.describe("landing galeri", () => {
  test("etiket filtresi görünen kart sayısını değiştirir", async ({ page }) => {
    await page.goto("/");
    const gallery = page.locator("#galeri");
    const cards = gallery.getByRole("button", { name: /büyüt$/ });
    // Filtre düğmeleri ile fotoğraf düğmeleri aynı bölümde: etiketler kendi grubundan seçilir.
    const filters = gallery.getByRole("group", { name: "Etikete göre süz" });
    await expect(cards).toHaveCount(SEEDED_TOTAL);

    await filters.getByRole("button", { name: /^Afro/ }).click();
    await expect(cards).toHaveCount(AFRO_COUNT);
    await expect(page).toHaveURL(/etiket=Afro/);

    await filters.getByRole("button", { name: /^Tümü/ }).click();
    await expect(cards).toHaveCount(SEEDED_TOTAL);
  });

  test("karta tıklayınca lightbox açılır, ok tuşuyla ilerler, Esc kapatır", async ({ page }) => {
    // Etiket doğrudan URL'den gelir: filtre paylaşılabilir bir bağlantıdır.
    await page.goto("/?etiket=Afro");
    const gallery = page.locator("#galeri");
    const cards = gallery.getByRole("button", { name: /büyüt$/ });
    await expect(cards).toHaveCount(AFRO_COUNT);

    await cards.first().click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(`1 / ${AFRO_COUNT}`)).toBeVisible();

    await page.keyboard.press("ArrowRight");
    await expect(dialog.getByText(`2 / ${AFRO_COUNT}`)).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });
});
