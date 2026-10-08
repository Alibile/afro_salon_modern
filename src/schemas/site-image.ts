import { z } from "zod";

/**
 * Üç yuva ve her birinin en küçük genişliği ile kabul edilen en/boy oranı
 * aralığı. Hero 3:2 ve telefon hero 4:5 kadraja yakın olmalı: metin katmanı
 * ve karartma o oranlara göre kurulu. Hakkımızda fotoğrafı serbest.
 */
export const SITE_IMAGE_SLOTS = {
  hero: { minWidth: 1600, aspect: [1.3, 1.7] as const, label: "3:2" },
  heroMobile: { minWidth: 1000, aspect: [0.7, 0.9] as const, label: "4:5" },
  about: { minWidth: 1000, aspect: [0.5, 2] as const, label: "serbest" },
} as const;
export type SiteImageSlot = keyof typeof SITE_IMAGE_SLOTS;
export const SITE_IMAGE_SLOT_LIST = Object.keys(SITE_IMAGE_SLOTS) as SiteImageSlot[];

export const siteImageSlotSchema = z.enum(["hero", "heroMobile", "about"], { error: "errors.invalidImageSlot" });

/** Depo anahtarı: R2'de `site/<uuid>.<ext>`, yerel diskte `uploads/site/<uuid>.<ext>`. */
const KEY_PATTERN = /^(uploads\/)?site\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$/;

export const siteImageSchema = z
  .object({
    slot: siteImageSlotSchema,
    storageKey: z.string().regex(KEY_PATTERN, "errors.invalidPhotoKey"),
    width: z.coerce.number().int().positive("errors.invalidPhotoSize").max(20000),
    height: z.coerce.number().int().positive("errors.invalidPhotoSize").max(20000),
  })
  .refine((v) => v.width >= SITE_IMAGE_SLOTS[v.slot].minWidth, "errors.imageTooSmall")
  .refine((v) => {
    const [min, max] = SITE_IMAGE_SLOTS[v.slot].aspect;
    const ratio = v.width / v.height;
    return ratio >= min && ratio <= max;
  }, "errors.invalidAspectRatio");
export type SiteImageInput = z.input<typeof siteImageSchema>;
