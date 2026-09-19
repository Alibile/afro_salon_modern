import { z } from "zod";
import { i18nText } from "@/lib/i18n-content";

export const serviceSchema = z.object({
  /** Üç dilli hizmet adı; Türkçe zorunlu, çeviriler isteğe bağlı. */
  name: i18nText({ trRequired: true, min: 2, max: 60, minError: "errors.serviceNameMin2" }),
  durationMinutes: z.coerce.number().int().min(5).max(480).refine((n) => n % 5 === 0, "errors.durationStep5"),
  priceLira: z.coerce.number().min(0, "errors.priceNegative").max(100000),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
});
export type ServiceInput = z.infer<typeof serviceSchema>;
