import { z } from "zod";
import { i18nText } from "@/lib/i18n-content";

/** Soru en az 3, cevap en az 10 karakter; Türkçe zorunlu, çeviriler isteğe bağlı. */
export const faqItemSchema = z.object({
  id: z.string().optional(),
  question: i18nText({ max: 160, trRequired: true, min: 3, minError: "errors.faqQuestionMin3", maxError: "errors.faqQuestionMin3" }),
  answer: i18nText({ max: 600, trRequired: true, min: 10, minError: "errors.faqAnswerMin10", maxError: "errors.faqAnswerMin10" }),
  sortOrder: z.coerce.number().int().min(0).default(0),
});
export type FaqItemInput = z.input<typeof faqItemSchema>;

export const faqDirectionSchema = z.enum(["up", "down"]);
export type FaqDirection = z.infer<typeof faqDirectionSchema>;
