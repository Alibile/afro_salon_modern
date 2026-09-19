import { describe, it, expect } from "vitest";
import { localeAlternates, pageAlternates, noIndex, PUBLIC_PATHS } from "@/lib/seo";
import { routing } from "@/i18n/routing";

describe("localeAlternates", () => {
  // Türkçe varsayılan ve öneksiz; hreflang listesinde de öyle görünmeli.
  it("kök sayfayı üç dile ve x-default'a bağlar", () => {
    expect(localeAlternates("/")).toEqual({ tr: "/", en: "/en", fr: "/fr", "x-default": "/" });
  });

  it("alt sayfada öneki yola ekler", () => {
    expect(localeAlternates("/randevu")).toEqual({
      tr: "/randevu",
      en: "/en/randevu",
      fr: "/fr/randevu",
      "x-default": "/randevu",
    });
  });

  it("x-default varsayılan dile gider", () => {
    const alternates = localeAlternates("/randevu");
    expect(alternates["x-default"]).toBe(alternates[routing.defaultLocale]);
  });

  // Site haritasının `metadataBase`'i yok: adresler mutlak verilmek zorunda.
  it("kök adres verilince mutlak adres üretir", () => {
    expect(localeAlternates("/randevu", "https://afrosalon.example")).toEqual({
      tr: "https://afrosalon.example/randevu",
      en: "https://afrosalon.example/en/randevu",
      fr: "https://afrosalon.example/fr/randevu",
      "x-default": "https://afrosalon.example/randevu",
    });
  });

  it("her dil için bir giriş taşır", () => {
    for (const locale of routing.locales) expect(localeAlternates("/")).toHaveProperty(locale);
  });
});

describe("pageAlternates", () => {
  it("canonical sayfanın kendi dilindeki adresidir", () => {
    expect(pageAlternates("/randevu", "en").canonical).toBe("/en/randevu");
    expect(pageAlternates("/randevu", "tr").canonical).toBe("/randevu");
    expect(pageAlternates("/", "fr").canonical).toBe("/fr");
  });

  it("dil listesi dilden bağımsızdır", () => {
    expect(pageAlternates("/", "en").languages).toEqual(pageAlternates("/", "tr").languages);
  });
});

describe("PUBLIC_PATHS", () => {
  it("yalnızca herkese açık sayfaları taşır", () => {
    expect([...PUBLIC_PATHS]).toEqual(["/", "/randevu"]);
  });

  it("oturum ardındaki yollar listede yoktur", () => {
    for (const path of ["/panel", "/randevularim", "/giris", "/kayit"]) {
      expect(PUBLIC_PATHS).not.toContain(path);
    }
  });
});

describe("noIndex", () => {
  it("yalnızca dizine girmeyi kapatır", () => {
    expect(noIndex).toEqual({ robots: { index: false } });
  });
});
