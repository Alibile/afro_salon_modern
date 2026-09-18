/**
 * Galerinin sabit kategori listesi. Tek kaynak: landing'deki çip şeridi bu
 * sırayla dizilir, panelde etiket seçimi bu listeden yapılır, seed bu
 * listeden etiketler. Sıra alfabetik değil editoryaldır — salonun en çok
 * istenen kesimleri (fade'ler) başta durur, saç dokusu ve bakım sonra gelir.
 *
 * Liste kapalı değildir: panelden serbest etiket de yazılabilir, o etiketler
 * `orderTags` ile listenin sonuna alınır.
 */
export const GALLERY_TAGS = [
  "Low Taper Fade",
  "Taper Fade",
  "Skin Fade",
  "Buzz Cut",
  "Line-up",
  "Kıvırcık",
  "Düz Saç",
  "Kısa Saç",
  "Textured Fringe",
  "Afro",
  "Örgü",
  "Twist",
  "Sakal",
] as const;

export type GalleryTag = (typeof GALLERY_TAGS)[number];

const ORDER = new Map<string, number>(GALLERY_TAGS.map((tag, i) => [tag, i]));

/**
 * Etiketleri çip sırasına dizer: `GALLERY_TAGS` içindekiler liste sırasıyla,
 * listede olmayan (panelden serbest yazılmış) etiketler sonda Türkçe
 * alfabetik. Girdi dizisi değiştirilmez.
 */
export function orderTags(tags: string[]): string[] {
  const known: string[] = [];
  const unknown: string[] = [];
  for (const tag of tags) {
    if (ORDER.has(tag)) known.push(tag);
    else unknown.push(tag);
  }
  known.sort((a, b) => ORDER.get(a)! - ORDER.get(b)!);
  unknown.sort((a, b) => a.localeCompare(b, "tr"));
  return [...known, ...unknown];
}

/**
 * Kayıtlı etiketleri panel formunun iki alanına böler: sabit listede olanlar
 * çip grubuna, kalanlar "Diğer" metin alanına.
 */
export function splitTags(tags: string[]): { selected: string[]; custom: string } {
  return {
    selected: tags.filter((t) => ORDER.has(t)),
    custom: tags.filter((t) => !ORDER.has(t)).join(", "),
  };
}
