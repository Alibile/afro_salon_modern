/**
 * Galerinin saf yardımcıları: veritabanı ya da React'e bağlı değiller, bu yüzden
 * hem sunucu (doğrulama, seed) hem istemci (filtre, sayfalama, lightbox) tarafında
 * aynı davranışı verirler ve birim testlerle doğrulanırlar.
 */

/** Galeri fotoğrafının görünüm için gereken alanları; istemci bileşenleri de bu tipi kullanır. */
export type GalleryPhoto = {
  id: string;
  storageKey: string;
  caption: string;
  tags: string[];
  width: number;
  height: number;
};

/** Etiket sayısı ve uzunluk sınırları; şema ve panel yardımcı metni aynı kaynağı kullanır. */
export const MAX_TAGS = 6;
export const TAG_MIN_LENGTH = 2;
export const TAG_MAX_LENGTH = 20;
/** Landing galeride bir sayfada gösterilen fotoğraf sayısı. */
export const GALLERY_PAGE_SIZE = 12;

/** Etiket filtresi: `tag` boş/`null` ise liste olduğu gibi döner. */
export function filterByTag<T extends { tags: string[] }>(photos: T[], tag: string | null | undefined): T[] {
  if (!tag) return photos;
  return photos.filter((p) => p.tags.includes(tag));
}

/**
 * "Daha fazla göster" sayfalaması: birikimlidir — 2. sayfa ilk 24 öğeyi döner,
 * böylece gösterilen liste büyür, yerini değiştirmez.
 */
export function paginate<T>(list: T[], page: number, size: number): T[] {
  const safePage = Math.max(1, Math.trunc(page));
  return list.slice(0, safePage * size);
}

/** Lightbox'ta bir sonraki fotoğraf; sondan başa döner. */
export function nextIndex(current: number, total: number): number {
  if (total <= 0) return 0;
  return (current + 1) % total;
}

/** Lightbox'ta bir önceki fotoğraf; baştan sona döner. */
export function prevIndex(current: number, total: number): number {
  if (total <= 0) return 0;
  return (current - 1 + total) % total;
}

/**
 * Etiket girdisini (virgüllü metin ya da dizi) düzenler: kırpar, iç boşlukları
 * teke indirir, boşları atar, büyük/küçük harf farkını yok sayarak tekilleştirir
 * (ilk yazım korunur). Sayı/uzunluk sınırlarını uygulamaz; onu şema yapar.
 */
export function normalizeTags(input: string | string[]): string[] {
  const raw = Array.isArray(input) ? input : input.split(",");
  const out: string[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    const tag = item.trim().replace(/\s+/g, " ");
    if (tag === "") continue;
    const key = tag.toLocaleLowerCase("tr");
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(tag);
  }
  return out;
}
