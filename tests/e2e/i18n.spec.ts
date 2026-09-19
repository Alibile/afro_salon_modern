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
    // Aynı metin paket kartında da var (Tur 6); hero belgede önce gelir.
    const cta = page.getByRole("link", { name: "Book today" }).first();
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

  // Panelden girilen içerik de üç dilli (Tur 5, Task 4): hizmet adı, hakkımızda
  // metni ve galeri etiketleri seed'de İngilizceleriyle birlikte gelir.
  test("İngilizce ana sayfa hizmet adlarını ve içeriği İngilizce basar", async ({ page }) => {
    await page.goto("/en");
    const services = page.locator("#hizmetler");
    await expect(services.getByText("Wash, cut & beard", { exact: true })).toBeVisible();
    // Türkçe kaynak metin İngilizce sayfada görünmemeli.
    await expect(services.getByText("Yıkama + Kesim + Sakal")).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "An experience of its own" })).toBeVisible();
  });

  test("Fransızca ana sayfa hizmet adlarını Fransızca basar", async ({ page }) => {
    await page.goto("/fr");
    await expect(page.locator("#hizmetler").getByText("Shampoing, coupe et barbe", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Une expérience à part" })).toBeVisible();
    await expect(page.locator("#ekip").getByText("Tresses, twists et line-up", { exact: true })).toBeVisible();
  });

  // Berber tanıtımı da panelden girilen üç dilli içerik (Tur 5, Task 6):
  // seed EN metnini yazar, `/en` ekip kartı Türkçesini değil onu basmalı.
  test("İngilizce ekip kartı berber tanıtımını İngilizce basar", async ({ page }) => {
    await page.goto("/en");
    const team = page.locator("#ekip");
    await expect(team.getByText("Fades and design cuts are his signature", { exact: true })).toBeVisible();
    await expect(team.getByText("Braids, twists and line-ups", { exact: true })).toBeVisible();
    await expect(team.getByText("Fade ve tasarım kesim uzmanı")).toHaveCount(0);
  });

  test("İngilizce randevu sihirbazı hizmetleri İngilizce listeler", async ({ page }) => {
    await page.goto("/en/randevu");
    await expect(page.getByRole("button", { name: /Wash, cut & beard/ })).toBeVisible();
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
    // Hizmet adı artık İngilizce: aynı hizmet, ziyaretçinin dilinde.
    await page.getByRole("button", { name: /Wash, cut & beard/ }).first().click();
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

/**
 * Panel de üç dilde. Türkçe panel testleri (`booking.spec.ts`) öneksiz yolda
 * duruyor; burada İngilizce panel ve dil tercihi doğrulanıyor. Tercih
 * `User.locale`'e yazıldığı için bu testler seed berberinin kayıtlı dilini
 * değiştirir — panelin *gösterdiği* dil adresten geldiğinden Türkçe testler
 * bundan etkilenmez.
 */
test.describe.serial("panel çevirileri ve dil tercihi", () => {
  test("İngilizce panel İngilizce açılır", async ({ page }) => {
    await page.goto("/en/giris");
    await page.getByLabel("Email").fill("kwame@afrosalon.local");
    await page.getByLabel("Password").fill("Sifre123!");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL("/en/panel");
    await expect(page.getByRole("heading", { level: 1, name: /^Today · / })).toBeVisible();
    const nav = page.getByRole("navigation").first();
    await expect(nav.getByRole("link", { name: "Appointments" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Customers" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "My profile" })).toBeVisible();
  });

  test("dil tercihi paneli Fransızcaya taşır", async ({ page }) => {
    await page.goto("/en/giris");
    await page.getByLabel("Email").fill("kwame@afrosalon.local");
    await page.getByLabel("Password").fill("Sifre123!");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL("/en/panel");

    await page.goto("/en/panel/profil");
    await expect(page.getByRole("heading", { level: 1, name: "My profile" })).toBeVisible();
    await page.getByLabel("Dashboard and email language").selectOption("fr");
    await expect(page).toHaveURL("/fr/panel/profil");
    await expect(page.locator("html")).toHaveAttribute("lang", "fr");
    await expect(page.getByRole("heading", { level: 1, name: "Mon profil" })).toBeVisible();

    // Tercih kaydedildi: yeniden yüklemek adresi değil, seçili değeri sınar.
    await page.reload();
    await expect(page.getByLabel("Langue de l'espace pro et des e-mails")).toHaveValue("fr");
  });

  /**
   * Kutuda görünen değer **kayıtlı tercihtir**, adresin dili değil. Fransızca
   * sayfadan giriş yapan kullanıcının tercihi `fr`dir (bkz. `src/lib/auth.ts`);
   * aynı kullanıcı İngilizce adresteki profili açtığında kutu yine "fr"
   * göstermeli. Adresin dilini gösterseydi Fransızca kayıtlı bir berber Türkçe
   * adreste "Türkçe" görür ve Türkçeyi hiç seçemezdi — seçim zaten seçili
   * sanılan değere eşit sayılıp yutulurdu.
   */
  test("kayıtlı tercih adresin dilinden farklı olsa da kutuda o görünür", async ({ page }) => {
    await page.goto("/fr/giris");
    await page.getByLabel("E-mail").fill("kwame@afrosalon.local");
    await page.getByLabel("Mot de passe").fill("Sifre123!");
    await page.getByRole("button", { name: "Se connecter" }).click();
    await expect(page).toHaveURL("/fr/panel");

    // Adres İngilizce, kayıtlı tercih Fransızca: ikisi ayrı şeyler.
    await page.goto("/en/panel/profil");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.getByLabel("Dashboard and email language")).toHaveValue("fr");
  });

  test("Türkçeye geri alınır", async ({ page }) => {
    await page.goto("/fr/giris");
    await page.getByLabel("E-mail").fill("kwame@afrosalon.local");
    await page.getByLabel("Mot de passe").fill("Sifre123!");
    await page.getByRole("button", { name: "Se connecter" }).click();
    await expect(page).toHaveURL("/fr/panel");
    await page.goto("/fr/panel/profil");
    await page.getByLabel("Langue de l'espace pro et des e-mails").selectOption("tr");
    await expect(page).toHaveURL("/panel/profil");
    await expect(page.getByRole("heading", { level: 1, name: "Profilim" })).toBeVisible();
  });
});
