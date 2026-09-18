"use server";

import { revalidatePath } from "next/cache";
import { fail, type ActionResult } from "@/lib/action-result";
import { getSessionUser } from "@/lib/auth-helpers";
import { updateSettingsAs } from "@/actions/impl/settings";
import type { SettingsInput } from "@/schemas/settings";

export async function updateSettings(input: SettingsInput): Promise<ActionResult<void>> {
  const actor = await getSessionUser();
  if (!actor) return fail("errors.notAllowed");
  const r = await updateSettingsAs(actor, input);
  if (r.ok) {
    revalidatePath("/[locale]", "page");
    revalidatePath("/[locale]/panel/ayarlar", "page");
  }
  return r;
}
