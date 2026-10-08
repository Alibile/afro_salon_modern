import { test, expect } from "@playwright/test";
import { deflateSync } from "node:zlib";
import { loginAs } from "./helpers";

/** Tek renk, verilen ölçüde PNG (test ortamında R2 yok, yükleme yerel diske iner). */
function png(width: number, height: number): Buffer {
  const crcTable = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  const crc = (buf: Buffer) => { let c = 0xffffffff; for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (type: string, data: Buffer) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4); ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const row = Buffer.concat([Buffer.from([0]), Buffer.alloc(width * 3, 0x80)]);
  const raw = Buffer.concat(Array.from({ length: height }, () => row));
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}

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

  test("küçük fotoğraf yüklenmeden reddedilir; uygun fotoğraf yuvaya girer ve varsayılana dönülür", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await loginAs(page, "admin@afrosalon.local");
    await page.goto("/panel/icerik");
    const presigns: string[] = [];
    page.on("request", (r) => { if (r.url().includes("/api/upload/presign")) presigns.push(r.url()); });
    const images = page.locator("section").filter({ has: page.getByRole("heading", { name: "Görseller" }) });
    // 1×1: hero için çok küçük. Hata ağa çıkmadan, istemcide verilir.
    await images.getByLabel("Hero fotoğrafı (geniş ekran)").setInputFiles({ name: "kucuk.png", mimeType: "image/png", buffer: png(1, 1) });
    await expect(page.getByText("Görsel bu yuva için çok küçük").first()).toBeVisible();
    expect(presigns).toHaveLength(0);
    // 1000×1000: hakkımızda yuvası için uygun (serbest oran, ≥ 1000 px).
    await images.getByLabel("Hakkımızda fotoğrafı").setInputFiles({ name: "about.png", mimeType: "image/png", buffer: png(1000, 1000) });
    await expect(page.getByText("Fotoğraf kaydedildi").first()).toBeVisible();
    const aboutCard = images.locator("li").filter({ hasText: "Hakkımızda fotoğrafı" });
    await expect(aboutCard.getByText("Panelden yüklendi")).toBeVisible();
    await aboutCard.getByRole("button", { name: "Varsayılana dön" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Varsayılana dön" }).click();
    await expect(page.getByText("Varsayılana dönüldü").first()).toBeVisible();
    await expect(aboutCard.getByText("Varsayılan dosya")).toBeVisible();
  });

  test("yeni soru listenin sonuna eklenir", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await loginAs(page, "admin@afrosalon.local");
    await page.goto("/panel/icerik");
    const faq = page.locator("section").filter({ has: page.getByRole("heading", { name: "Sıkça sorulanlar" }) });
    const before = await faq.locator("ul > li").count();
    await faq.getByRole("button", { name: "Yeni soru" }).click();
    const question = `E2E son soru ${Date.now()}?`;
    await faq.getByRole("textbox", { name: "Soru" }).fill(question);
    await faq.getByRole("textbox", { name: "Cevap" }).fill("Sona eklenen cevap metni.");
    await faq.getByRole("button", { name: "Ekle" }).click();
    await expect(page.getByText("Soru eklendi").first()).toBeVisible();
    await expect(faq.locator("ul > li")).toHaveCount(before + 1);
    await expect(faq.locator("ul > li").last()).toContainText(question);
    const row = faq.locator("ul > li").filter({ hasText: question });
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
