import { describe, it, expect } from "vitest";
import { GALLERY_TAGS, isGalleryTag, orderTags, splitTags, tagLabel } from "@/lib/gallery-tags";
import tr from "../../messages/tr.json";
import en from "../../messages/en.json";
import fr from "../../messages/fr.json";
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
    expect(GALLERY_TAGS.slice(0, 3)).toEqual(["low-taper-fade", "taper-fade", "skin-fade"]);
  });

  it("anahtarlar dilden bağımsızdır: küçük harf, boşluksuz", () => {
    for (const tag of GALLERY_TAGS) expect(tag).toMatch(/^[a-z][a-z-]*[a-z]$/);
  });

  it("her anahtarın üç dilde de bir adı vardır", () => {
    for (const messages of [tr, en, fr]) {
      const labels = messages.gallery.tags as Record<string, string>;
      for (const tag of GALLERY_TAGS) expect(labels[tag], tag).toBeTruthy();
    }
    // Fazladan (kullanılmayan) çeviri de kalmasın.
    expect(Object.keys(tr.gallery.tags)).toEqual([...GALLERY_TAGS]);
  });

  it("Türkçe adlar Tur 4'teki görünen metinlerin aynısıdır", () => {
    expect(tr.gallery.tags["low-taper-fade"]).toBe("Low Taper Fade");
    expect(tr.gallery.tags.curly).toBe("Kıvırcık");
    expect(tr.gallery.tags.braids).toBe("Örgü");
    expect(tr.gallery.tags.beard).toBe("Sakal");
  });

  it("bir fotoğrafa verilebilecek en fazla etiketten çok daha uzundur (liste seçim içindir)", () => {
    expect(GALLERY_TAGS.length).toBeGreaterThan(MAX_TAGS);
  });
});

describe("orderTags", () => {
  it("bilinen etiketleri GALLERY_TAGS sırasına dizer, girdideki sıra önemsizdir", () => {
    expect(orderTags(["beard", "skin-fade", "low-taper-fade"])).toEqual([
      "low-taper-fade",
      "skin-fade",
      "beard",
    ]);
  });

  it("listede olmayan etiketleri sona, Türkçe alfabetik sırayla koyar", () => {
    expect(orderTags(["Şekil", "afro", "Ombre", "taper-fade"])).toEqual([
      "taper-fade",
      "afro",
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
    const input = ["beard", "afro"];
    orderTags(input);
    expect(input).toEqual(["beard", "afro"]);
  });

  it("listede olmayan tek bir etiket de düşmez", () => {
    expect(orderTags(["Vintage"])).toEqual(["Vintage"]);
  });
});

describe("splitTags", () => {
  it("sabit listedeki etiketleri çip seçimine, kalanları metin alanına ayırır", () => {
    expect(splitTags(["skin-fade", "Dalga", "beard"])).toEqual({
      selected: ["skin-fade", "beard"],
      custom: "Dalga",
    });
  });

  it("birden çok serbest etiketi virgülle birleştirir", () => {
    expect(splitTags(["Dalga", "Desen"]).custom).toBe("Dalga, Desen");
  });

  it("kayıtlı sırayı korur (panelde etiketler yer değiştirmez)", () => {
    expect(splitTags(["beard", "afro"]).selected).toEqual(["beard", "afro"]);
  });

  it("etiket yoksa boş seçim ve boş metin döner", () => {
    expect(splitTags([])).toEqual({ selected: [], custom: "" });
  });
});

describe("tagLabel", () => {
  /** `gallery.tags` ad alanına bağlı bir çevirmenin testteki karşılığı. */
  const translator = (messages: { gallery: { tags: Record<string, string> } }) =>
    ((key: string) => messages.gallery.tags[key]) as (key: (typeof GALLERY_TAGS)[number]) => string;

  it("sabit etiketi ziyaretçinin dilinde verir", () => {
    expect(tagLabel("braids", translator(tr))).toBe("Örgü");
    expect(tagLabel("braids", translator(en))).toBe("Braids");
    expect(tagLabel("braids", translator(fr))).toBe("Tresses");
  });

  it("serbest etiketi her dilde yazıldığı gibi bırakır", () => {
    expect(tagLabel("Dalga", translator(en))).toBe("Dalga");
    expect(tagLabel("Dalga", translator(fr))).toBe("Dalga");
  });
});

describe("isGalleryTag", () => {
  it("sabit listedeki anahtarı tanır, serbest etiketi tanımaz", () => {
    expect(isGalleryTag("skin-fade")).toBe(true);
    // Eski (Tur 4) görünen metin artık bir anahtar değil.
    expect(isGalleryTag("Skin Fade")).toBe(false);
    expect(isGalleryTag("Dalga")).toBe(false);
  });
});
