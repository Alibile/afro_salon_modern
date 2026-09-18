import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import type { Role } from "@/generated/prisma/enums";
import type { AppLocale } from "@/i18n/routing";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  barberId: string | null;
  /** Kullanıcının kayıtlı dil tercihi; e-postalar ve oturum açılışı bunu kullanır. */
  locale: AppLocale;
};

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  const u = session.user;
  return { id: u.id, name: u.name ?? "", email: u.email ?? "", role: u.role, barberId: u.barberId, locale: u.locale };
}

/**
 * next-intl'in `redirect`'i hedefi açık bir dille ister; yetki yönlendirmeleri
 * ziyaretçiyi bulunduğu dilde tutar (`/en/panel` → `/en/giris?next=…`).
 */
export async function requireUser(next?: string): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    const locale = await getLocale();
    redirect({ href: next ? `/giris?next=${encodeURIComponent(next)}` : "/giris", locale });
  }
  return user;
}

export async function requireRole(...roles: Role[]): Promise<SessionUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) redirect({ href: "/403", locale: await getLocale() });
  return user;
}

export const requireStaff = () => requireRole("BARBER", "ADMIN");
export const requireAdmin = () => requireRole("ADMIN");
