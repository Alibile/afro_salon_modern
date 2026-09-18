"use server";

import { revalidatePath } from "next/cache";
import { fail, type ActionResult } from "@/lib/action-result";
import { getSessionUser } from "@/lib/auth-helpers";
import { createBarberAs, updateBarberAs, saveWorkingHoursAs, resetBarberPasswordAs, deleteBarberAs } from "@/actions/impl/barbers";
import type { CreateBarberInput, UpdateBarberInput, WorkingHoursInput } from "@/schemas/barber";

export async function createBarber(input: CreateBarberInput): Promise<ActionResult<{ barberId: string }>> {
  const actor = await getSessionUser();
  if (!actor) return fail("errors.notAllowed");
  const r = await createBarberAs(actor, input);
  if (r.ok) revalidatePath("/[locale]/panel/berberler", "page");
  return r;
}

export async function updateBarber(barberId: string, input: UpdateBarberInput): Promise<ActionResult<void>> {
  const actor = await getSessionUser();
  if (!actor) return fail("errors.notAllowed");
  const r = await updateBarberAs(actor, barberId, input);
  if (r.ok) revalidatePath("/[locale]/panel/berberler", "page");
  return r;
}

export async function saveWorkingHours(barberId: string, input: WorkingHoursInput): Promise<ActionResult<void>> {
  const actor = await getSessionUser();
  if (!actor) return fail("errors.notAllowed");
  const r = await saveWorkingHoursAs(actor, barberId, input);
  if (r.ok) revalidatePath(`/[locale]/panel/berberler/${barberId}`, "page");
  return r;
}

export async function resetBarberPassword(barberId: string, newPassword: string): Promise<ActionResult<void>> {
  const actor = await getSessionUser();
  if (!actor) return fail("errors.notAllowed");
  return resetBarberPasswordAs(actor, barberId, newPassword);
}

export async function deleteBarber(barberId: string): Promise<ActionResult<void>> {
  const actor = await getSessionUser();
  if (!actor) return fail("errors.notAllowed");
  const r = await deleteBarberAs(actor, barberId);
  if (r.ok) revalidatePath("/[locale]/panel/berberler", "page");
  return r;
}
