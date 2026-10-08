import { describe, it, expect } from "vitest";
import { CONTENT_KEYS, isContentKey, type ContentKey } from "@/lib/content-keys";
import { fillPlaceholders, siteText, toContentMap } from "@/lib/content";
import tr from "../../messages/tr.json";
import en from "../../messages/en.json";
import fr from "../../messages/fr.json";

type Tree = { [key: string]: string | Tree };
const read = (tree: Tree, path: string) => path.split(".").reduce<unknown>((node, key) => (node as Tree)?.[key], tree);

/**
 * Panelden girilen metin (ziyaretçinin dili → Türkçe) çeviri dosyasının
 * önüne geçer; hiçbiri yoksa çeviri metni (`fallback`) basılır.
 */
describe("siteText", () => {
  const blocks = toContentMap([{ key: "hero.headline1", textI18n: { tr: "Türkçe manşet" } }, { key: "hero.subtitle", textI18n: { tr: "", en: "Only English" } }]);

  it("tablo boşken çeviri metnine düşer (Review Focus 1)", () => {
    expect(siteText({}, "hero.headline1", "tr", "Çeviri")).toBe("Çeviri");
    expect(siteText({}, "hero.headline1", "en", "Translation")).toBe("Translation");
  });

  it("yalnızca Türkçe girildiyse İngilizce ziyaretçi de Türkçeyi görür (Review Focus 2)", () => {
    expect(siteText(blocks, "hero.headline1", "en", "Translation")).toBe("Türkçe manşet");
    expect(siteText(blocks, "hero.headline1", "tr", "Çeviri")).toBe("Türkçe manşet");
  });

  it("Türkçe boş, yalnızca İngilizce doluysa: İngilizce ziyaretçi onu görür, Türk ziyaretçi çeviriye düşer", () => {
    expect(siteText(blocks, "hero.subtitle", "en", "Translation")).toBe("Only English");
    expect(siteText(blocks, "hero.subtitle", "tr", "Çeviri")).toBe("Çeviri");
  });

  it("toContentMap bilinmeyen anahtarı atar, bozuk değeri boş Türkçeye indirger", () => {
    const map = toContentMap([{ key: "yok.boyle", textI18n: { tr: "x" } }, { key: "faq.title", textI18n: null }]);
    expect(Object.keys(map)).toEqual(["faq.title"]);
    expect(map["faq.title"]).toEqual({ tr: "" });
  });
});

describe("fillPlaceholders", () => {
  it("bilinen adları yazar, bilinmeyeni olduğu gibi bırakır (Review Focus 3)", () => {
    expect(fillPlaceholders("En geç {minutes} dk kala; {open}–{close}", { minutes: 120, open: "11:00", close: "22:30" })).toBe("En geç 120 dk kala; 11:00–22:30");
    expect(fillPlaceholders("Fiyat {fiyat} ve {price}", { price: "700 ₺" })).toBe("Fiyat {fiyat} ve 700 ₺");
    expect(fillPlaceholders("Düz metin", {})).toBe("Düz metin");
  });
});

describe("CONTENT_KEYS", () => {
  it("her anahtarın çeviri karşılığı üç dilde var ve üst sınır pozitif", () => {
    for (const [key, def] of Object.entries(CONTENT_KEYS)) {
      for (const [locale, tree] of Object.entries({ tr, en, fr })) {
        const value = read(tree as Tree, def.message);
        expect(typeof value, `${locale}: ${key} → ${def.message}`).toBe("string");
      }
      expect(def.max).toBeGreaterThan(0);
    }
  });

  it("isContentKey yalnızca listedekileri kabul eder", () => {
    expect(isContentKey("hero.headline1")).toBe(true);
    expect(isContentKey("hero.scroll")).toBe(false);
    const k: ContentKey = "footer.tagline";
    expect(CONTENT_KEYS[k].message).toBe("footer.tagline");
  });
});
