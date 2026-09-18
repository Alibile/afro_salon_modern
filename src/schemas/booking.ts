import { z } from "zod";

export const createAppointmentSchema = z.object({
  barberId: z.string().min(1),
  serviceIds: z.array(z.string().min(1)).min(1, "errors.selectService").max(10),
  startsAt: z.iso.datetime({ message: "errors.invalidDateTime" }),
});
export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
