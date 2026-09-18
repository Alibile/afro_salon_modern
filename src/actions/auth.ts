"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { getLocale } from "next-intl/server";
import { prisma } from "@/lib/db";
import { signIn, signOut } from "@/lib/auth";
import { ok, fail, type ActionResult } from "@/lib/action-result";
import { firstIssueKey, isErrorKey, type ErrorKey } from "@/lib/errors";
import { registerSchema, loginSchema, type RegisterInput } from "@/schemas/auth";
import { routing, type AppLocale } from "@/i18n/routing";
import { stripLocale, withLocale } from "@/lib/locale-path";

/**
 * Oturum akışındaki her yönlendirme ziyaretçiyi bulunduğu dilde bırakır.
 * `next` parametresi dil öneki taşıyabilir de taşımayabilir de (randevu
 * sihirbazı öneksiz üretir, proxy önekli); ikisi de tek biçime indirilir.
 */
function localizeNext(locale: AppLocale, next: string, fallback: string): string {
  if (!next.startsWith("/")) return withLocale(locale, fallback);
  return withLocale(locale, stripLocale(next).path);
}

export async function registerCustomer(
  input: RegisterInput,
  locale: AppLocale = routing.defaultLocale,
): Promise<ActionResult<{ id: string }>> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) return fail(firstIssueKey(parsed.error));
  const { name, email, phone, password } = parsed.data;

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return fail("errors.emailTaken");

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name, email, phone: phone || null, passwordHash, role: "CUSTOMER", locale },
  });
  return ok({ id: user.id });
}

/** Form durumu da hata anahtarı taşır; metin `LoginForm` içinde üretilir. */
export type LoginState = { error?: ErrorKey };

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { error: firstIssueKey(parsed.error) };
  const locale = (await getLocale()) as AppLocale;
  const next = String(formData.get("next") || "");
  try {
    // `locale` kimlik doğrulamanın gövdesiyle birlikte gider: şifre doğrulandıktan
    // sonra `authorize()` kullanıcının kayıtlı dilini o anki site diline günceller.
    await signIn("credentials", { ...parsed.data, locale, redirectTo: localizeNext(locale, next, "/after-login") });
    return {};
  } catch (e) {
    if (e instanceof AuthError) return { error: "errors.invalidCredentials" };
    throw e; // NEXT_REDIRECT buradan geçer
  }
}

export async function registerAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const locale = (await getLocale()) as AppLocale;
  const r = await registerCustomer(
    {
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      password: String(formData.get("password") ?? ""),
    },
    locale,
  );
  if (!r.ok) return { error: isErrorKey(r.error) ? r.error : "errors.invalidInput" };
  const next = String(formData.get("next") || "");
  await signIn("credentials", {
    email: String(formData.get("email")).trim().toLowerCase(),
    password: String(formData.get("password")),
    locale,
    redirectTo: localizeNext(locale, next, "/"),
  });
  return {};
}

export async function logoutAction() {
  const locale = (await getLocale()) as AppLocale;
  await signOut({ redirectTo: withLocale(locale, "/") });
}
