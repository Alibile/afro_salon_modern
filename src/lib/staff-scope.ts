import type { SessionUser } from "@/lib/auth-helpers";

/** BARBER için kendi berberId'si, ADMIN için kısıt yok */
export function staffScope(actor: SessionUser): { barberId?: string } {
  return actor.role === "ADMIN" ? {} : { barberId: actor.barberId ?? "__none__" };
}

/** BARBER veya ADMIN ise aktörü döner, aksi halde null */
export function asStaffActor(actor: SessionUser | null | undefined): SessionUser | null {
  return actor && (actor.role === "BARBER" || actor.role === "ADMIN") ? actor : null;
}

/** Yalnızca ADMIN ise aktörü döner, aksi halde null */
export function asAdminActor(actor: SessionUser | null | undefined): SessionUser | null {
  return actor && actor.role === "ADMIN" ? actor : null;
}
