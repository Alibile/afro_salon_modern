import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  globalSetup: "./tests/e2e/global-setup.ts",
  use: {
    baseURL: "http://localhost:3100",
    ...devices["Pixel 7"],
    // Site artık `Accept-Language` başlığına bakıp dil seçiyor (next-intl,
    // `localeDetection`). Chrome varsayılanı "en-US" olduğundan başlık
    // verilmezse her `page.goto("/")` `/en`e yönlenir ve Türkçe akış testleri
    // adres satırında kaybolurdu. Ziyaretçi Türkçe konuşuyor: TR yolları
    // öneksiz kalır, İngilizce/Fransızca senaryolar adresi açıkça yazar.
    locale: "tr-TR",
    channel: process.env.CI ? undefined : "chrome",
  },
  webServer: {
    command: "dotenv -e .env.test --override -- next dev -p 3100",
    url: "http://localhost:3100",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
