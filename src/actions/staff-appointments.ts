"use server";

import { revalidatePath } from "next/cache";
import { fail, type ActionResult } from "@/lib/action-result";
import { getSessionUser } from "@/lib/auth-helpers";
import { sendAppointmentCancelled } from "@/lib/email/send";
import { setAppointmentStatusAs, type StaffAppointmentStatus } from "@/actions/impl/staff-appointments";

export async function setAppointmentStatus(appointmentId: string, status: StaffAppointmentStatus): Promise<ActionResult<void>> {
  const actor = await getSessionUser();
  if (!actor) return fail("Yetkiniz yok");
  const r = await setAppointmentStatusAs(actor, appointmentId, status);
  if (r.ok) {
    if (status === "CANCELLED") await sendAppointmentCancelled(appointmentId, "STAFF");
    revalidatePath("/panel");
  }
  return r;
}
