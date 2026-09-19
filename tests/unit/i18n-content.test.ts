import { describe, it, expect } from "vitest";
import { asI18nText, i18nText, pick, readI18nField, sameI18nText } from "@/lib/i18n-content";

describe("pick", () => {
  const field = { tr: "Saç Kesimi", en: "Haircut", fr: "Coupe de cheveux" };

  it("ziyaretçinin dilindeki metni verir", () => {
    expect(pick(field, "tr")).toBe("Saç Kesimi");
    expect(pick(field, "en")).toBe("Haircut");
    expect(pick(field, "fr")).toBe("Coupe de cheveux");
  });

  it("çeviri boş bırakılmışsa Türkçesine düşer", () => {
    expect(pick({ tr: "Saç Kesimi", en: "" }, "en")).toBe("Saç Kesimi");
    expect(pick({ tr: "Saç Kesimi", en: "   " }, "en")).toBe("Saç Kesimi");
  });

  it("çeviri hiç yoksa Türkçesine düşer", () => {
    expect(pick({ tr: "Saç Kesimi", en: "Haircut" }, "fr")).toBe("Saç Kesimi");
    expect(pick({ tr: "Saç Kesimi" }, "en")).toBe("Saç Kesimi");
  });

  it("tanınmayan dil ya da dilsiz çağrı Türkçesini verir", () => {
    expect(pick(field, "de")).toBe("Saç Kesimi");
    expect(pick(field, undefined)).toBe("Saç Kesimi");
    expect(pick(field, null)).toBe("Saç Kesimi");
  });

  it("bozuk satırda düşmez, boş metin döner", () => {
    expect(pick(null, "tr")).toBe("");
    expect(pick("düz metin", "tr")).toBe("");
    expect(pick(["a"], "tr")).toBe("");
    expect(pick({ en: "Haircut" }, "tr")).toBe("");
  });
});

describe("asI18nText", () => {
  it("yalnızca dize alanları taşır", () => {
    expect(asI18nText({ tr: "a", en: "b", fr: "c", xx: "d" })).toEqual({ tr: "a", en: "b", fr: "c" });
    expect(asI18nText({ tr: "a", en: 5 })).toEqual({ tr: "a" });
  });

  it("tanınmayan değeri boş Türkçe metne indirger", () => {
    expect(asI18nText(undefined)).toEqual({ tr: "" });
    expect(asI18nText(42)).toEqual({ tr: "" });
  });
});

describe("sameI18nText", () => {
  it("yazılmamış çeviri ile boş çeviriyi aynı sayar", () => {
    expect(sameI18nText({ tr: "a" }, { tr: "a", en: "" })).toBe(true);
  });

  it("tek harf farkını yakalar", () => {
    expect(sameI18nText({ tr: "a" }, { tr: "A" })).toBe(false);
    expect(sameI18nText({ tr: "a" }, { tr: "a", en: "b" })).toBe(false);
  });
});

describe("i18nText", () => {
  it("boş bırakılan çeviriyi hiç yazmaz", () => {
    const schema = i18nText({ max: 60 });
    expect(schema.parse({ tr: " Başlık ", en: "", fr: "   " })).toEqual({ tr: "Başlık" });
  });

  it("girilen çevirileri kırparak saklar", () => {
    const schema = i18nText({ max: 60 });
    expect(schema.parse({ tr: "Başlık", en: " Title ", fr: "Titre" })).toEqual({
      tr: "Başlık",
      en: "Title",
      fr: "Titre",
    });
  });

  it("zorunlu olmayan alanda Türkçe boş kalabilir", () => {
    expect(i18nText({ max: 60 }).parse({ tr: "" })).toEqual({ tr: "" });
  });

  it("trRequired ile Türkçe boş bırakılamaz", () => {
    const schema = i18nText({ trRequired: true, min: 2, max: 60, minError: "errors.serviceNameMin2" });
    const r = schema.safeParse({ tr: "", en: "Haircut" });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0].message).toBe("errors.serviceNameMin2");
  });

  it("uzunluk sınırı her dilde ayrı ayrı geçerlidir", () => {
    const schema = i18nText({ max: 10, maxError: "errors.captionTooLong" });
    expect(schema.safeParse({ tr: "kısa", en: "x".repeat(11) }).success).toBe(false);
    const r = schema.safeParse({ tr: "x".repeat(11) });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0].message).toBe("errors.captionTooLong");
  });

  it("alt sınır yalnızca doldurulmuş çevirilere uygulanır", () => {
    const schema = i18nText({ trRequired: true, min: 2, max: 60 });
    expect(schema.safeParse({ tr: "Saç", en: "" }).success).toBe(true);
    expect(schema.safeParse({ tr: "Saç", en: "H" }).success).toBe(false);
  });
});

describe("readI18nField", () => {
  it("panel formunun üç girdisini tek nesnede toplar", () => {
    const fd = new FormData();
    fd.set("name.tr", "Saç Kesimi");
    fd.set("name.en", "Haircut");
    expect(readI18nField(fd, "name")).toEqual({ tr: "Saç Kesimi", en: "Haircut", fr: "" });
  });
});
