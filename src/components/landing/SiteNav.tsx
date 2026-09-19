"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Menu, X } from "lucide-react";
import { useMotionValueEvent, useScroll } from "motion/react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { LocaleSwitcher } from "@/components/brand/LocaleSwitcher";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { SECTION_LINKS } from "./sections";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/lib/auth-helpers";

/** Oturum durumuna göre tek bir hesap bağlantısı. */
function accountLink(user: SessionUser | null) {
  if (!user) return { href: "/giris", key: "login" } as const;
  if (user.role !== "CUSTOMER") return { href: "/panel", key: "panel" } as const;
  return { href: "/randevularim", key: "myAppointments" } as const;
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

export function SiteNav({ shopName, user }: { shopName: string; user: SessionUser | null }) {
  const [open, setOpen] = useState(false);
  const [shrunk, setShrunk] = useState(false);
  const t = useTranslations("nav");
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
  // bir kez elle okunmazsa çubuk sayfanın ortasında "açık" kalırdı. Değer iki
  // kez okunur: hidrasyonun hemen ardından (tarayıcı kaydırmayı çoktan geri
  // yüklemişse çubuk ilk boyamada solid gelir, sayfanın ortasında bir kare bile
  // şeffaf durmaz) ve bir sonraki karede (geri yükleme hidrasyondan sonraysa).
  useEffect(() => {
    const seed = () => {
      const y = scrollY.get();
      setShrunk((was) => (was ? y >= EXPAND_AT : y > COLLAPSE_AT));
    };
    seed();
    const frame = requestAnimationFrame(seed);
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

  // Çubuk hero fotoğrafının üstünde başlar: düz zemin yok, yalnızca yukarıdan
  // aşağı sönen ince bir karartma ve kum rengi metin. Karartma CSS'tir, JavaScript
  // beklemez: hidrasyondan önce ya da JavaScript hiç çalışmadığında da metin
  // fotoğrafın açık bölgelerinin üstünde okunur kalır. Toplanma eşiği geçilince
  // (ya da mobil menü açılınca — açık panel kum zeminlidir, çubuğun şeffaf
  // kalması paneli havada bırakırdı) her zamanki kum zemine döner.
  const solid = shrunk || open;
  return (
    <header
      data-shrunk={shrunk ? "true" : "false"}
      data-solid={solid ? "true" : "false"}
      className={cn(
        // `site-nav-landing`: yalnızca CSS'in tutunacağı kanca (bkz. globals.css,
        // `@media (scripting: none)`) — görünüşe hiçbir şey katmaz.
        "site-nav-landing sticky top-0 z-30 w-full border-b transition-colors duration-300",
        solid
          ? "border-border bg-background/95 text-foreground shadow-[0_1px_0_0_var(--border)] backdrop-blur"
          : "border-transparent bg-gradient-to-b from-hero-ink/45 to-transparent text-hero-sand",
      )}
    >
      <div
        className={cn(
          "mx-auto flex max-w-6xl items-center gap-3 px-5 transition-[height] duration-300 ease-out",
          shrunk ? "h-14" : "h-20",
        )}
      >
        {/*
         * Logo menüdeki "Ana Sayfa" maddesinin yerini aldı: erişilebilir ad hem
         * markayı hem hedefi söyler, böylece ekran okuyucu kullanıcısı bağlantıyı
         * kaybetmez ve görsel menü bir madde kısalır.
         */}
        <Link
          href="/"
          aria-label={`${shopName} — ${t("home")}`}
          className={cn(
            // Fraunces 600 kelime markasını kalınlaştırıp lockup'ı genişletiyordu; 500
            // editoryal ağırlığı korur (gövde `font-variation-settings` kuralı kalkınca
            // yardımcı sınıf ilk kez gerçekten uygulanıyor).
            "min-w-0 font-display font-medium tracking-[0.02em] transition-all duration-300",
            solid ? "text-primary hover:text-foreground" : "text-hero-sand hover:text-accent",
            shrunk ? "text-base sm:text-xl" : "text-base sm:text-2xl",
          )}
        >
          <BrandLogo name={shopName} markSize={shrunk ? 24 : 28} />
        </Link>

        <nav aria-label={t("mainMenu")} className="mx-auto hidden items-center gap-5 lg:flex xl:gap-7">
          {SECTION_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className={cn(NAV_LINK, !solid && "hover:border-accent hover:text-accent")}>
              {t(l.key)}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1 lg:ml-0">
          <LocaleSwitcher tone={solid ? "default" : "hero"} className="hidden lg:flex" />
          <ThemeToggle />
          <Link href={account.href} className={cn(NAV_LINK, "mx-2 hidden lg:inline-block", !solid && "hover:border-accent hover:text-accent")}>
            {t(account.key)}
          </Link>
          <Button asChild className={cn("shrink-0 rounded-none px-3 text-sm transition-[height] duration-300 sm:px-4", shrunk ? "h-9" : "h-10")}>
            <Link href="/randevu">{t("book")}</Link>
          </Button>
          <button
            type="button"
            aria-label={open ? t("closeMenu") : t("openMenu")}
            aria-expanded={open}
            aria-controls="mobil-menu"
            onClick={() => setOpen((v) => !v)}
            className={cn(
              "inline-flex size-10 items-center justify-center transition-colors lg:hidden",
              solid ? "text-foreground hover:text-primary" : "text-hero-sand hover:text-accent",
            )}
          >
            {open ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>
      </div>

      {open && (
        <div id="mobil-menu" className="animate-in slide-in-from-top-2 border-t border-border bg-background duration-150 lg:hidden">
          <nav aria-label={t("mainMenu")} className="mx-auto max-w-6xl px-5 pb-4">
            {SECTION_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="display-sm block border-b border-border py-3.5 transition-colors hover:text-primary"
              >
                {t(l.key)}
              </Link>
            ))}
            <Link
              href={account.href}
              onClick={() => setOpen(false)}
              className="display-sm block border-b border-border py-3.5 text-primary transition-colors hover:text-foreground"
            >
              {t(account.key)}
            </Link>
            <LocaleSwitcher tone="default" className="pt-4" />
          </nav>
        </div>
      )}
    </header>
  );
}
