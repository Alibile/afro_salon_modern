import { z } from "zod";

export const serviceSchema = z.object({
  name: z.string().trim().min(2, "Hizmet adı en az 2 karakter").max(60),
  durationMinutes: z.coerce.number().int().min(5).max(480).refine((n) => n % 5 === 0, "Süre 5'in katı olmalı"),
  priceLira: z.coerce.number().min(0, "Fiyat negatif olamaz").max(100000),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
});
export type ServiceInput = z.infer<typeof serviceSchema>;
