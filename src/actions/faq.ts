"use server";

import { revalidatePath } from "next/cache";
import { fail, type ActionResult } from "@/lib/action-result";
import { getSessionUser } from "@/lib/auth-helpers";
import { upsertFaqItemAs, toggleFaqItemAs, moveFaqItemAs, deleteFaqItemAs } from "@/actions/impl/faq";
import type { FaqItemInput, FaqDirection } from "@/schemas/faq";

function revalidate() {
  revalidatePath("/[locale]", "page");
  revalidatePath("/[locale]/panel/icerik", "page");
}

export async function upsertFaqItem(input: FaqItemInput): Promise<ActionResult<{ id: string }>> {
  const actor = await getSessionUser();
  if (!actor) return fail("errors.notAllowed");
  const r = await upsertFaqItemAs(actor, input);
  if (r.ok) revalidate();
  return r;
}

export async function toggleFaqItem(id: string, isActive: boolean): Promise<ActionResult<void>> {
  const actor = await getSessionUser();
  if (!actor) return fail("errors.notAllowed");
  const r = await toggleFaqItemAs(actor, id, isActive);
  if (r.ok) revalidate();
  return r;
}

export async function moveFaqItem(id: string, direction: FaqDirection): Promise<ActionResult<void>> {
  const actor = await getSessionUser();
  if (!actor) return fail("errors.notAllowed");
  const r = await moveFaqItemAs(actor, id, direction);
  if (r.ok) revalidate();
  return r;
}

export async function deleteFaqItem(id: string): Promise<ActionResult<void>> {
  const actor = await getSessionUser();
  if (!actor) return fail("errors.notAllowed");
  const r = await deleteFaqItemAs(actor, id);
  if (r.ok) revalidate();
  return r;
}
