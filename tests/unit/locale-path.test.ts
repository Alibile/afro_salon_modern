import { describe, it, expect } from "vitest";
import { stripLocale, withLocale } from "@/lib/locale-path";

describe("stripLocale", () => {
  it("önekli yolu dile ve yola ayırır", () => {
    expect(stripLocale("/en/panel")).toEqual({ locale: "en", path: "/panel" });
    expect(stripLocale("/fr/panel/berberler/abc")).toEqual({ locale: "fr", path: "/panel/berberler/abc" });
  });

  it("dil kökünü '/' yoluna indirir", () => {
    expect(stripLocale("/en")).toEqual({ locale: "en", path: "/" });
    expect(stripLocale("/fr")).toEqual({ locale: "fr", path: "/" });
  });

  it("öneksiz yolu varsayılan dile bağlar", () => {
    expect(stripLocale("/")).toEqual({ locale: "tr", path: "/" });
    expect(stripLocale("/randevu")).toEqual({ locale: "tr", path: "/randevu" });
  });

  // Türkçe öneksizdir: "/tr/..." diye bir adres yoktur, o yüzden soyulmaz.
  it("varsayılan dilin adını önek saymaz", () => {
    expect(stripLocale("/tr/panel")).toEqual({ locale: "tr", path: "/tr/panel" });
  });

  // Dil kodlarıyla başlayan gerçek yollar kazara soyulmamalı.
  it("yalnızca tam segment eşleşmesini soyar", () => {
    expect(stripLocale("/energie")).toEqual({ locale: "tr", path: "/energie" });
    expect(stripLocale("/frankfurt")).toEqual({ locale: "tr", path: "/frankfurt" });
  });

  it("bilinmeyen dil önekine dokunmaz", () => {
    expect(stripLocale("/de/panel")).toEqual({ locale: "tr", path: "/de/panel" });
  });
});

describe("withLocale", () => {
  it("varsayılan dilde yolu olduğu gibi bırakır", () => {
    expect(withLocale("tr", "/panel")).toBe("/panel");
    expect(withLocale("tr", "/")).toBe("/");
  });

  it("diğer dillerde önek ekler", () => {
    expect(withLocale("en", "/panel")).toBe("/en/panel");
    expect(withLocale("fr", "/giris")).toBe("/fr/giris");
  });

  it("kökte sondaki eğik çizgiyi bırakmaz", () => {
    expect(withLocale("en", "/")).toBe("/en");
  });

  it("stripLocale ile gidiş dönüş aynı adresi verir", () => {
    for (const url of ["/", "/randevu", "/en", "/en/panel", "/fr/randevularim"]) {
      const { locale, path } = stripLocale(url);
      expect(withLocale(locale, path)).toBe(url);
    }
  });
});
