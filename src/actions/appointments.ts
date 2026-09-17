"use server";

import { prisma } from "@/lib/db";
import { ok, fail, type ActionResult } from "@/lib/action-result";
import { getSessionUser } from "@/lib/auth-helpers";
import { addMinutes } from "@/lib/time";
import { getTodayAvailability } from "@/lib/queries/booking";
import { createAppointmentSchema, type CreateAppointmentInput } from "@/schemas/booking";
import { getSettings } from "@/lib/settings";
import { sendAppointmentConfirmed, sendAppointmentCancelled, sendNewAppointmentToBarber } from "@/lib/email/send";

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
    if (!opts.now) {
      await Promise.all([sendAppointmentConfirmed(appt.id), sendNewAppointmentToBarber(appt.id)]);
    }
    return ok({ id: appt.id });
  } catch (e) {
    const isOverlapError =
      e instanceof Error &&
      (e.message.includes("appointment_no_overlap") ||
        JSON.stringify((e as { meta?: unknown }).meta ?? "").includes("appointment_no_overlap"));
    // Under genuine concurrent transactions, Postgres/Prisma can also reject
    // the losing transaction with a write-conflict/deadlock error (Prisma
    // error code P2034) rather than surfacing the exclusion constraint
    // violation directly. Both outcomes mean the same thing to the caller:
    // another booking won the race for this slot.
    const isWriteConflict = (e as { code?: string })?.code === "P2034";
    if (isOverlapError || isWriteConflict) return fail(SLOT_TAKEN);
    throw e;
  }
}

export async function cancelAppointmentByCustomer(
  appointmentId: string,
  opts: { now?: Date; customerId?: string } = {},
): Promise<ActionResult<void>> {
  const customerId = opts.customerId ?? (await getSessionUser())?.id;
  if (!customerId) return fail("Giriş yapmalısınız");
  const now = opts.now ?? new Date();

  const appt = await prisma.appointment.findFirst({ where: { id: appointmentId, customerId } });
  if (!appt) return fail("Randevu bulunamadı");
  if (appt.status !== "SCHEDULED") return fail("Bu randevu zaten iptal edilmiş veya tamamlanmış");

  const settings = await getSettings();
  const windowMs = settings.cancellationWindowMinutes * 60_000;
  if (appt.startsAt.getTime() - now.getTime() < windowMs) {
    return fail(`Randevuya ${settings.cancellationWindowMinutes} dakikadan az kaldığı için iptal edilemez, lütfen dükkanı arayın`);
  }

  await prisma.appointment.update({ where: { id: appt.id }, data: { status: "CANCELLED", cancelledBy: "CUSTOMER" } });
  if (!opts.now) await sendAppointmentCancelled(appt.id, "CUSTOMER");
  return ok(undefined);
}
