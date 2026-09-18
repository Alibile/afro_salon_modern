"use server";

import { revalidatePath } from "next/cache";
import { ok, fail, type ActionResult } from "@/lib/action-result";
import { getSessionUser } from "@/lib/auth-helpers";
import { addHaircutPhotoAs, deleteHaircutPhotoAs } from "@/actions/impl/photos";
import type { AddHaircutPhotoInput } from "@/schemas/photo";

export async function addHaircutPhoto(input: AddHaircutPhotoInput): Promise<ActionResult<{ id: string; deletedKeys: string[] }>> {
  const actor = await getSessionUser();
  if (!actor) return fail("errors.notAllowed");
  const r = await addHaircutPhotoAs(actor, input);
  if (r.ok) revalidatePath(`/[locale]/panel/musteriler/${input.customerId}`, "page");
  return r;
}

export async function deleteHaircutPhoto(id: string): Promise<ActionResult<void>> {
  const actor = await getSessionUser();
  if (!actor) return fail("errors.notAllowed");
  const r = await deleteHaircutPhotoAs(actor, id);
  if (!r.ok) return r;
  revalidatePath(`/[locale]/panel/musteriler/${r.data.customerId}`, "page");
  return ok(undefined);
}
