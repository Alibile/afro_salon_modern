import { prisma } from "@/lib/db";
import { ok, fail, type ActionResult } from "@/lib/action-result";
import { firstIssueKey } from "@/lib/errors";
import type { SessionUser } from "@/lib/auth-helpers";
import { asAdminActor } from "@/lib/staff-scope";
import { faqItemSchema, faqDirectionSchema, type FaqItemInput, type FaqDirection } from "@/schemas/faq";

export const FAQ_ORDER = [{ sortOrder: "asc" as const }, { createdAt: "asc" as const }];

export async function upsertFaqItemAs(actor: SessionUser | null, input: FaqItemInput): Promise<ActionResult<{ id: string }>> {
  if (!asAdminActor(actor)) return fail("errors.notAllowed");
  const parsed = faqItemSchema.safeParse(input);
  if (!parsed.success) return fail(firstIssueKey(parsed.error));
  const { id, question, answer, sortOrder } = parsed.data;
  if (id) {
    const existing = await prisma.faqItem.findUnique({ where: { id } });
    if (!existing) return fail("errors.faqNotFound");
    await prisma.faqItem.update({ where: { id }, data: { questionI18n: question, answerI18n: answer, sortOrder } });
    return ok({ id });
  }
  const created = await prisma.faqItem.create({ data: { questionI18n: question, answerI18n: answer, sortOrder } });
  return ok({ id: created.id });
}

export async function toggleFaqItemAs(actor: SessionUser | null, id: string, isActive: boolean): Promise<ActionResult<void>> {
  if (!asAdminActor(actor)) return fail("errors.notAllowed");
  const existing = await prisma.faqItem.findUnique({ where: { id } });
  if (!existing) return fail("errors.faqNotFound");
  await prisma.faqItem.update({ where: { id }, data: { isActive } });
  return ok(undefined);
}

/** Galeri ile aynı kural: görüntülenen sıra 0..n-1'e eşitlenir, komşuyla yer değişir, uçlarda yok sayılır. */
export async function moveFaqItemAs(actor: SessionUser | null, id: string, direction: FaqDirection): Promise<ActionResult<void>> {
  if (!asAdminActor(actor)) return fail("errors.notAllowed");
  const dir = faqDirectionSchema.safeParse(direction);
  if (!dir.success) return fail("errors.invalidDirection");
  const rows = await prisma.faqItem.findMany({ orderBy: FAQ_ORDER, select: { id: true, sortOrder: true } });
  const index = rows.findIndex((r) => r.id === id);
  if (index === -1) return fail("errors.faqNotFound");
  const target = dir.data === "up" ? index - 1 : index + 1;
  if (target < 0 || target >= rows.length) return ok(undefined);
  const ordered = rows.map((r) => r.id);
  [ordered[index], ordered[target]] = [ordered[target], ordered[index]];
  await prisma.$transaction(
    ordered
      .map((rowId, i) => ({ rowId, i }))
      .filter(({ rowId, i }) => rows.find((r) => r.id === rowId)?.sortOrder !== i)
      .map(({ rowId, i }) => prisma.faqItem.update({ where: { id: rowId }, data: { sortOrder: i } })),
  );
  return ok(undefined);
}

export async function deleteFaqItemAs(actor: SessionUser | null, id: string): Promise<ActionResult<void>> {
  if (!asAdminActor(actor)) return fail("errors.notAllowed");
  const existing = await prisma.faqItem.findUnique({ where: { id } });
  if (!existing) return fail("errors.faqNotFound");
  await prisma.faqItem.delete({ where: { id } });
  return ok(undefined);
}
