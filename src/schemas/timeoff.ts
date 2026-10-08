import { z } from "zod";
const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "errors.invalidTime");
const ymd = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "errors.invalidDate");

/** Tek kayıtta en çok bu kadar gün: bir tatil için yeter, yanlış yıl girilen bir bitiş tarihini yakalar. */
export const MAX_TIME_OFF_DAYS = 60;

/** İki gün anahtarının farkı (gün). Anahtarlar takvim günü olduğu için UTC ile sayılır, yaz saati karışmaz. */
function dayDiff(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

/**
 * İzin tek gün (tüm gün ya da saatli) ya da tarih aralığı olabilir. Aralık
 * `endDate` ile verilir; boş dize "yok" sayılır. Aralık yalnızca tüm gün
 * izinde anlamlıdır: üç gün boyunca 12:00–15:00 gibi tekrarlı izin bu
 * modelde yok, her gün ayrı girilir.
 */
export const timeOffSchema = z
  .object({
    barberId: z.string().min(1),
    date: ymd,
    endDate: z
      .string()
      .optional()
      .transform((v) => (v && v.trim() !== "" ? v.trim() : undefined))
      .pipe(ymd.optional()),
    allDay: z.boolean(),
    startTime: hhmm.optional(),
    endTime: hhmm.optional(),
    reason: z.string().trim().max(100).optional().or(z.literal("")),
  })
  .refine((v) => v.allDay || (v.startTime && v.endTime && v.startTime < v.endTime), { message: "errors.invalidTimeRange" })
  .refine((v) => v.endDate === undefined || v.allDay, { message: "errors.rangeNeedsAllDay" })
  .refine((v) => v.endDate === undefined || dayDiff(v.date, v.endDate) >= 0, { message: "errors.endBeforeStart" })
  .refine((v) => v.endDate === undefined || dayDiff(v.date, v.endDate) <= MAX_TIME_OFF_DAYS, { message: "errors.rangeTooLong" });
export type TimeOffInput = z.infer<typeof timeOffSchema>;
