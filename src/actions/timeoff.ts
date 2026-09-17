"use server";

import { revalidatePath } from "next/cache";
import { fail, type ActionResult } from "@/lib/action-result";
import { getSessionUser } from "@/lib/auth-helpers";
import { createTimeOffAs, deleteTimeOffAs } from "@/actions/impl/timeoff";
import type { TimeOffInput } from "@/schemas/timeoff";

export async function createTimeOff(input: TimeOffInput): Promise<ActionResult<{ id: string; conflicts: number }>> {
  const actor = await getSessionUser();
  if (!actor) return fail("Yetkiniz yok");
  const r = await createTimeOffAs(actor, input);
  if (r.ok) revalidatePath("/panel/izinler");
  return r;
}

export async function deleteTimeOff(id: string): Promise<ActionResult<void>> {
  const actor = await getSessionUser();
  if (!actor) return fail("Yetkiniz yok");
  const r = await deleteTimeOffAs(actor, id);
  if (r.ok) revalidatePath("/panel/izinler");
  return r;
}
