import { describe, it, expect, afterEach } from "vitest";
import { siteUrl } from "@/lib/site-url";

const original = process.env.NEXT_PUBLIC_SITE_URL;

afterEach(() => {
  if (original === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
  else process.env.NEXT_PUBLIC_SITE_URL = original;
});

describe("siteUrl", () => {
  it("ayarlanmış adresi döner", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://afrosalon.example";
    expect(siteUrl()).toBe("https://afrosalon.example");
  });

  // Adresler her zaman `siteUrl() + "/yol"` diye birleşiyor: sondaki çizgi
  // kalsaydı site haritasında "https://site//randevu" çıkardı.
  it("sondaki eğik çizgileri atar", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://afrosalon.example/";
    expect(siteUrl()).toBe("https://afrosalon.example");
    process.env.NEXT_PUBLIC_SITE_URL = "https://afrosalon.example///";
    expect(siteUrl()).toBe("https://afrosalon.example");
  });

  it("baştaki/sondaki boşluğu temizler", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "  https://afrosalon.example  ";
    expect(siteUrl()).toBe("https://afrosalon.example");
  });

  it("tanımsız ya da boşsa geliştirme adresine düşer", () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    expect(siteUrl()).toBe("http://localhost:3000");
    process.env.NEXT_PUBLIC_SITE_URL = "";
    expect(siteUrl()).toBe("http://localhost:3000");
    process.env.NEXT_PUBLIC_SITE_URL = "   ";
    expect(siteUrl()).toBe("http://localhost:3000");
  });
});
