import { z } from "zod";

export const userProfileSchema = z.object({
  name: z.string().trim().min(3, "errors.fullNameMin3").max(80),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
});
export type UserProfileInput = z.infer<typeof userProfileSchema>;

/**
 * Yüklenen berber fotoğrafı anahtarı yalnızca `createPresignedUpload`'ın
 * ürettiği biçimde olabilir: `barbers/<uuid>.<jpg|jpeg|png|webp>`. Böylece
 * berber, kendi kaydına başka bir nesnenin (ör. başka berberin fotoğrafı)
 * anahtarını yazamaz. Seed'den gelen `landing/` ve `seed/` anahtarları bu
 * desene uymaz; onlar yalnızca "mevcut anahtar aynen korunuyor" durumunda
 * kabul edilir (bkz. `updateOwnProfileAs`).
 */
export const BARBER_PHOTO_KEY_PATTERN = /^barbers\/[0-9a-f-]{36}\.(jpg|jpeg|png|webp)$/;

export function isUploadedBarberPhotoKey(key: string): boolean {
  return BARBER_PHOTO_KEY_PATTERN.test(key);
}

export const barberProfileSchema = userProfileSchema.extend({
  bio: z.string().trim().max(200).optional().or(z.literal("")),
  photoKey: z.string().min(1, "errors.photoRequired"),
});
export type BarberProfileInput = z.infer<typeof barberProfileSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "errors.currentPasswordRequired"),
  newPassword: z.string().min(8, "errors.passwordMin8").max(100),
});
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
