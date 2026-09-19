import tr from "../../messages/tr.json";
import en from "../../messages/en.json";
import fr from "../../messages/fr.json";
import { canonicalTag, type GalleryTag } from "@/lib/gallery-tags";

/**
 * Etiket adlarının üç dildeki tam listesi. `canonicalTag` tek bir çevirmenle
 * çalışır — panelde bu, kullanıcının o anki dilidir. Sunucu tarafında böyle bir
 * "o anki dil" yoktur: eylem doğrudan çağrılabilir, seed çalışabilir, form
 * başka bir dilde açık bir sekmeden gelebilir. Bu yüzden şema üç dile birden
 * bakar.
 *
 * Mesaj dosyaları doğrudan içe aktarılıyor; bu modül yalnızca sunucu
 * tarafındaki şemadan kullanılır (`src/schemas/gallery.ts`), istemci
 * bileşenleri `gallery-tags.ts`'in çevirmen alan sürümünü kullanmaya devam
 * eder — üç mesaj kataloğu tarayıcıya inmesin diye.
 */
const TAG_LABELS: Record<GalleryTag, string>[] = [tr.gallery.tags, en.gallery.tags, fr.gallery.tags];

const TRANSLATORS = TAG_LABELS.map((labels) => (key: GalleryTag) => labels[key]);

/**
 * Serbest yazılmış bir etiketi, dillerden **herhangi birinde** bir kategori
 * adına karşılık geliyorsa anahtarına çevirir; yoksa olduğu gibi döner.
 * "Braids", "Örgü" ve "Tresses" aynı `braids` anahtarına iner.
 */
export function canonicalTagAnyLocale(tag: string): string {
  for (const t of TRANSLATORS) {
    const key = canonicalTag(tag, t);
    if (key !== tag) return key;
  }
  return tag;
}
