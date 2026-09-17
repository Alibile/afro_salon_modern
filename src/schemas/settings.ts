import { z } from "zod";

export const settingsSchema = z.object({
  shopName: z.string().trim().min(1, "Dükkan adı gerekli").max(60),
  address: z.string().trim().max(200),
  phone: z.string().trim().max(30),
  cancellationWindowMinutes: z.coerce.number().int().min(0).max(1440),
  minLeadMinutes: z.coerce.number().int().min(0).max(240),
  slotStepMinutes: z.coerce.number().int().refine((n) => [5, 10, 15, 20, 30, 60].includes(n), "Slot adımı 5, 10, 15, 20, 30 veya 60 olmalı"),
  notifyBarberOnBooking: z.coerce.boolean(),
});
export type SettingsInput = z.infer<typeof settingsSchema>;
