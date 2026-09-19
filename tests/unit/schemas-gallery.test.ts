import { describe, it, expect } from "vitest";
import { updateGalleryPhotoSchema } from "@/schemas/gallery";
import { MAX_TAGS } from "@/lib/gallery-utils";

/** Şemanın etiket alanını tek başına sınamak için küçük bir sarmalayıcı. */
function parseTags(tags: string | string[]) {
  return updateGalleryPhotoSchema.safeParse({ tags });
}

function tagsOf(tags: string | string[]): string[] {
  const result = parseTags(tags);
  if (!result.success) throw new Error(`beklenmeyen doğrulama hatası: ${result.error.issues[0]?.message}`);
  return result.data.tags ?? [];
}

describe("updateGalleryPhotoSchema.tags", () => {
  it("anahtarları olduğu gibi bırakır", () => {
    expect(tagsOf("braids, skin-fade")).toEqual(["braids", "skin-fade"]);
  });

  /**
   * Asıl mesele: `GalleryCard` bu indirgemeyi istemcide yapıyor, ama eylem
   * doğrudan da çağrılabiliyor. Şema son söz olduğu için aynı indirgeme
   * burada da olmalı.
   */
  it("üç dilden herhangi birindeki kategori adını anahtara çevirir", () => {
    expect(tagsOf("Braids")).toEqual(["braids"]);
    expect(tagsOf("Örgü")).toEqual(["braids"]);
    expect(tagsOf("Tresses")).toEqual(["braids"]);
    expect(tagsOf("Sakal")).toEqual(["beard"]);
    expect(tagsOf("Barbe")).toEqual(["beard"]);
  });

  it("büyük/küçük harf ve boşluk farkını yok sayar", () => {
    expect(tagsOf("  SKIN FADE ")).toEqual(["skin-fade"]);
    expect(tagsOf(["kıvırcık"])).toEqual(["curly"]);
  });

  // Aynı etiket iki dilde yazılırsa tek çip olmalı: indirgeme sonrası
  // tekilleştirme yapılmazsa landing'de "braids" iki kez sayılırdı.
  it("farklı dillerde yazılmış aynı etiketi tekilleştirir", () => {
    expect(tagsOf("Braids, Örgü, Tresses")).toEqual(["braids"]);
    expect(tagsOf(["braids", "Örgü", "beard"])).toEqual(["braids", "beard"]);
  });

  it("listede olmayan serbest etiketi yazıldığı gibi saklar", () => {
    expect(tagsOf("Dalga Deseni")).toEqual(["Dalga Deseni"]);
    expect(tagsOf("braids, Dalga Deseni")).toEqual(["braids", "Dalga Deseni"]);
  });

  it("boş etiket listesini reddeder", () => {
    const result = parseTags("  ,  ");
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0].message).toBe("errors.tagRequired");
  });

  it("sınırdan fazla etiketi reddeder", () => {
    const many = Array.from({ length: MAX_TAGS + 1 }, (_, i) => `etiket${i}`);
    const result = parseTags(many);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0].message).toBe("errors.invalidTags");
  });

  it("etiket alanı isteğe bağlıdır", () => {
    const result = updateGalleryPhotoSchema.safeParse({ isActive: false });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.tags).toBeUndefined();
  });
});
