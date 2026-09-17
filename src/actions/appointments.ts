"use server";

import { prisma } from "@/lib/db";
import { ok, fail, type ActionResult } from "@/lib/action-result";
import { getSessionUser } from "@/lib/auth-helpers";
import { addMinutes } from "@/lib/time";
import { getTodayAvailability } from "@/lib/queries/booking";
import { createAppointmentSchema, type CreateAppointmentInput } from "@/schemas/booking";

const SLOT_TAKEN = "Bu saat az önce doldu, lütfen başka bir saat seçin";
const SLOT_INVALID = "Bu saat artık uygun değil, lütfen başka bir saat seçin";

export async function createAppointment(
  input: CreateAppointmentInput,
  opts: { now?: Date; customerId?: string } = {},
): Promise<ActionResult<{ id: string }>> {
  const parsed = createAppointmentSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Geçersiz bilgi");
  const { barberId, serviceIds, startsAt: startsAtIso } = parsed.data;

  const customerId = opts.customerId ?? (await getSessionUser())?.id;
  if (!customerId) return fail("Randevu almak için giriş yapmalısınız");

  const now = opts.now ?? new Date();
  const startsAt = new Date(startsAtIso);

  const barber = await prisma.barber.findFirst({ where: { id: barberId, isActive: true } });
  if (!barber) return fail("Berber bulunamadı");

  const services = await prisma.service.findMany({ where: { id: { in: serviceIds }, isActive: true } });
  if (services.length !== new Set(serviceIds).size) return fail("Seçilen hizmet bulunamadı");

  const durationMinutes = services.reduce((sum, s) => sum + s.durationMinutes, 0);
  const endsAt = addMinutes(startsAt, durationMinutes);

  const { slots } = await getTodayAvailability(barberId, durationMinutes, now);
  if (!slots.some((s) => s.getTime() === startsAt.getTime())) return fail(SLOT_INVALID);

  try {
    const appt = await prisma.$transaction(async (tx) => {
      const created = await tx.appointment.create({ data: { customerId, barberId, startsAt, endsAt } });
      await tx.appointmentService.createMany({
        data: services.map((s) => ({
          appointmentId: created.id,
          serviceId: s.id,
          nameSnapshot: s.name,
          durationSnapshot: s.durationMinutes,
          priceSnapshot: s.priceKurus,
        })),
      });
      return created;
    });
    return ok({ id: appt.id });
  } catch (e) {
    const isOverlapError =
      e instanceof Error &&
      (e.message.includes("appointment_no_overlap") ||
        JSON.stringify((e as { meta?: unknown }).meta ?? "").includes("appointment_no_overlap"));
    if (isOverlapError) return fail(SLOT_TAKEN);
    throw e;
  }
}
