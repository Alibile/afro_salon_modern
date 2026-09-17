"use server";

import { revalidatePath } from "next/cache";
import { fail, type ActionResult } from "@/lib/action-result";
import { getSessionUser } from "@/lib/auth-helpers";
import { upsertServiceAs, toggleServiceAs, deleteServiceAs } from "@/actions/impl/services";
import type { ServiceInput } from "@/schemas/service";

export async function upsertService(input: ServiceInput & { id?: string }): Promise<ActionResult<{ id: string }>> {
  const actor = await getSessionUser();
  if (!actor) return fail("Yetkiniz yok");
  const r = await upsertServiceAs(actor, input);
  if (r.ok) revalidatePath("/panel/hizmetler");
  return r;
}

export async function toggleService(id: string, isActive: boolean): Promise<ActionResult<void>> {
  const actor = await getSessionUser();
  if (!actor) return fail("Yetkiniz yok");
  const r = await toggleServiceAs(actor, id, isActive);
  if (r.ok) revalidatePath("/panel/hizmetler");
  return r;
}

export async function deleteService(id: string): Promise<ActionResult<void>> {
  const actor = await getSessionUser();
  if (!actor) return fail("Yetkiniz yok");
  const r = await deleteServiceAs(actor, id);
  if (r.ok) revalidatePath("/panel/hizmetler");
  return r;
}
