import type { SessionUser } from "@/lib/auth-helpers";

/** BARBER için kendi berberId'si, ADMIN için kısıt yok */
export function staffScope(actor: SessionUser): { barberId?: string } {
  return actor.role === "ADMIN" ? {} : { barberId: actor.barberId ?? "__none__" };
}
