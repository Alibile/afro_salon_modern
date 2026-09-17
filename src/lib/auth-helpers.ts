import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import type { Role } from "@/generated/prisma/enums";

export type SessionUser = { id: string; name: string; email: string; role: Role; barberId: string | null };

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  const u = session.user;
  return { id: u.id, name: u.name ?? "", email: u.email ?? "", role: u.role, barberId: u.barberId };
}

export async function requireUser(next?: string): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect(next ? `/giris?next=${encodeURIComponent(next)}` : "/giris");
  return user;
}

export async function requireRole(...roles: Role[]): Promise<SessionUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) redirect("/403");
  return user;
}

export const requireStaff = () => requireRole("BARBER", "ADMIN");
export const requireAdmin = () => requireRole("ADMIN");
