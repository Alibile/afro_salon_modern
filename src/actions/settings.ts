"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { ok, fail, type ActionResult } from "@/lib/action-result";
import { getSessionUser, type SessionUser } from "@/lib/auth-helpers";
import { settingsSchema, type SettingsInput } from "@/schemas/settings";

export async function updateSettings(input: SettingsInput, opts: { actor?: SessionUser } = {}): Promise<ActionResult<void>> {
  const u = opts.actor ?? (await getSessionUser());
  if (u?.role !== "ADMIN") return fail("Yetkiniz yok");
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Geçersiz bilgi");
  await prisma.settings.upsert({ where: { id: 1 }, update: parsed.data, create: { id: 1, ...parsed.data } });
  if (!opts.actor) { revalidatePath("/"); revalidatePath("/panel/ayarlar"); }
  return ok(undefined);
}
