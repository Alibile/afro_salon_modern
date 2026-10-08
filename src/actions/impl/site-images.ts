import { prisma } from "@/lib/db";
import { ok, fail, type ActionResult } from "@/lib/action-result";
import { firstIssueKey } from "@/lib/errors";
import type { SessionUser } from "@/lib/auth-helpers";
import { asAdminActor } from "@/lib/staff-scope";
import { deleteObject } from "@/lib/storage";
import { forgetSiteImages } from "@/lib/site-images-cache";
import { siteImageSchema, siteImageSlotSchema, type SiteImageInput } from "@/schemas/site-image";

/** Yuvaya yeni fotoğraf; öncekinin nesnesi depodan silinir (anahtar değiştiyse). */
export async function setSiteImageAs(actor: SessionUser | null, input: SiteImageInput): Promise<ActionResult<void>> {
  if (!asAdminActor(actor)) return fail("errors.notAllowed");
  const parsed = siteImageSchema.safeParse(input);
  if (!parsed.success) return fail(firstIssueKey(parsed.error));
  const { slot, storageKey, width, height } = parsed.data;
  const previous = await prisma.siteImage.findUnique({ where: { slot } });
  await prisma.siteImage.upsert({ where: { slot }, update: { storageKey, width, height }, create: { slot, storageKey, width, height } });
  forgetSiteImages();
  if (previous && previous.storageKey !== storageKey) await deleteObject(previous.storageKey);
  return ok(undefined);
}

/** Yuvayı boşaltır: satır ve depodaki nesne silinir; boş yuva hata değildir. */
export async function clearSiteImageAs(actor: SessionUser | null, slot: string): Promise<ActionResult<void>> {
  if (!asAdminActor(actor)) return fail("errors.notAllowed");
  const parsed = siteImageSlotSchema.safeParse(slot);
  if (!parsed.success) return fail("errors.invalidImageSlot");
  const previous = await prisma.siteImage.findUnique({ where: { slot: parsed.data } });
  if (!previous) return ok(undefined);
  await prisma.siteImage.delete({ where: { slot: parsed.data } });
  forgetSiteImages();
  await deleteObject(previous.storageKey);
  return ok(undefined);
}
