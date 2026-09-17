import type { Role } from "@/generated/prisma/enums";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      barberId: string | null;
    } & DefaultSession["user"];
  }
  interface User {
    role: Role;
    barberId: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    barberId: string | null;
  }
}

// `next-auth/jwt` re-exports its `JWT` interface from `@auth/core/jwt` via
// `export * from`, so augmenting only "next-auth/jwt" does not merge onto the
// actual type used internally by NextAuth's callbacks (it falls back to the
// `Record<string, unknown>` index signature). Augmenting the source module
// too makes `token.id` / `token.role` / `token.barberId` resolve correctly.
declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: Role;
    barberId: string | null;
  }
}
