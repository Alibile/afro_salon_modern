/**
 * Galerinin sabit kategori listesi. Tek kaynak: landing'deki çip şeridi bu
 * sırayla dizilir, panelde etiket seçimi bu listeden yapılır, seed bu
 * listeden etiketler. Sıra alfabetik değil editoryaldır — salonun en çok
 * istenen kesimleri (fade'ler) başta durur, saç dokusu ve bakım sonra gelir.
 *
 * Değerler **anahtar**tır, görünen ad değil: veritabanında, `?etiket=` adres
 * parametresinde ve panelde bu anahtarlar durur; üç dildeki karşılıkları
 * `messages/*.json` içinde `gallery.tags.<anahtar>` altında yaşar. Etiket bir
 * dilde yazılıp öbüründe okunabilsin diye böyle: "Kıvırcık" ile "Curly" aynı
 * fotoğraf kümesidir.
 *
 * Liste kapalı değildir: panelden serbest etiket de yazılabilir. Serbest
 * etiketlerin çevirisi yoktur — her dilde yazıldığı gibi görünür ve
 * `orderTags` ile listenin sonuna alınır.
 */
export const GALLERY_TAGS = [
  "low-taper-fade",
  "taper-fade",
  "skin-fade",
  "buzz-cut",
  "line-up",
  "curly",
  "straight",
  "short",
  "textured-fringe",
  "afro",
  "braids",
  "twist",
  "beard",
] as const;

export type GalleryTag = (typeof GALLERY_TAGS)[number];

const ORDER = new Map<string, number>(GALLERY_TAGS.map((tag, i) => [tag, i]));

/** Etiket sabit listeden mi (yani çevrilebilir mi), yoksa serbest yazılmış mı? */
export function isGalleryTag(tag: string): tag is GalleryTag {
  return ORDER.has(tag);
}

/**
 * Etiketin ziyaretçinin dilindeki adı. `t`, `gallery.tags` ad alanına bağlı bir
 * çevirmendir; serbest etiketlerin çevirisi olmadığı için onlar olduğu gibi
 * döner. Landing çipleri, lightbox ve panel seçicisi aynı işlevi kullanır —
 * biri ayrı bir ad üretirse aynı etiket iki farklı şey gibi görünürdü.
 */
export function tagLabel(tag: string, t: (key: GalleryTag) => string): string {
  return isGalleryTag(tag) ? t(tag) : tag;
}

/**
 * Serbest yazılmış bir etiketi, aslında bir kategori adıysa anahtarına geri
 * çevirir. İngilizce panelde "Diğer etiketler" alanına "Braids" yazan admin
 * ikinci bir çip yaratmasın diye: aynı fotoğraf hem `braids` hem "Braids"
 * taşısaydı landing'de iki ayrı filtre görünürdü.
 *
 * Anahtarın kendisi de kabul edilir ("skin-fade"). Tanınmayan etiket olduğu
 * gibi döner — serbest etiketler yazıldıkları gibi yaşar.
 *
 * Karşılaştırma Türkçeye özgü değil düz `toLowerCase` ile yapılır: Türkçe
 * kuralı büyük "I"yı "ı"ya çevirir ve "SKIN FADE" ile "Skin Fade" birbirini
 * tutmaz olurdu. Listedeki Türkçe adların hiçbiri bu farktan etkilenmiyor.
 */
export function canonicalTag(tag: string, t: (key: GalleryTag) => string): string {
  const needle = tag.trim().toLowerCase();
  if (isGalleryTag(needle)) return needle;
  for (const key of GALLERY_TAGS) {
    if (t(key).trim().toLowerCase() === needle) return key;
  }
  return tag;
}

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
