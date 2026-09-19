import { test, expect } from "@playwright/test";

const stamp = Date.now();
// İsim, koşuya özgü benzersiz bir bilgi taşır: /panel'de yalnızca isimle
// filtrelenen kartın, önceki koşulardan kalan aynı isimli randevularla
// karışmaması ve durum değişse bile (Planlandı -> Tamamlandı) aynı <li>'yi
// işaret etmeye devam etmesi için.
const customer = { name: `E2E Müşteri ${stamp}`, email: `e2e-${stamp}@test.local`, password: "Sifre123!" };
const forwardCustomer = { name: `E2E İleri ${stamp}`, email: `e2e-ileri-${stamp}@test.local`, password: "Sifre123!" };

/** Dükkan takviminde bugün ve yarın (`YYYY-MM-DD`). */
const shopDay = (offsetDays = 0) =>
  new Date(Date.now() + offsetDays * 86_400_000).toLocaleDateString("sv-SE", { timeZone: "Europe/Istanbul" });

/**
 * Pazar salon kapalı: randevu penceresi o günü hiç göstermez (bkz.
 * `src/lib/booking-window.ts`, `tests/e2e/open-all-day.ts`). Panelin "Bugün"
 * panosundan geçen akış ancak bugün randevu alınabiliyorsa koşulabilir.
 */
const SUNDAY = new Date().toLocaleDateString("en-US", { timeZone: "Europe/Istanbul", weekday: "short" }) === "Sun";

const bookingStep = (page: import("@playwright/test").Page) =>
  page.locator('section:has(h2:text("3. Gün ve saat seç"))');
const dayChips = (page: import("@playwright/test").Page) =>
  bookingStep(page).getByRole("group", { name: "Gün seç" }).locator("button");
const timeSlots = (page: import("@playwright/test").Page) =>
  bookingStep(page).locator("div.grid-cols-4 button");

test.describe.serial("randevu akışı", () => {
  test("müşteri kayıt olur ve bugün için randevu alır", async ({ page }) => {
    test.skip(SUNDAY, "Pazar: bugün için randevu alınamaz, panel akışı atlandı");
    await page.goto("/");
    // Aynı metin iki yerde: hero ve paket kartı (Tur 6). Akış hero'dan başlar.
    await page.getByRole("link", { name: "Hemen randevu al" }).first().click();
    await expect(page).toHaveURL(/\/randevu/);

    await page.getByRole("button", { name: /Yıkama \+ Kesim \+ Sakal/ }).click();
    await page.getByRole("button", { name: /Kwame Mensah/ }).click();

    // Varsayılan seçili gün bugündür; yine de açıkça tıklanır ki test hangi
    // güne randevu aldığını bilsin.
    const today = dayChips(page).and(page.locator(`[data-date="${shopDay(0)}"]`));
    const slots = timeSlots(page);
    const closed = page.getByText(/kapalıyız|uygun saat kalmadı/);
    await expect(today.or(closed)).toBeVisible();
    test.skip(await closed.isVisible(), "Dükkan şu an kapalı, slot testi atlandı");
    await today.click();
    await expect(slots.first()).toBeVisible();

    await slots.first().click();
    await page.getByRole("button", { name: "Giriş yap ve onayla" }).click();
    await page.getByRole("link", { name: "Kayıt ol" }).click();
    await page.getByLabel("Ad Soyad").fill(customer.name);
    await page.getByLabel("E-posta").fill(customer.email);
    await page.getByLabel("Şifre").fill(customer.password);
    await page.getByRole("button", { name: "Kayıt ol" }).click();

    // seçimler URL'den geri gelir, onayla
    await expect(page.getByRole("button", { name: "Randevuyu onayla" })).toBeEnabled();
    await page.getByRole("button", { name: "Randevuyu onayla" }).click();
    await expect(page).toHaveURL(/randevularim/);
    await expect(page.getByRole("heading", { name: "YAKLAŞAN RANDEVULARIM" })).toBeVisible();
    await expect(page.getByText("Planlandı")).toBeVisible();
    // Bugünkü randevu kartı tarihin önüne "Bugün" yazar.
    await expect(page.getByText("Bugün ·")).toBeVisible();
  });

  test("berber panelde randevuyu görür ve tamamlar", async ({ page }) => {
    test.skip(SUNDAY, "Pazar: önceki test randevu oluşturmadı");
    await page.goto("/giris");
    await page.getByLabel("E-posta").fill("kwame@afrosalon.local");
    await page.getByLabel("Şifre").fill("Sifre123!");
    await page.getByRole("button", { name: "Giriş yap" }).click();
    await expect(page).toHaveURL(/panel/);
    const card = page.locator("li").filter({ hasText: customer.name }).first();
    test.skip(!(await card.isVisible().catch(() => false)), "Önceki test randevu oluşturmadı");
    await card.getByRole("button", { name: "Tamamlandı" }).click();
    // "Tamamlandı" metni işlem düğmesinin kendi etiketi olduğu için, işlem
    // gerçekten sunucuda kalıcı olmadan da görünür kalabilir. Aksiyon
    // düğmelerinin (yalnızca SCHEDULED durumunda render edilir) kaybolmasını
    // beklemek, durumun sunucuda gerçekten değiştiğini doğrular.
    await expect(card.getByRole("button", { name: "Tamamlandı" })).toBeHidden();
    await expect(card.getByText("Tamamlandı")).toBeVisible();

    // Panelin görsel dili ana sayfanınkinden ayrıdır: başlıklar Bebas, gövde
    // Inter. Ana sayfa ise editoryal tipografiyi (Fraunces) kullanır. İkisi
    // aynı kök yerleşimden beslendiği için bu ayrımın testi burada durur.
    const panelHeadingFont = await page
      .getByRole("heading", { level: 1 })
      .first()
      .evaluate((el) => getComputedStyle(el).fontFamily);
    expect(panelHeadingFont).toContain("Bebas");
    const panelBodyFont = await page.evaluate(() => getComputedStyle(document.querySelector("main")!).fontFamily);
    expect(panelBodyFont).toContain("Inter");

    await page.goto("/");
    const landingHeadingFont = await page
      .getByRole("heading", { level: 1 })
      .first()
      .evaluate((el) => getComputedStyle(el).fontFamily);
    expect(landingHeadingFont).toContain("Fraunces");
  });

  test("müşteri iptal edemeyince telefon mesajı görür", async ({ page }) => {
    test.skip(SUNDAY, "Pazar: önceki test randevu oluşturmadı");
    await page.goto("/giris");
    await page.getByLabel("E-posta").fill(customer.email);
    await page.getByLabel("Şifre").fill(customer.password);
    await page.getByRole("button", { name: "Giriş yap" }).click();
    await expect(page).toHaveURL("/");
    await page.goto("/randevularim");
    // Randevu 120 dakikalık iptal penceresi içinde oluşturulduğundan müşteri
    // doğrudan iptal edemez; ikinci test randevuyu "Tamamlandı" yaptığı için
    // burada randevu artık "Geçmiş" bölümündedir.
    // Not: sayfa başlığı "GEÇMİŞ" (büyük harf) render ediliyor. Playwright'ın
    // case-insensitive eşleşmesi Türkçe noktalı büyük İ harfini standart
    // (Türkçe olmayan) JS toLowerCase kurallarıyla "i̇" (i + combining dot)
    // yaptığından "Geçmiş" (küçük harf) ile eşleşmiyor; aynı büyük harfli
    // biçimi kullanmak bu tuzağı önler.
    await expect(page.getByRole("heading", { name: "GEÇMİŞ" })).toBeVisible();
    await expect(page.getByText("Tamamlandı")).toBeVisible();
  });
});

/**
 * Randevu penceresi bugün + 6 gün (Pazar hariç): ileri bir gün seçmek de aynı
 * akışın parçası. Bu blok Pazar dahil her gün koşar — Pazar günü pencerenin
 * ilk günü zaten yarındır, "bugün olmayan ilk çip" her koşuda vardır.
 */
test.describe.serial("ileri gün randevusu", () => {
  test("müşteri bugünün dışındaki bir güne randevu alır", async ({ page }) => {
    await page.goto("/randevu");
    await page.getByRole("button", { name: /Yıkama \+ Kesim \+ Sakal/ }).click();
    await page.getByRole("button", { name: /Kwame Mensah/ }).click();

    const forward = dayChips(page).and(page.locator(`[data-date]:not([data-date="${shopDay(0)}"])`)).first();
    await expect(forward).toBeVisible();
    const dateKey = await forward.getAttribute("data-date");
    await forward.click();

    const slots = timeSlots(page);
    await expect(slots.first()).toBeVisible();
    await slots.first().click();

    await page.getByRole("button", { name: "Giriş yap ve onayla" }).click();
    await page.getByRole("link", { name: "Kayıt ol" }).click();
    await page.getByLabel("Ad Soyad").fill(forwardCustomer.name);
    await page.getByLabel("E-posta").fill(forwardCustomer.email);
    await page.getByLabel("Şifre").fill(forwardCustomer.password);
    await page.getByRole("button", { name: "Kayıt ol" }).click();

    await expect(page.getByRole("button", { name: "Randevuyu onayla" })).toBeEnabled();
    await page.getByRole("button", { name: "Randevuyu onayla" }).click();
    await expect(page).toHaveURL(/randevularim/);

    // Kart o günün tam tarihini yazar; yarınsa önüne "Yarın" da gelir.
    const longDate = new Intl.DateTimeFormat("tr-TR", {
      timeZone: "Europe/Istanbul",
      day: "numeric",
      month: "long",
      year: "numeric",
      weekday: "long",
    }).format(new Date(`${dateKey}T12:00:00+03:00`));
    await expect(page.getByText(longDate)).toBeVisible();
    if (dateKey === shopDay(1)) await expect(page.getByText("Yarın ·")).toBeVisible();
  });
});

test.describe("landing", () => {
  // "iletişim formu mesaj gönderir" testi yeniden denenmemelidir: sunucu IP
  // başına dakikada 3 gönderime izin verir, `resetRateLimit()` yalnızca sunucu
  // sürecinden çağrılabildiği için e2e'den erişilemez ve Playwright her koşuda
  // aynı IP'den (localhost) gelir. Yeniden deneme, ilk denemenin doldurduğu
  // sayaç yüzünden "Çok fazla deneme" ile kalıcı kırmızıya düşerdi; testin tek
  // gönderimi, global-setup sonrası yeniden başlayan sunucuda her zaman geçer.
  test.describe.configure({ retries: 0 });

  test("menüden Hakkımızda bölümüne gidilir", async ({ page }) => {
    await page.goto("/");
    // Mobil genişlikte bağlantılar hamburger menüsünün arkasındadır.
    const toggle = page.getByRole("button", { name: "Menüyü aç" });
    if (await toggle.isVisible()) await toggle.click();
    const menu = page.getByRole("navigation", { name: "Ana menü" });
    await menu.getByRole("link", { name: "Hakkımızda" }).click();
    await expect(page).toHaveURL(/#hakkimizda$/);
    const about = page.locator("#hakkimizda");
    await expect(about).toBeVisible();
    await expect(about.getByRole("heading", { name: "Benzersiz bir deneyim" })).toBeVisible();
    // Bağlantıya tıklayınca mobil menü kapanır.
    await expect(page.locator("#mobil-menu")).toBeHidden();
  });

  test("iletişim formu mesaj gönderir", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Adınız").fill("E2E Ziyaretçi");
    await page.getByLabel("Telefon (isteğe bağlı)").fill("05550000000");
    await page.locator("label", { has: page.locator('input[value="Yıkama + Kesim + Sakal"]') }).click();
    await page.getByLabel("Mesajınız").fill("Cumartesi günü örgü için yer var mı acaba?");
    await page.getByRole("button", { name: "Mesajı gönder" }).click();
    await expect(page.getByText("Mesajınız alındı, en kısa sürede dönüş yapacağız")).toBeVisible();
    // Form temizlenir.
    await expect(page.getByLabel("Adınız")).toHaveValue("");
  });
});
