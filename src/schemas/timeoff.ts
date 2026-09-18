import { z } from "zod";
const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "errors.invalidTime");

export const timeOffSchema = z
  .object({
    barberId: z.string().min(1),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "errors.invalidDate"),
    allDay: z.boolean(),
    startTime: hhmm.optional(),
    endTime: hhmm.optional(),
    reason: z.string().trim().max(100).optional().or(z.literal("")),
  })
  .refine((v) => v.allDay || (v.startTime && v.endTime && v.startTime < v.endTime), { message: "errors.invalidTimeRange" });
export type TimeOffInput = z.infer<typeof timeOffSchema>;
