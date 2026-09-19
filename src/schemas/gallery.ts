import { z } from "zod";
import { normalizeTags, MAX_GALLERY_BATCH, MAX_TAGS, TAG_MIN_LENGTH, TAG_MAX_LENGTH } from "@/lib/gallery-utils";
import { canonicalTagAnyLocale } from "@/lib/gallery-tag-labels";
import { i18nText } from "@/lib/i18n-content";

/**
 * Galeri anahtarı ya presign ucunun ürettiği `gallery/<uuid>.<ext>` biçimindedir
 * ya da depoya değil `public/landing/` altına ait olan seed fotoğrafıdır.
 */
export const GALLERY_KEY_PATTERN = /^(gallery\/[0-9a-f-]{36}\.(jpg|jpeg|png|webp)|landing\/gallery-\d+\.jpg)$/;

export const galleryItemSchema = z.object({
  storageKey: z.string().regex(GALLERY_KEY_PATTERN, "errors.invalidPhotoKey"),
  width: z.coerce.number().int().positive("errors.invalidPhotoSize").max(20000),
  height: z.coerce.number().int().positive("errors.invalidPhotoSize").max(20000),
});
export type GalleryItemInput = z.infer<typeof galleryItemSchema>;

/**
 * Sınır artık `gallery-utils.ts`'te durur (istemci yükleyicisi de oradan okur);
 * şemayı kullanan kod alışkanlığını bozmasın diye buradan da dışa verilir.
 */
export { MAX_GALLERY_BATCH };

/**
 * Masonry, gelen oranı olduğu gibi kullanır: 1×5000 gibi bir görsel sütunu
 * tek başına metrelerce uzatırdı. Sınır geniş tutuldu (panorama ve uzun dikey
 * kadrajlar geçer), yalnızca bozuk/uç değerler elenir.
 */
const MIN_ASPECT = 0.2;
const MAX_ASPECT = 5;

export const addGalleryPhotosSchema = z
  .array(
    galleryItemSchema.refine(
      (item) => item.width / item.height >= MIN_ASPECT && item.width / item.height <= MAX_ASPECT,
      "errors.invalidAspectRatio",
    ),
  )
  .min(1, "errors.selectPhoto")
  .max(MAX_GALLERY_BATCH, "errors.tooManyPhotos");

/**
 * Virgüllü metin ya da dizi kabul eder; kırpma/tekilleştirme `normalizeTags`
 * ile yapılır.
 *
 * Serbest yazılan etiket, üç dilden birinde bir kategori adıysa anahtarına
 * indirilir: İngilizce panelde yazılan "Braids" ile Türkçe panelde seçilen
 * `braids` aynı çipe düşer, landing'de iki ayrı filtre görünmez. Aynı
 * indirgemeyi panel formu da yapıyor (`GalleryCard`), ama orada yalnızca
 * kullanıcının o anki dili var ve eylem doğrudan da çağrılabilir — şema son
 * söz olduğu için burada tekrar edilir.
 *
 * Eşleme sonrası ikinci bir `normalizeTags`: "Örgü" ile "Braids" birlikte
 * gelirse ikisi de `braids` olur, tekilleştirme ondan sonra anlam kazanır.
 */
const tagsField = z
  .union([z.string(), z.array(z.string())])
  .transform((input) => normalizeTags(normalizeTags(input).map(canonicalTagAnyLocale)))
  .refine((tags) => tags.length > 0, "errors.tagRequired")
  .refine(
    (tags) => tags.length <= MAX_TAGS && tags.every((t) => t.length >= TAG_MIN_LENGTH && t.length <= TAG_MAX_LENGTH),
    "errors.invalidTags",
  );

export const updateGalleryPhotoSchema = z.object({
  caption: i18nText({ max: 120, maxError: "errors.captionTooLong" }).optional(),
  tags: tagsField.optional(),
  sortOrder: z.coerce.number().int().min(0).max(9999).optional(),
  isActive: z.boolean().optional(),
});
export type UpdateGalleryPhotoInput = z.input<typeof updateGalleryPhotoSchema>;

export const galleryDirectionSchema = z.enum(["up", "down"]);
export type GalleryDirection = z.infer<typeof galleryDirectionSchema>;
