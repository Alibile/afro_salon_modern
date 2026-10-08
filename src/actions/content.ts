"use server";

import { revalidatePath } from "next/cache";
import { fail, type ActionResult } from "@/lib/action-result";
import { getSessionUser } from "@/lib/auth-helpers";
import { saveContentBlocksAs } from "@/actions/impl/content";
import type { ContentBlocksInput } from "@/schemas/content";

export async function revalidateContent() {
  revalidatePath("/[locale]", "page");
  revalidatePath("/[locale]/panel/icerik", "page");
}

export async function saveContentBlocks(input: ContentBlocksInput): Promise<ActionResult<void>> {
  const actor = await getSessionUser();
  if (!actor) return fail("errors.notAllowed");
  const r = await saveContentBlocksAs(actor, input);
  if (r.ok) await revalidateContent();
  return r;
}
