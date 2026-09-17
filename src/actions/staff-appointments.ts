"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { ok, fail, type ActionResult } from "@/lib/action-result";
import { getSessionUser, type SessionUser } from "@/lib/auth-helpers";
import { sendAppointmentCancelled } from "@/lib/email/send";

import { staffScope } from "@/lib/staff-scope";

async function resolveActor(actor?: SessionUser): Promise<SessionUser | null> {
  const u = actor ?? (await getSessionUser());
  if (!u || (u.role !== "BARBER" && u.role !== "ADMIN")) return null;
  return u;
}

export async function setAppointmentStatus(
  appointmentId: string,
  status: "COMPLETED" | "NO_SHOW" | "CANCELLED",
  opts: { actor?: SessionUser; now?: Date } = {},
): Promise<ActionResult<void>> {
  const actor = await resolveActor(opts.actor);
  if (!actor) return fail("Yetkiniz yok");

  const appt = await prisma.appointment.findFirst({ where: { id: appointmentId, ...staffScope(actor) } });
  if (!appt) return fail("Randevu bulunamadı");
  if (appt.status !== "SCHEDULED") return fail("Bu randevunun durumu zaten değiştirilmiş");

  await prisma.appointment.update({
    where: { id: appt.id },
    data: { status, cancelledBy: status === "CANCELLED" ? "STAFF" : null },
  });
  if (status === "CANCELLED" && !opts.now) await sendAppointmentCancelled(appt.id, "STAFF");
  if (!opts.now) revalidatePath("/panel");
  return ok(undefined);
}
