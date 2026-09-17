"use server";

import { revalidatePath } from "next/cache";
import { ok, fail, type ActionResult } from "@/lib/action-result";
import { getSessionUser } from "@/lib/auth-helpers";
import { addHaircutPhotoAs, deleteHaircutPhotoAs, type AddHaircutPhotoInput } from "@/actions/impl/photos";

export async function addHaircutPhoto(input: AddHaircutPhotoInput): Promise<ActionResult<{ id: string; deletedKeys: string[] }>> {
  const actor = await getSessionUser();
  if (!actor) return fail("Yetkiniz yok");
  const r = await addHaircutPhotoAs(actor, input);
  if (r.ok) revalidatePath(`/panel/musteriler/${input.customerId}`);
  return r;
}

export async function deleteHaircutPhoto(id: string): Promise<ActionResult<void>> {
  const actor = await getSessionUser();
  if (!actor) return fail("Yetkiniz yok");
  const r = await deleteHaircutPhotoAs(actor, id);
  if (!r.ok) return r;
  revalidatePath(`/panel/musteriler/${r.data.customerId}`);
  return ok(undefined);
}
