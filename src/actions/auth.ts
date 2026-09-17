"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { prisma } from "@/lib/db";
import { signIn, signOut } from "@/lib/auth";
import { ok, fail, type ActionResult } from "@/lib/action-result";
import { registerSchema, loginSchema, type RegisterInput } from "@/schemas/auth";

export async function registerCustomer(input: RegisterInput): Promise<ActionResult<{ id: string }>> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Geçersiz bilgi");
  const { name, email, phone, password } = parsed.data;

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return fail("Bu e-posta ile zaten bir hesap var");

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name, email, phone: phone || null, passwordHash, role: "CUSTOMER" },
  });
  return ok({ id: user.id });
}

export type LoginState = { error?: string };

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const next = String(formData.get("next") || "");
  try {
    await signIn("credentials", { ...parsed.data, redirectTo: next || "/after-login" });
    return {};
  } catch (e) {
    if (e instanceof AuthError) return { error: "E-posta veya şifre hatalı" };
    throw e; // NEXT_REDIRECT buradan geçer
  }
}

export async function registerAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const r = await registerCustomer({
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    password: String(formData.get("password") ?? ""),
  });
  if (!r.ok) return { error: r.error };
  const next = String(formData.get("next") || "");
  await signIn("credentials", {
    email: String(formData.get("email")).trim().toLowerCase(),
    password: String(formData.get("password")),
    redirectTo: next || "/",
  });
  return {};
}

export async function logoutAction() {
  await signOut({ redirectTo: "/" });
}
