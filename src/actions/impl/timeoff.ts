import { prisma } from "@/lib/db";
import { ok, fail, type ActionResult } from "@/lib/action-result";
import { firstIssueKey } from "@/lib/errors";
import type { SessionUser } from "@/lib/auth-helpers";
import { asStaffActor, staffScope } from "@/lib/staff-scope";
import { addMinutes, shopDateTime } from "@/lib/time";
import { timeOffSchema, type TimeOffInput } from "@/schemas/timeoff";

export async function createTimeOffAs(actorInput: SessionUser | null, input: TimeOffInput): Promise<ActionResult<{ id: string; conflicts: number }>> {
  const actor = asStaffActor(actorInput);
  if (!actor) return fail("errors.notAllowed");
  const parsed = timeOffSchema.safeParse(input);
  if (!parsed.success) return fail(firstIssueKey(parsed.error));
  const { barberId, date, allDay, startTime, endTime, reason } = parsed.data;
  if (actor.role === "BARBER" && actor.barberId !== barberId) return fail("errors.notAllowed");

  const barber = await prisma.barber.findUnique({ where: { id: barberId } });
  if (!barber) return fail("errors.barberNotFound");

  const startsAt = allDay ? shopDateTime(date, "00:00") : shopDateTime(date, startTime!);
  const endsAt = allDay ? addMinutes(shopDateTime(date, "00:00"), 24 * 60) : shopDateTime(date, endTime!);

  const t = await prisma.timeOff.create({ data: { barberId, startsAt, endsAt, reason: reason || null } });
  const conflicts = await prisma.appointment.count({ where: { barberId, status: "SCHEDULED", startsAt: { lt: endsAt }, endsAt: { gt: startsAt } } });
  return ok({ id: t.id, conflicts });
}

export async function deleteTimeOffAs(actorInput: SessionUser | null, id: string): Promise<ActionResult<void>> {
  const actor = asStaffActor(actorInput);
  if (!actor) return fail("errors.notAllowed");
  const t = await prisma.timeOff.findFirst({ where: { id, ...staffScope(actor) } });
  if (!t) return fail("errors.timeOffNotFound");
  await prisma.timeOff.delete({ where: { id } });
  return ok(undefined);
}
