import { prisma } from "@/lib/db";
import { ok, fail, type ActionResult } from "@/lib/action-result";
import type { SessionUser } from "@/lib/auth-helpers";
import { asAdminActor } from "@/lib/staff-scope";
import { testimonialSchema, type TestimonialInput } from "@/schemas/testimonial";

export async function upsertTestimonialAs(actor: SessionUser | null, input: TestimonialInput & { id?: string }): Promise<ActionResult<{ id: string }>> {
  if (!asAdminActor(actor)) return fail("Yetkiniz yok");
  const parsed = testimonialSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Geçersiz bilgi");
  const data = { name: parsed.data.name, text: parsed.data.text, rating: parsed.data.rating, sortOrder: parsed.data.sortOrder };
  if (input.id) {
    const existing = await prisma.testimonial.findUnique({ where: { id: input.id } });
    if (!existing) return fail("Yorum bulunamadı");
  }
  const t = input.id
    ? await prisma.testimonial.update({ where: { id: input.id }, data })
    : await prisma.testimonial.create({ data });
  return ok({ id: t.id });
}

export async function toggleTestimonialAs(actor: SessionUser | null, id: string, isActive: boolean): Promise<ActionResult<void>> {
  if (!asAdminActor(actor)) return fail("Yetkiniz yok");
  const existing = await prisma.testimonial.findUnique({ where: { id } });
  if (!existing) return fail("Yorum bulunamadı");
  await prisma.testimonial.update({ where: { id }, data: { isActive } });
  return ok(undefined);
}

export async function deleteTestimonialAs(actor: SessionUser | null, id: string): Promise<ActionResult<void>> {
  if (!asAdminActor(actor)) return fail("Yetkiniz yok");
  const existing = await prisma.testimonial.findUnique({ where: { id } });
  if (!existing) return fail("Yorum bulunamadı");
  await prisma.testimonial.delete({ where: { id } });
  return ok(undefined);
}
