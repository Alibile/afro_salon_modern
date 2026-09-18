"use server";

import { revalidatePath } from "next/cache";
import { fail, type ActionResult } from "@/lib/action-result";
import { getSessionUser } from "@/lib/auth-helpers";
import { updateSession } from "@/lib/auth";
import { updateOwnProfileAs, changeOwnPasswordAs, updateOwnLocaleAs } from "@/actions/impl/profile";
import type { UserProfileInput, BarberProfileInput, ChangePasswordInput } from "@/schemas/profile";

export async function updateOwnProfile(input: UserProfileInput | BarberProfileInput): Promise<ActionResult<void>> {
  const actor = await getSessionUser();
  if (!actor) return fail("errors.notAllowed");
  const r = await updateOwnProfileAs(actor, input);
  if (r.ok) {
    revalidatePath("/[locale]/panel/profil", "page");
    revalidatePath("/[locale]", "page");
  }
  return r;
}

export async function changeOwnPassword(input: ChangePasswordInput): Promise<ActionResult<void>> {
  const actor = await getSessionUser();
  if (!actor) return fail("errors.notAllowed");
  return changeOwnPasswordAs(actor, input);
}

/**
 * Dil tercihi yazıldıktan sonra oturum jetonu tazelenir (`callbacks.jwt`'nin
 * `trigger === "update"` dalı): jeton dokunulmasaydı `session.user.locale`
 * kullanıcı yeniden giriş yapana kadar eski dili taşırdı. Tazeleme başarısız
 * olursa (çerez yazılamayan bir bağlam) tercih yine de kaydedilmiş olur, bu
 * yüzden hata action'ı düşürmez.
 */
export async function updateOwnLocale(locale: string): Promise<ActionResult<void>> {
  const actor = await getSessionUser();
  if (!actor) return fail("errors.notAllowed");
  const r = await updateOwnLocaleAs(actor, locale);
  if (r.ok) {
    try {
      // Yük bilerek boş: `jwt` geri çağrısı gövdeye değil veritabanına bakar,
      // burada gereken tek şey "session" eylemini tetiklemek.
      await updateSession({ user: {} });
    } catch (e) {
      console.error("[session:update]", e);
    }
    revalidatePath("/[locale]/panel", "layout");
  }
  return r;
}
