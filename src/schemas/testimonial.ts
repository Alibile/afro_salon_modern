import { z } from "zod";

export const testimonialSchema = z.object({
  name: z.string().trim().min(2, "errors.nameMin2").max(60),
  text: z.string().trim().min(10, "errors.testimonialTooShort").max(400),
  rating: z.coerce.number().int().min(1, "errors.ratingRange").max(5, "errors.ratingRange"),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
});
export type TestimonialInput = z.infer<typeof testimonialSchema>;
