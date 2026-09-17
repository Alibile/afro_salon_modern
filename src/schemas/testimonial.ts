import { z } from "zod";

export const testimonialSchema = z.object({
  name: z.string().trim().min(2, "Ad en az 2 karakter").max(60),
  text: z.string().trim().min(10, "Yorum en az 10 karakter").max(400),
  rating: z.coerce.number().int().min(1, "Puan 1-5 arası olmalı").max(5, "Puan 1-5 arası olmalı"),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
});
export type TestimonialInput = z.infer<typeof testimonialSchema>;
