import { z } from "zod";
import { i18nText } from "@/lib/i18n-content";

/**
 * Berberin kısa tanıtımı üç dilde girilir; hiçbiri zorunlu değil — tanıtımı
 * olmayan berberin kartında satır hiç basılmaz (bkz. `TeamSection`).
 */
const bio = i18nText({ max: 200 });

const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "errors.invalidTime");

export const createBarberSchema = z.object({
  name: z.string().trim().min(3, "errors.fullNameMin3").max(80),
  email: z.string().trim().toLowerCase().email("errors.enterValidEmail"),
  password: z.string().min(8, "errors.passwordMin8"),
  bio,
  photoKey: z.string().min(1, "errors.photoRequired"),
});
export type CreateBarberInput = z.infer<typeof createBarberSchema>;

export const updateBarberSchema = z.object({
  name: z.string().trim().min(3, "errors.fullNameMin3").max(80),
  bio,
  photoKey: z.string().min(1, "errors.photoRequired"),
  isActive: z.boolean(),
});
export type UpdateBarberInput = z.infer<typeof updateBarberSchema>;

export const workingHoursSchema = z.object({
  days: z
    .array(
      z.object({ dayOfWeek: z.number().int().min(0).max(6), isOff: z.boolean(), startTime: hhmm, endTime: hhmm })
        .refine((d) => d.isOff || d.startTime < d.endTime, { message: "errors.endBeforeStart" }),
    )
    .length(7),
});
export type WorkingHoursInput = z.infer<typeof workingHoursSchema>;
