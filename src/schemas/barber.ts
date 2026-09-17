import { z } from "zod";

const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Saat HH:mm olmalı");

export const createBarberSchema = z.object({
  name: z.string().trim().min(3, "Ad soyad en az 3 karakter").max(80),
  email: z.string().trim().toLowerCase().email("Geçerli bir e-posta girin"),
  password: z.string().min(8, "Şifre en az 8 karakter olmalı"),
  bio: z.string().trim().max(200).optional().or(z.literal("")),
  photoKey: z.string().min(1, "Profil fotoğrafı zorunlu"),
});
export type CreateBarberInput = z.infer<typeof createBarberSchema>;

export const updateBarberSchema = z.object({
  name: z.string().trim().min(3, "Ad soyad en az 3 karakter").max(80),
  bio: z.string().trim().max(200).optional().or(z.literal("")),
  photoKey: z.string().min(1, "Profil fotoğrafı zorunlu"),
  isActive: z.coerce.boolean(),
});
export type UpdateBarberInput = z.infer<typeof updateBarberSchema>;

export const workingHoursSchema = z.object({
  days: z
    .array(
      z.object({ dayOfWeek: z.number().int().min(0).max(6), isOff: z.boolean(), startTime: hhmm, endTime: hhmm })
        .refine((d) => d.isOff || d.startTime < d.endTime, { message: "Bitiş saati başlangıçtan sonra olmalı" }),
    )
    .length(7),
});
export type WorkingHoursInput = z.infer<typeof workingHoursSchema>;
