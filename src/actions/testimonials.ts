"use server";

import { revalidatePath } from "next/cache";
import { fail, type ActionResult } from "@/lib/action-result";
import { getSessionUser } from "@/lib/auth-helpers";
import { upsertTestimonialAs, toggleTestimonialAs, deleteTestimonialAs } from "@/actions/impl/testimonials";
import type { TestimonialInput } from "@/schemas/testimonial";

export async function upsertTestimonial(input: TestimonialInput & { id?: string }): Promise<ActionResult<{ id: string }>> {
  const actor = await getSessionUser();
  if (!actor) return fail("Yetkiniz yok");
  const r = await upsertTestimonialAs(actor, input);
  if (r.ok) {
    revalidatePath("/");
    revalidatePath("/panel/yorumlar");
  }
  return r;
}

export async function toggleTestimonial(id: string, isActive: boolean): Promise<ActionResult<void>> {
  const actor = await getSessionUser();
  if (!actor) return fail("Yetkiniz yok");
  const r = await toggleTestimonialAs(actor, id, isActive);
  if (r.ok) {
    revalidatePath("/");
    revalidatePath("/panel/yorumlar");
  }
  return r;
}

export async function deleteTestimonial(id: string): Promise<ActionResult<void>> {
  const actor = await getSessionUser();
  if (!actor) return fail("Yetkiniz yok");
  const r = await deleteTestimonialAs(actor, id);
  if (r.ok) {
    revalidatePath("/");
    revalidatePath("/panel/yorumlar");
  }
  return r;
}
