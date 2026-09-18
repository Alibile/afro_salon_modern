import { prisma } from "@/lib/db";
import { ok, fail, type ActionResult } from "@/lib/action-result";
import { firstIssueKey } from "@/lib/errors";
import type { SessionUser } from "@/lib/auth-helpers";
import { asAdminActor } from "@/lib/staff-scope";
import { settingsSchema, type SettingsInput } from "@/schemas/settings";

export async function updateSettingsAs(actor: SessionUser | null, input: SettingsInput): Promise<ActionResult<void>> {
  if (!asAdminActor(actor)) return fail("errors.notAllowed");
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) return fail(firstIssueKey(parsed.error));
  await prisma.settings.upsert({ where: { id: 1 }, update: parsed.data, create: { id: 1, ...parsed.data } });
  return ok(undefined);
}
