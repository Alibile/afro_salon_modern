import { z } from "zod";

export const serviceSchema = z.object({
  name: z.string().trim().min(2, "errors.serviceNameMin2").max(60),
  durationMinutes: z.coerce.number().int().min(5).max(480).refine((n) => n % 5 === 0, "errors.durationStep5"),
  priceLira: z.coerce.number().min(0, "errors.priceNegative").max(100000),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
});
export type ServiceInput = z.infer<typeof serviceSchema>;
