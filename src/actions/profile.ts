"use server";

import { revalidatePath } from "next/cache";
import { fail, type ActionResult } from "@/lib/action-result";
import { getSessionUser } from "@/lib/auth-helpers";
import { updateOwnProfileAs, changeOwnPasswordAs } from "@/actions/impl/profile";
import type { UserProfileInput, BarberProfileInput, ChangePasswordInput } from "@/schemas/profile";

export async function updateOwnProfile(input: UserProfileInput | BarberProfileInput): Promise<ActionResult<void>> {
  const actor = await getSessionUser();
  if (!actor) return fail("Yetkiniz yok");
  const r = await updateOwnProfileAs(actor, input);
  if (r.ok) {
    revalidatePath("/panel/profil");
    revalidatePath("/");
  }
  return r;
}

export async function changeOwnPassword(input: ChangePasswordInput): Promise<ActionResult<void>> {
  const actor = await getSessionUser();
  if (!actor) return fail("Yetkiniz yok");
  return changeOwnPasswordAs(actor, input);
}
