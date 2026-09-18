import { test, expect } from "@playwright/test";

// Seed 22 galeri fotoğrafı ekler (prisma/seed.ts). Landing bir sayfada 12 tanesini
// basar (GALLERY_PAGE_SIZE), kalanı "Daha fazla göster" ile açılır.
// Bu testler saate bağlı değildir: dükkânın açık/kapalı olması sonucu etkilemez.
const SEEDED_TOTAL = 22;
const PAGE_SIZE = 12;
const LOW_TAPER_COUNT = 3;
const AFRO_COUNT = 2;

test.describe("landing galeri", () => {
  test("etiket filtresi görünen kart sayısını değiştirir", async ({ page }) => {
    await page.goto("/");
    const gallery = page.locator("#galeri");
    const cards = gallery.getByRole("button", { name: /büyüt$/ });
    // Filtre düğmeleri ile fotoğraf düğmeleri aynı bölümde: etiketler kendi grubundan seçilir.
    const filters = gallery.getByRole("group", { name: "Etikete göre süz" });
    await expect(cards).toHaveCount(PAGE_SIZE);

    await filters.getByRole("button", { name: /^Afro/ }).click();
    await expect(cards).toHaveCount(AFRO_COUNT);
    await expect(page).toHaveURL(/etiket=Afro/);

    await filters.getByRole("button", { name: /^Tümü/ }).click();
    await expect(cards).toHaveCount(PAGE_SIZE);

    // Sayfalama: tüm fotoğraflar tek bir "daha fazla" ile açılır.
    await gallery.getByRole("button", { name: /^Daha fazla göster/ }).click();
    await expect(cards).toHaveCount(SEEDED_TOTAL);
  });

  test("kategori çipi etiket adı ve sayısıyla gelir, o etikete süzer", async ({ page }) => {
    await page.goto("/");
    const gallery = page.locator("#galeri");
    const cards = gallery.getByRole("button", { name: /büyüt$/ });
    const filters = gallery.getByRole("group", { name: "Etikete göre süz" });

    const lowTaper = filters.getByRole("button", { name: /^Low Taper Fade/ });
    // Çip yalnızca metin: etiket adı ve yanında sayısı.
    await expect(lowTaper).toBeVisible();
    await expect(lowTaper).toHaveText(`Low Taper Fade${LOW_TAPER_COUNT}`);
    await expect(filters.getByRole("button", { name: /^Tümü/ })).toHaveText(`Tümü${SEEDED_TOTAL}`);
    // Hiçbir çipte görsel yok.
    await expect(filters.locator("img")).toHaveCount(0);

    await expect(lowTaper).toHaveAttribute("aria-pressed", "false");
    await lowTaper.click();
    await expect(lowTaper).toHaveAttribute("aria-pressed", "true");
    await expect(cards).toHaveCount(LOW_TAPER_COUNT);
    await expect(page).toHaveURL(/etiket=Low\+Taper\+Fade/);
  });

  test("karta tıklayınca lightbox açılır, ok tuşuyla ilerler, Esc kapatır", async ({ page }) => {
    // Etiket doğrudan URL'den gelir: filtre paylaşılabilir bir bağlantıdır.
    await page.goto("/?etiket=Low+Taper+Fade");
    const gallery = page.locator("#galeri");
    const cards = gallery.getByRole("button", { name: /büyüt$/ });
    await expect(cards).toHaveCount(LOW_TAPER_COUNT);

    await cards.first().click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    // Sayaç filtrelenmiş listenin tamamını gösterir (basılı sayfayı değil).
    await expect(dialog.getByText(`1 / ${LOW_TAPER_COUNT}`)).toBeVisible();

    await page.keyboard.press("ArrowRight");
    await expect(dialog.getByText(`2 / ${LOW_TAPER_COUNT}`)).toBeVisible();

    // Baştan geriye gidince listenin sonuna sarar.
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("ArrowLeft");
    await expect(dialog.getByText(`${LOW_TAPER_COUNT} / ${LOW_TAPER_COUNT}`)).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });
});

// Sosyal ikonlar Tur 4'te navbar'dan çıkarıldı; yerleri footer (ve iletişim
// bölümü). Bu test ikisini birden bekler: çubukta yok, altbilgide var.
test.describe("landing navbar", () => {
  const SOCIAL = 'a[aria-label="Instagram"], a[aria-label="Facebook"], a[aria-label="WhatsApp"]';

  test("navbar sosyal medya bağlantısı içermez, altbilgi içerir", async ({ page }) => {
    await page.goto("/");
    const header = page.locator("header");
    await expect(header.locator(SOCIAL)).toHaveCount(0);

    // Mobil menü açıkken de yok (ikonlar oradan da kaldırıldı).
    await header.getByRole("button", { name: "Menüyü aç" }).click();
    await expect(page.locator("#mobil-menu")).toBeVisible();
    await expect(header.locator(SOCIAL)).toHaveCount(0);

    await expect(page.locator("footer").locator(SOCIAL).first()).toBeVisible();
  });
});
