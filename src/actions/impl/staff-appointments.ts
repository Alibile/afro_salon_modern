import { prisma } from "@/lib/db";
import { ok, fail, type ActionResult } from "@/lib/action-result";
import type { SessionUser } from "@/lib/auth-helpers";
import { asStaffActor, staffScope } from "@/lib/staff-scope";

export type StaffAppointmentStatus = "COMPLETED" | "NO_SHOW" | "CANCELLED";

export async function setAppointmentStatusAs(
  actorInput: SessionUser | null,
  appointmentId: string,
  status: StaffAppointmentStatus,
): Promise<ActionResult<void>> {
  const actor = asStaffActor(actorInput);
  if (!actor) return fail("errors.notAllowed");

  const appt = await prisma.appointment.findFirst({ where: { id: appointmentId, ...staffScope(actor) } });
  if (!appt) return fail("errors.appointmentNotFound");
  if (appt.status !== "SCHEDULED") return fail("errors.appointmentStatusChanged");

  await prisma.appointment.update({
    where: { id: appt.id },
    data: { status, cancelledBy: status === "CANCELLED" ? "STAFF" : null },
  });
  return ok(undefined);
}
