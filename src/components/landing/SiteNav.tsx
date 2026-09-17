"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useMotionValueEvent, useScroll } from "motion/react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { SocialLinks, type SocialSettings } from "@/components/brand/SocialLinks";
import { SECTION_LINKS } from "./sections";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/lib/auth-helpers";

/** Oturum durumuna göre tek bir hesap bağlantısı. */
function accountLink(user: SessionUser | null) {
  if (!user) return { href: "/giris", label: "Giriş" };
  if (user.role !== "CUSTOMER") return { href: "/panel", label: "Panel" };
  return { href: "/randevularim", label: "Randevularım" };
}

const NAV_LINK = "border-b border-transparent pb-0.5 text-sm transition-colors hover:border-primary hover:text-primary";
/**
 * Çubuk iki eşik arasında gidip gelir: 100 px'i geçerken toplanır, 60 px'in
 * altına inerken açılır. Tek eşik olsaydı, eşiğin tam üstünde duran bir
 * kaydırmada (ya da çubuk küçülünce sayfanın kısalmasıyla) iki hâl arasında
 * titrerdi; aradaki 40 px'lik ölü bant bunu keser.
 */
const COLLAPSE_AT = 100;
const EXPAND_AT = 60;

export function SiteNav({ shopName, user, social }: { shopName: string; user: SessionUser | null; social: SocialSettings }) {
  const [open, setOpen] = useState(false);
  const [shrunk, setShrunk] = useState(false);
  const account = accountLink(user);

  // Kaydırma değeri React durumuna her karede değil, yalnızca eşik geçildiğinde
  // yazılır: çubuk iki hâl arasında geçer, sürekli yeniden çizilmez.
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (y) => {
    setShrunk((was) => {
      if (was) return y >= EXPAND_AT;
      return y > COLLAPSE_AT;
    });
  });

  // Sayfa kaydırılmış bir konumda açılabilir (yenileme, `#bolum` bağlantısı,
  // geri tuşu) ve `change` olayı yalnızca değer değiştiğinde çalışır: ilk hâl
  // bir kez elle okunmazsa çubuk sayfanın ortasında "açık" kalırdı. Okuma bir
  // sonraki kareye bırakılır, çünkü tarayıcı kaydırma konumunu hidrasyondan
  // sonra geri yükler.
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const y = scrollY.get();
      setShrunk((was) => (was ? y >= EXPAND_AT : y > COLLAPSE_AT));
    });
    return () => cancelAnimationFrame(frame);
  }, [scrollY]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header
      data-shrunk={shrunk ? "true" : "false"}
      className={cn(
        "sticky top-0 z-30 w-full border-b backdrop-blur transition-colors duration-300",
        shrunk ? "border-border bg-background/95 shadow-[0_1px_0_0_var(--border)]" : "border-transparent bg-background/80",
      )}
    >
      <div
        className={cn(
          "mx-auto flex max-w-6xl items-center gap-3 px-5 transition-[height] duration-300 ease-out",
          shrunk ? "h-14" : "h-20",
        )}
      >
        <Link
          href="/"
          className={cn(
            // Fraunces 600 kelime markasını kalınlaştırıp lockup'ı genişletiyordu; 500
            // editoryal ağırlığı korur (gövde `font-variation-settings` kuralı kalkınca
            // yardımcı sınıf ilk kez gerçekten uygulanıyor).
            "min-w-0 truncate font-display font-medium tracking-[0.02em] text-primary transition-all duration-300 hover:text-foreground",
            shrunk ? "text-base sm:text-xl" : "text-base sm:text-2xl",
          )}
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
          <Button asChild className={cn("shrink-0 rounded-none px-3 text-sm transition-[height] duration-300 sm:px-4", shrunk ? "h-9" : "h-10")}>
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
                className="display-sm block border-b border-border py-3.5 transition-colors hover:text-primary"
              >
                {l.label}
              </Link>
            ))}
            <Link
              href={account.href}
              onClick={() => setOpen(false)}
              className="display-sm block border-b border-border py-3.5 text-primary transition-colors hover:text-foreground"
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
