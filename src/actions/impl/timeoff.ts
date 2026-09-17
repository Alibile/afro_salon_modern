import { prisma } from "@/lib/db";
import { ok, fail, type ActionResult } from "@/lib/action-result";
import type { SessionUser } from "@/lib/auth-helpers";
import { asStaffActor, staffScope } from "@/lib/staff-scope";
import { addMinutes, shopDateTime } from "@/lib/time";
import { timeOffSchema, type TimeOffInput } from "@/schemas/timeoff";

export async function createTimeOffAs(actorInput: SessionUser | null, input: TimeOffInput): Promise<ActionResult<{ id: string; conflicts: number }>> {
  const actor = asStaffActor(actorInput);
  if (!actor) return fail("Yetkiniz yok");
  const parsed = timeOffSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Geçersiz bilgi");
  const { barberId, date, allDay, startTime, endTime, reason } = parsed.data;
  if (actor.role === "BARBER" && actor.barberId !== barberId) return fail("Yetkiniz yok");

  const barber = await prisma.barber.findUnique({ where: { id: barberId } });
  if (!barber) return fail("Berber bulunamadı");

  const startsAt = allDay ? shopDateTime(date, "00:00") : shopDateTime(date, startTime!);
  const endsAt = allDay ? addMinutes(shopDateTime(date, "00:00"), 24 * 60) : shopDateTime(date, endTime!);

  const t = await prisma.timeOff.create({ data: { barberId, startsAt, endsAt, reason: reason || null } });
  const conflicts = await prisma.appointment.count({ where: { barberId, status: "SCHEDULED", startsAt: { lt: endsAt }, endsAt: { gt: startsAt } } });
  return ok({ id: t.id, conflicts });
}

export async function deleteTimeOffAs(actorInput: SessionUser | null, id: string): Promise<ActionResult<void>> {
  const actor = asStaffActor(actorInput);
  if (!actor) return fail("Yetkiniz yok");
  const t = await prisma.timeOff.findFirst({ where: { id, ...staffScope(actor) } });
  if (!t) return fail("İzin bulunamadı");
  await prisma.timeOff.delete({ where: { id } });
  return ok(undefined);
}
