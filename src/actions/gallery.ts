"use server";

import { revalidatePath } from "next/cache";
import { fail, type ActionResult } from "@/lib/action-result";
import { getSessionUser } from "@/lib/auth-helpers";
import {
  addGalleryPhotosAs,
  updateGalleryPhotoAs,
  moveGalleryPhotoAs,
  deleteGalleryPhotoAs,
} from "@/actions/impl/gallery";
import type { GalleryItemInput, UpdateGalleryPhotoInput, GalleryDirection } from "@/schemas/gallery";

function revalidateGallery() {
  // Yol artık `[locale]` segmentinin altında: düz "/" hiçbir rota dosyasıyla
  // eşleşmez. Rota deseni + "page" üç dili de tek çağrıda tazeler.
  revalidatePath("/[locale]", "page");
  revalidatePath("/[locale]/panel/galeri", "page");
}

export async function addGalleryPhotos(items: GalleryItemInput[]): Promise<ActionResult<{ ids: string[] }>> {
  const actor = await getSessionUser();
  if (!actor) return fail("errors.notAllowed");
  const r = await addGalleryPhotosAs(actor, items);
  if (r.ok) revalidateGallery();
  return r;
}

export async function updateGalleryPhoto(id: string, input: UpdateGalleryPhotoInput): Promise<ActionResult<void>> {
  const actor = await getSessionUser();
  if (!actor) return fail("errors.notAllowed");
  const r = await updateGalleryPhotoAs(actor, id, input);
  if (r.ok) revalidateGallery();
  return r;
}

export async function moveGalleryPhoto(id: string, direction: GalleryDirection): Promise<ActionResult<void>> {
  const actor = await getSessionUser();
  if (!actor) return fail("errors.notAllowed");
  const r = await moveGalleryPhotoAs(actor, id, direction);
  if (r.ok) revalidateGallery();
  return r;
}

export async function deleteGalleryPhoto(id: string): Promise<ActionResult<void>> {
  const actor = await getSessionUser();
  if (!actor) return fail("errors.notAllowed");
  const r = await deleteGalleryPhotoAs(actor, id);
  if (r.ok) revalidateGallery();
  return r;
}
