import { prisma } from "@/lib/db";
import { ok, fail, type ActionResult } from "@/lib/action-result";
import type { SessionUser } from "@/lib/auth-helpers";
import { asAdminActor } from "@/lib/staff-scope";
import { parseContentBlocks, type ContentBlocksInput } from "@/schemas/content";

/**
 * Gönderilen her anahtar yazılır; üç dili de boş olan anahtarın satırı
 * silinir (ziyaretçi çeviri dosyasındaki metne döner). Gönderilmeyen
 * anahtarlara dokunulmaz: panel bölüm başına kaydeder.
 */
export async function saveContentBlocksAs(actor: SessionUser | null, input: ContentBlocksInput): Promise<ActionResult<void>> {
  if (!asAdminActor(actor)) return fail("errors.notAllowed");
  const parsed = parseContentBlocks(input);
  if (!parsed.ok) return fail(parsed.error);
  const entries = Object.entries(parsed.data) as [string, { tr: string; en?: string; fr?: string }][];
  await prisma.$transaction(
    entries.map(([key, text]) => {
      const empty = text.tr.trim() === "" && !text.en && !text.fr;
      if (empty) return prisma.contentBlock.deleteMany({ where: { key } });
      return prisma.contentBlock.upsert({ where: { key }, update: { textI18n: text }, create: { key, textI18n: text } });
    }),
  );
  return ok(undefined);
}
