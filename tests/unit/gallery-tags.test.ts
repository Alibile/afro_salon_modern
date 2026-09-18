import { describe, it, expect } from "vitest";
import { GALLERY_TAGS, orderTags, splitTags } from "@/lib/gallery-tags";
import { TAG_MIN_LENGTH, TAG_MAX_LENGTH, MAX_TAGS } from "@/lib/gallery-utils";

describe("GALLERY_TAGS", () => {
  it("tekrar eden etiket içermez", () => {
    expect(new Set(GALLERY_TAGS).size).toBe(GALLERY_TAGS.length);
  });

  it("her etiket şemanın uzunluk sınırlarına uyar", () => {
    for (const tag of GALLERY_TAGS) {
      expect(tag.length).toBeGreaterThanOrEqual(TAG_MIN_LENGTH);
      expect(tag.length).toBeLessThanOrEqual(TAG_MAX_LENGTH);
      expect(tag.trim()).toBe(tag);
    }
  });

  it("fade kategorileriyle başlar: çipler önce en çok istenen kesimleri gösterir", () => {
    expect(GALLERY_TAGS.slice(0, 3)).toEqual(["Low Taper Fade", "Taper Fade", "Skin Fade"]);
  });

  it("bir fotoğrafa verilebilecek en fazla etiketten çok daha uzundur (liste seçim içindir)", () => {
    expect(GALLERY_TAGS.length).toBeGreaterThan(MAX_TAGS);
  });
});

describe("orderTags", () => {
  it("bilinen etiketleri GALLERY_TAGS sırasına dizer, girdideki sıra önemsizdir", () => {
    expect(orderTags(["Sakal", "Skin Fade", "Low Taper Fade"])).toEqual([
      "Low Taper Fade",
      "Skin Fade",
      "Sakal",
    ]);
  });

  it("listede olmayan etiketleri sona, Türkçe alfabetik sırayla koyar", () => {
    expect(orderTags(["Şekil", "Afro", "Ombre", "Taper Fade"])).toEqual([
      "Taper Fade",
      "Afro",
      "Ombre",
      "Şekil",
    ]);
  });

  it("Türkçe harf sırasını kullanır (ı < i, s < ş)", () => {
    expect(orderTags(["iki", "ılık"])).toEqual(["ılık", "iki"]);
    expect(orderTags(["şap", "sap"])).toEqual(["sap", "şap"]);
  });

  it("boş listede boş döner", () => {
    expect(orderTags([])).toEqual([]);
  });

  it("girdi dizisini değiştirmez", () => {
    const input = ["Sakal", "Afro"];
    orderTags(input);
    expect(input).toEqual(["Sakal", "Afro"]);
  });

  it("listede olmayan tek bir etiket de düşmez", () => {
    expect(orderTags(["Vintage"])).toEqual(["Vintage"]);
  });
});

describe("splitTags", () => {
  it("sabit listedeki etiketleri çip seçimine, kalanları metin alanına ayırır", () => {
    expect(splitTags(["Skin Fade", "Dalga", "Sakal"])).toEqual({
      selected: ["Skin Fade", "Sakal"],
      custom: "Dalga",
    });
  });

  it("birden çok serbest etiketi virgülle birleştirir", () => {
    expect(splitTags(["Dalga", "Desen"]).custom).toBe("Dalga, Desen");
  });

  it("kayıtlı sırayı korur (panelde etiketler yer değiştirmez)", () => {
    expect(splitTags(["Sakal", "Afro"]).selected).toEqual(["Sakal", "Afro"]);
  });

  it("etiket yoksa boş seçim ve boş metin döner", () => {
    expect(splitTags([])).toEqual({ selected: [], custom: "" });
  });
});
