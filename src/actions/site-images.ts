"use server";

import { revalidatePath } from "next/cache";
import { fail, type ActionResult } from "@/lib/action-result";
import { getSessionUser } from "@/lib/auth-helpers";
import { setSiteImageAs, clearSiteImageAs } from "@/actions/impl/site-images";
import type { SiteImageInput } from "@/schemas/site-image";

function revalidate() {
  revalidatePath("/[locale]", "page");
  revalidatePath("/[locale]/panel/icerik", "page");
}

export async function setSiteImage(input: SiteImageInput): Promise<ActionResult<void>> {
  const actor = await getSessionUser();
  if (!actor) return fail("errors.notAllowed");
  const r = await setSiteImageAs(actor, input);
  if (r.ok) revalidate();
  return r;
}

export async function clearSiteImage(slot: string): Promise<ActionResult<void>> {
  const actor = await getSessionUser();
  if (!actor) return fail("errors.notAllowed");
  const r = await clearSiteImageAs(actor, slot);
  if (r.ok) revalidate();
  return r;
}
