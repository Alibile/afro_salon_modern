import { z } from "zod";
import { normalizeTags, MAX_TAGS, TAG_MIN_LENGTH, TAG_MAX_LENGTH } from "@/lib/gallery-utils";

/**
 * Galeri anahtarı ya presign ucunun ürettiği `gallery/<uuid>.<ext>` biçimindedir
 * ya da depoya değil `public/landing/` altına ait olan seed fotoğrafıdır.
 */
export const GALLERY_KEY_PATTERN = /^(gallery\/[0-9a-f-]{36}\.(jpg|jpeg|png|webp)|landing\/gallery-\d+\.jpg)$/;

export const TAGS_ERROR = `Etiketler ${TAG_MIN_LENGTH}–${TAG_MAX_LENGTH} karakter, en fazla ${MAX_TAGS}`;

export const galleryItemSchema = z.object({
  storageKey: z.string().regex(GALLERY_KEY_PATTERN, "Geçersiz fotoğraf anahtarı"),
  width: z.coerce.number().int().positive("Fotoğraf boyutu okunamadı").max(20000),
  height: z.coerce.number().int().positive("Fotoğraf boyutu okunamadı").max(20000),
});
export type GalleryItemInput = z.infer<typeof galleryItemSchema>;

export const addGalleryPhotosSchema = z
  .array(galleryItemSchema)
  .min(1, "En az bir fotoğraf seçin")
  .max(24, "Tek seferde en fazla 24 fotoğraf yüklenebilir");

/** Virgüllü metin ya da dizi kabul eder; kırpma/tekilleştirme `normalizeTags` ile yapılır. */
const tagsField = z
  .union([z.string(), z.array(z.string())])
  .transform(normalizeTags)
  .refine((tags) => tags.length > 0, "En az bir etiket girin")
  .refine(
    (tags) => tags.length <= MAX_TAGS && tags.every((t) => t.length >= TAG_MIN_LENGTH && t.length <= TAG_MAX_LENGTH),
    TAGS_ERROR,
  );

export const updateGalleryPhotoSchema = z.object({
  caption: z.string().trim().max(120, "Başlık en fazla 120 karakter").optional(),
  tags: tagsField.optional(),
  sortOrder: z.coerce.number().int().min(0).max(9999).optional(),
  isActive: z.boolean().optional(),
});
export type UpdateGalleryPhotoInput = z.input<typeof updateGalleryPhotoSchema>;

export const galleryDirectionSchema = z.enum(["up", "down"]);
export type GalleryDirection = z.infer<typeof galleryDirectionSchema>;
