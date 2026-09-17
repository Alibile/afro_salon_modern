import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Ad soyad en az 2 karakter olmalı").max(80),
  email: z.string().trim().toLowerCase().email("Geçerli bir e-posta girin"),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  password: z.string().min(8, "Şifre en az 8 karakter olmalı").max(100),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Geçerli bir e-posta girin"),
  password: z.string().min(1, "Şifre gerekli"),
});
export type LoginInput = z.infer<typeof loginSchema>;
