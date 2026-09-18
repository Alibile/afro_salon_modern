import { prisma } from "@/lib/db";
import { ok, fail, type ActionResult } from "@/lib/action-result";
import { firstIssueKey } from "@/lib/errors";
import type { SessionUser } from "@/lib/auth-helpers";
import { asAdminActor } from "@/lib/staff-scope";
import { deleteObject } from "@/lib/storage";
import { GALLERY_ORDER } from "@/lib/gallery-order";
import {
  addGalleryPhotosSchema,
  updateGalleryPhotoSchema,
  galleryDirectionSchema,
  type GalleryItemInput,
  type UpdateGalleryPhotoInput,
  type GalleryDirection,
} from "@/schemas/gallery";

/** Panelden yüklenen fotoğraflar tek çağrıda, mevcutların arkasına eklenir. */
export async function addGalleryPhotosAs(
  actor: SessionUser | null,
  items: GalleryItemInput[],
): Promise<ActionResult<{ ids: string[] }>> {
  if (!asAdminActor(actor)) return fail("errors.notAllowed");
  const parsed = addGalleryPhotosSchema.safeParse(items);
  if (!parsed.success) return fail(firstIssueKey(parsed.error));

  const last = await prisma.galleryPhoto.findFirst({ orderBy: { sortOrder: "desc" }, select: { sortOrder: true } });
  const start = last ? last.sortOrder + 1 : 0;
  const created = await prisma.$transaction(
    parsed.data.map((item, i) =>
      prisma.galleryPhoto.create({
        data: { storageKey: item.storageKey, width: item.width, height: item.height, sortOrder: start + i },
        select: { id: true },
      }),
    ),
  );
  return ok({ ids: created.map((c) => c.id) });
}

export async function updateGalleryPhotoAs(
  actor: SessionUser | null,
  id: string,
  input: UpdateGalleryPhotoInput,
): Promise<ActionResult<void>> {
  if (!asAdminActor(actor)) return fail("errors.notAllowed");
  const parsed = updateGalleryPhotoSchema.safeParse(input);
  if (!parsed.success) return fail(firstIssueKey(parsed.error));
  const existing = await prisma.galleryPhoto.findUnique({ where: { id } });
  if (!existing) return fail("errors.photoNotFound");
  // Yalnızca gönderilen alanlar yazılır; örneğin aktif/pasif düğmesi başlığa ve etiketlere dokunmaz.
  await prisma.galleryPhoto.update({ where: { id }, data: parsed.data });
  return ok(undefined);
}

/**
 * Fotoğrafı listede bir sıra yukarı/aşağı taşır. Sıra numaraları eşitlenmiş
 * olabileceği için (seed, toplu yükleme) önce görüntülenen sıra 0..n-1 olarak
 * normalize edilir, sonra iki komşu yer değiştirir.
 */
export async function moveGalleryPhotoAs(
  actor: SessionUser | null,
  id: string,
  direction: GalleryDirection,
): Promise<ActionResult<void>> {
  if (!asAdminActor(actor)) return fail("errors.notAllowed");
  const parsedDirection = galleryDirectionSchema.safeParse(direction);
  if (!parsedDirection.success) return fail("errors.invalidDirection");

  const rows = await prisma.galleryPhoto.findMany({ orderBy: GALLERY_ORDER, select: { id: true, sortOrder: true } });
  const index = rows.findIndex((r) => r.id === id);
  if (index === -1) return fail("errors.photoNotFound");

  const target = parsedDirection.data === "up" ? index - 1 : index + 1;
  if (target < 0 || target >= rows.length) return ok(undefined); // uçlarda taşıma yok sayılır

  const ordered = rows.map((r) => r.id);
  [ordered[index], ordered[target]] = [ordered[target], ordered[index]];
  await prisma.$transaction(
    ordered
      .map((rowId, i) => ({ rowId, i }))
      .filter(({ rowId, i }) => rows.find((r) => r.id === rowId)?.sortOrder !== i)
      .map(({ rowId, i }) => prisma.galleryPhoto.update({ where: { id: rowId }, data: { sortOrder: i } })),
  );
  return ok(undefined);
}

export async function deleteGalleryPhotoAs(actor: SessionUser | null, id: string): Promise<ActionResult<void>> {
  if (!asAdminActor(actor)) return fail("errors.notAllowed");
  const existing = await prisma.galleryPhoto.findUnique({ where: { id } });
  if (!existing) return fail("errors.photoNotFound");
  await prisma.galleryPhoto.delete({ where: { id } });
  // `landing/` anahtarları depoda değil, depoya gönderilen kaynakta (public/) yaşar; silinmemeli.
  if (!existing.storageKey.startsWith("landing/")) await deleteObject(existing.storageKey);
  return ok(undefined);
}
