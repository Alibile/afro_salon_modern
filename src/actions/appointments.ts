"use server";

import { getLocale } from "next-intl/server";
import { fail, type ActionResult } from "@/lib/action-result";
import { getSessionUser } from "@/lib/auth-helpers";
import { createAppointmentFor, cancelAppointmentByCustomerFor } from "@/actions/impl/appointments";
import type { CreateAppointmentInput } from "@/schemas/booking";
import { sendAppointmentConfirmed, sendAppointmentCancelled, sendNewAppointmentToBarber } from "@/lib/email/send";

/**
 * Müşteri yüzünde dil **istekten** gelir: ziyaretçi randevuyu hangi dildeki
 * sayfadan aldıysa hizmet adının anlık görüntüsü ve onay e-postası o dildedir.
 * Dil istemciden alınmaz — `getLocale()` sunucuda, next-intl'in istek
 * yapılandırmasından okunur; gövdeye yazılan bir dil kodu yok sayılır.
 */
export async function createAppointment(input: CreateAppointmentInput): Promise<ActionResult<{ id: string }>> {
  const user = await getSessionUser();
  if (!user) return fail("errors.loginRequiredToBook");
  const requestLocale = await getLocale();
  const r = await createAppointmentFor(user, new Date(), input, requestLocale);
  if (r.ok) await Promise.all([sendAppointmentConfirmed(r.data.id), sendNewAppointmentToBarber(r.data.id)]);
  return r;
}

export async function cancelAppointmentByCustomer(appointmentId: string): Promise<ActionResult<void>> {
  const user = await getSessionUser();
  if (!user) return fail("errors.loginRequired");
  const r = await cancelAppointmentByCustomerFor(user.id, new Date(), appointmentId);
  if (r.ok) await sendAppointmentCancelled(appointmentId, "CUSTOMER");
  return r;
}
