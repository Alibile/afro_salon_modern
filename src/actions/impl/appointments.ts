import { prisma } from "@/lib/db";
import { ok, fail, type ActionResult } from "@/lib/action-result";
import { firstIssueKey } from "@/lib/errors";
import { addMinutes } from "@/lib/time";
import { getTodayAvailability } from "@/lib/queries/booking";
import { createAppointmentSchema, type CreateAppointmentInput } from "@/schemas/booking";
import { getSettings } from "@/lib/settings";

/** Randevuyu verilen müşteri adına ve verilen sunucu saatine göre oluşturur. */
export async function createAppointmentFor(
  customerId: string,
  now: Date,
  input: CreateAppointmentInput,
): Promise<ActionResult<{ id: string }>> {
  const parsed = createAppointmentSchema.safeParse(input);
  if (!parsed.success) return fail(firstIssueKey(parsed.error));
  const { barberId, serviceIds, startsAt: startsAtIso } = parsed.data;

  const startsAt = new Date(startsAtIso);

  const barber = await prisma.barber.findFirst({ where: { id: barberId, isActive: true } });
  if (!barber) return fail("errors.barberNotFound");

  const services = await prisma.service.findMany({ where: { id: { in: serviceIds }, isActive: true } });
  if (services.length !== new Set(serviceIds).size) return fail("errors.selectedServiceNotFound");

  const durationMinutes = services.reduce((sum, s) => sum + s.durationMinutes, 0);
  const endsAt = addMinutes(startsAt, durationMinutes);

  const { slots } = await getTodayAvailability(barberId, durationMinutes, now);
  if (!slots.some((s) => s.getTime() === startsAt.getTime())) return fail("errors.slotUnavailable");

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
    // Under genuine concurrent transactions, Postgres/Prisma can also reject
    // the losing transaction with a write-conflict/deadlock error (Prisma
    // error code P2034) rather than surfacing the exclusion constraint
    // violation directly. Both outcomes mean the same thing to the caller:
    // another booking won the race for this slot.
    const isWriteConflict = (e as { code?: string })?.code === "P2034";
    if (isOverlapError || isWriteConflict) return fail("errors.slotTaken");
    throw e;
  }
}

/** Randevuyu yalnızca sahibi olan müşteri adına iptal eder. */
export async function cancelAppointmentByCustomerFor(
  customerId: string,
  now: Date,
  appointmentId: string,
): Promise<ActionResult<void>> {
  const appt = await prisma.appointment.findFirst({ where: { id: appointmentId, customerId } });
  if (!appt) return fail("errors.appointmentNotFound");
  if (appt.status !== "SCHEDULED") return fail("errors.appointmentNotScheduled");

  const settings = await getSettings();
  const windowMs = settings.cancellationWindowMinutes * 60_000;
  if (appt.startsAt.getTime() - now.getTime() < windowMs) {
    return fail("errors.cancelWindow", { minutes: settings.cancellationWindowMinutes });
  }

  await prisma.appointment.update({ where: { id: appt.id }, data: { status: "CANCELLED", cancelledBy: "CUSTOMER" } });
  return ok(undefined);
}
