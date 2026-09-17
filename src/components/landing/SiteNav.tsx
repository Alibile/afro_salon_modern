"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { SocialLinks, type SocialSettings } from "@/components/brand/SocialLinks";
import { SECTION_LINKS } from "./sections";
import type { SessionUser } from "@/lib/auth-helpers";

/** Oturum durumuna göre tek bir hesap bağlantısı. */
function accountLink(user: SessionUser | null) {
  if (!user) return { href: "/giris", label: "Giriş" };
  if (user.role !== "CUSTOMER") return { href: "/panel", label: "Panel" };
  return { href: "/randevularim", label: "Randevularım" };
}

const NAV_LINK = "border-b border-transparent pb-0.5 text-sm transition-colors hover:border-primary hover:text-primary";

export function SiteNav({ shopName, user, social }: { shopName: string; user: SessionUser | null; social: SocialSettings }) {
  const [open, setOpen] = useState(false);
  const account = accountLink(user);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="sticky top-0 z-30 w-full border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-5">
        <Link
          href="/"
          className="min-w-0 truncate font-display text-lg tracking-[0.14em] text-primary transition-colors hover:text-foreground sm:text-2xl"
        >
          {shopName}
        </Link>

        <nav aria-label="Ana menü" className="mx-auto hidden items-center gap-5 lg:flex xl:gap-7">
          {SECTION_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className={NAV_LINK}>
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1 lg:ml-0">
          <SocialLinks settings={social} className="hidden xl:flex" linkClassName="size-8 text-muted-foreground" />
          <ThemeToggle />
          <Link href={account.href} className={`${NAV_LINK} mx-2 hidden lg:inline-block`}>
            {account.label}
          </Link>
          <Button asChild className="h-10 shrink-0 rounded-none px-3 text-sm sm:px-4">
            <Link href="/randevu">Randevu al</Link>
          </Button>
          <button
            type="button"
            aria-label={open ? "Menüyü kapat" : "Menüyü aç"}
            aria-expanded={open}
            aria-controls="mobil-menu"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex size-10 items-center justify-center text-foreground transition-colors hover:text-primary lg:hidden"
          >
            {open ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>
      </div>

      {open && (
        <div id="mobil-menu" className="animate-in slide-in-from-top-2 border-t border-border bg-background duration-150 lg:hidden">
          <nav aria-label="Ana menü" className="mx-auto max-w-6xl px-5 pb-4">
            {SECTION_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="block border-b border-border py-3.5 font-display text-2xl tracking-wide transition-colors hover:text-primary"
              >
                {l.label}
              </Link>
            ))}
            <Link
              href={account.href}
              onClick={() => setOpen(false)}
              className="block border-b border-border py-3.5 font-display text-2xl tracking-wide text-primary transition-colors hover:text-foreground"
            >
              {account.label}
            </Link>
            <SocialLinks settings={social} className="mt-4 gap-3" linkClassName="size-10 text-muted-foreground" iconClassName="size-6" />
          </nav>
        </div>
      )}
    </header>
  );
}
