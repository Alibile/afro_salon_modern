"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/actions/auth";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/lib/auth-helpers";

export function SiteHeader({ user, shopName }: { user: SessionUser | null; shopName: string }) {
  const pathname = usePathname();
  const landing = pathname === "/";
  return (
    <header
      className={cn(
        "top-0 z-20 w-full",
        landing ? "relative bg-transparent" : "sticky border-b border-border bg-background/90 backdrop-blur",
      )}
    >
      <div className={cn("mx-auto flex items-center justify-between gap-3 px-5 py-4", landing ? "max-w-6xl" : "max-w-lg")}>
        <Link href="/" className="shrink-0 font-display text-xl tracking-[0.1em] text-primary sm:text-2xl sm:tracking-[0.14em]">
          {shopName}
        </Link>
        <nav aria-label="Ana menü" className="flex items-center gap-0.5 sm:gap-1">
          {user ? (
            <>
              {user.role !== "CUSTOMER" && (
                <Button asChild variant="ghost" size="sm">
                  <Link href="/panel">Panel</Link>
                </Button>
              )}
              <Button asChild variant="ghost" size="sm">
                <Link href="/randevularim">Randevularım</Link>
              </Button>
              <form action={logoutAction}>
                <Button variant="ghost" size="sm" type="submit">
                  Çıkış
                </Button>
              </form>
            </>
          ) : (
            <Button asChild variant="ghost" size="sm">
              <Link href="/giris">Giriş</Link>
            </Button>
          )}
          {pathname !== "/randevu" && (
            <Button asChild size="sm" className="ml-1 rounded-none">
              <Link href="/randevu">Randevu al</Link>
            </Button>
          )}
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
