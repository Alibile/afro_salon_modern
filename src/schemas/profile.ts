import { z } from "zod";

export const userProfileSchema = z.object({
  name: z.string().trim().min(3, "Ad soyad en az 3 karakter").max(80),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
});
export type UserProfileInput = z.infer<typeof userProfileSchema>;

export const barberProfileSchema = userProfileSchema.extend({
  bio: z.string().trim().max(200).optional().or(z.literal("")),
  photoKey: z.string().min(1, "Profil fotoğrafı zorunlu"),
});
export type BarberProfileInput = z.infer<typeof barberProfileSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Mevcut şifre gerekli"),
  newPassword: z.string().min(8, "Şifre en az 8 karakter olmalı").max(100),
});
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
