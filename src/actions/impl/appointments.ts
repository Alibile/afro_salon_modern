import { hasLocale } from "next-intl";
import { prisma } from "@/lib/db";
import { ok, fail, type ActionResult } from "@/lib/action-result";
import { firstIssueKey } from "@/lib/errors";
import { addMinutes, shopDateKey } from "@/lib/time";
import { parseBookableDate } from "@/lib/booking-window";
import { getAvailability } from "@/lib/queries/booking";
import { createAppointmentSchema, type CreateAppointmentInput } from "@/schemas/booking";
import { getSettings } from "@/lib/settings";
import { pick } from "@/lib/i18n-content";
import { routing } from "@/i18n/routing";
import type { SessionUser } from "@/lib/auth-helpers";

/**
 * Randevuyu oturumdaki müşteri adına ve verilen sunucu saatine göre oluşturur.
 * Hizmet adı satıra **randevunun alındığı dille** kopyalanır (`nameSnapshot`):
 * randevu e-postası ve "randevularım" listesi müşterinin randevuyu aldığı
 * dilde kalır, hizmet sonradan panelden yeniden adlandırılsa bile.
 *
 * Müşteri yüzünde dili **istek** belirler, kayıtlı tercih değil: müşterinin
 * panel gibi bir dil ayarı yoktur, tek sinyali hangi dildeki sayfadan randevu
 * aldığıdır. Bu yüzden `requestLocale` verilmişse hem anlık görüntüde
 * kullanılır hem de müşterinin `User.locale` sütununa yazılır — onay e-postası
 * (alıcının kayıtlı tercihiyle gider) böylece aynı dilde olur. Personel bundan
 * etkilenmez: panelden yaptığı açık tercih ve e-posta dili yerinde kalır.
 *
 * Gelen değer serbest bir dize olabileceği için `hasLocale` ile daraltılır;
 * tanınmayan değer aktörün kayıtlı diline düşer.
 */
export async function createAppointmentFor(
  actor: SessionUser,
  now: Date,
  input: CreateAppointmentInput,
  requestLocale?: string,
): Promise<ActionResult<{ id: string }>> {
  const locale = hasLocale(routing.locales, requestLocale) ? requestLocale : actor.locale;
  const parsed = createAppointmentSchema.safeParse(input);
  if (!parsed.success) return fail(firstIssueKey(parsed.error));
  const { barberId, serviceIds, startsAt: startsAtIso } = parsed.data;

  const startsAt = new Date(startsAtIso);

  // Randevu penceresi sunucuda yeniden kurulur: sihirbaz Pazarı hiç göstermez
  // ve 7 günden ötesini çizmez, ama gövdeye elle yazılan bir tarih de buradan
  // geçmek zorunda. Gün dükkanın takviminde okunur — müşterinin cihazı başka
  // bir gündeyse bile salon için hangi gün olduğu değişmez.
  const dayStart = parseBookableDate(shopDateKey(startsAt), now);
  if (!dayStart) return fail("errors.dateOutOfRange");

  const barber = await prisma.barber.findFirst({ where: { id: barberId, isActive: true } });
  if (!barber) return fail("errors.barberNotFound");

  const services = await prisma.service.findMany({ where: { id: { in: serviceIds }, isActive: true } });
  if (services.length !== new Set(serviceIds).size) return fail("errors.selectedServiceNotFound");

  const durationMinutes = services.reduce((sum, s) => sum + s.durationMinutes, 0);
  const endsAt = addMinutes(startsAt, durationMinutes);

  const { slots } = await getAvailability(barberId, durationMinutes, dayStart, now);
  if (!slots.some((s) => s.getTime() === startsAt.getTime())) return fail("errors.slotUnavailable");

  try {
    const appt = await prisma.$transaction(async (tx) => {
      const created = await tx.appointment.create({ data: { customerId: actor.id, barberId, startsAt, endsAt } });
      await tx.appointmentService.createMany({
        data: services.map((s) => ({
          appointmentId: created.id,
          serviceId: s.id,
          nameSnapshot: pick(s.nameI18n, locale),
          durationSnapshot: s.durationMinutes,
          priceSnapshot: s.priceKurus,
        })),
      });
      if (actor.role === "CUSTOMER" && actor.locale !== locale) {
        await tx.user.update({ where: { id: actor.id }, data: { locale } });
      }
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
