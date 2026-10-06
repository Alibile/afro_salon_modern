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
import { logoutAction } from "@/actions/auth";
import { SECTION_LINKS } from "@/components/landing/sections";
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
 * kaydırmada iki hâl arasında titrerdi; aradaki 40 px'lik ölü bant bunu keser.
 */
const COLLAPSE_AT = 100;
const EXPAND_AT = 60;

/**
 * Hero fotoğrafının üstünde başlayan çubuk kaydırmayı dinler ve eşik geçilince
 * toplanır. Yalnızca `hero` varyantı bu kancayı kurar: iç sayfaların çubuğu
 * zaten düz zeminde başlar, dinleyecek bir şeyi yoktur.
 */
function useShrunk(): boolean {
  const [shrunk, setShrunk] = useState(false);
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (y) => {
    setShrunk((was) => (was ? y >= EXPAND_AT : y > COLLAPSE_AT));
  });
  // Sayfa kaydırılmış bir konumda açılabilir (yenileme, `#bolum` bağlantısı,
  // geri tuşu): ilk hâl bir kez elle okunmazsa çubuk sayfanın ortasında
  // "açık" kalırdı. İki kez okunur: hidrasyonun hemen ardından ve bir sonraki
  // karede (geri yükleme hidrasyondan sonraysa).
  useEffect(() => {
    const seed = () => {
      const y = scrollY.get();
      setShrunk((was) => (was ? y >= EXPAND_AT : y > COLLAPSE_AT));
    };
    seed();
    const frame = requestAnimationFrame(seed);
    return () => cancelAnimationFrame(frame);
  }, [scrollY]);
  return shrunk;
}

export type SiteNavVariant = "hero" | "plain";

type Props = {
  shopName: string;
  user: SessionUser | null;
  /**
   * `hero`: ana sayfa. Fotoğrafın üstünde şeffaf başlar, kaydırınca kum zemine
   * toplanır; bölüm bağlantılarını taşır. `plain`: iç sayfalar. Hep düz zemin,
   * sabit yükseklik, bölüm bağlantısı yok.
   */
  variant: SiteNavVariant;
  /** Randevu sayfasının kendisinde "Randevu al" düğmesi anlamsızdır. */
  hideBook?: boolean;
};

/**
 * Sitenin tek üst çubuğu. Ana sayfa ve iç sayfalar aynı bileşeni çizer; fark
 * yalnızca zemin ve bölüm bağlantılarıdır. Telefonda tek satır: logo solda,
 * sağda "Randevu al" ve menü düğmesi. Dil ve tema anahtarı dar ekranda menünün
 * içine iner; geniş ekranda (`xl`) çubukta durur.
 */
export function SiteNav(props: Props) {
  return props.variant === "hero" ? <HeroBar {...props} /> : <PlainBar {...props} />;
}

function HeroBar(props: Props) {
  const shrunk = useShrunk();
  return <Bar {...props} shrunk={shrunk} />;
}

function PlainBar(props: Props) {
  return <Bar {...props} shrunk />;
}

function Bar({ shopName, user, variant, hideBook = false, shrunk }: Props & { shrunk: boolean }) {
  const [open, setOpen] = useState(false);
  const t = useTranslations("nav");
  const account = accountLink(user);
  const hero = variant === "hero";

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Hero çubuğu fotoğrafın üstünde şeffaf başlar: düz zemin yok, yukarıdan
  // aşağı sönen ince bir karartma ve kum rengi metin. Toplanınca (ya da mobil
  // menü açılınca) her zamanki kum zemine döner. Düz varyant hep bu hâldedir.
  const solid = !hero || shrunk || open;
  const tall = hero && !shrunk;

  return (
    <header
      data-shrunk={shrunk ? "true" : "false"}
      data-solid={solid ? "true" : "false"}
      className={cn(
        // `site-nav-landing`: yalnızca CSS'in tutunacağı kanca (bkz. globals.css,
        // `@media (scripting: none)`) — görünüşe hiçbir şey katmaz.
        hero && "site-nav-landing",
        "sticky top-0 z-30 w-full border-b transition-colors duration-300",
        solid
          ? "border-border bg-background/95 text-foreground backdrop-blur"
          : "border-transparent bg-gradient-to-b from-hero-ink/45 to-transparent text-hero-sand",
      )}
    >
      <div
        className={cn(
          "mx-auto flex max-w-6xl items-center gap-3 px-5 transition-[height] duration-300 ease-out md:px-10",
          tall ? "h-20" : "h-16",
        )}
      >
        {/*
         * Logo menüdeki "Ana Sayfa" maddesinin yerini alır: erişilebilir ad hem
         * markayı hem hedefi söyler.
         */}
        <Link
          href="/"
          aria-label={`${shopName} — ${t("home")}`}
          className={cn(
            "min-w-0 font-display font-medium tracking-[0.02em] transition-colors duration-300",
            solid ? "text-primary hover:text-foreground" : "text-hero-sand hover:text-accent",
            tall ? "text-lg sm:text-2xl" : "text-lg sm:text-xl",
          )}
        >
          <BrandLogo name={shopName} markSize={tall ? 28 : 24} />
        </Link>

        {/*
         * Bölüm bağlantıları yalnızca ana sayfada ve 1280 px'ten (`xl`) itibaren:
         * altı bağlantı + dil + tema + hesap + randevu düğmesi 1024–1279
         * arasında satıra sığmıyor. O aralıkta da mobil menü kullanılır.
         */}
        {hero && (
          <nav aria-label={t("mainMenu")} className="mx-auto hidden items-center gap-7 xl:flex">
            {SECTION_LINKS.map((l) => (
              <Link key={l.href} href={l.href} className={cn(NAV_LINK, !solid && "hover:border-accent hover:text-accent")}>
                {t(l.key)}
              </Link>
            ))}
          </nav>
        )}

        <div className="ml-auto flex items-center gap-1">
          <LocaleSwitcher tone={solid ? "default" : "hero"} className="hidden xl:flex" />
          <ThemeToggle className="hidden xl:inline-flex" />
          <Link href={account.href} className={cn(NAV_LINK, "mx-2 hidden xl:inline-block", !solid && "hover:border-accent hover:text-accent")}>
            {t(account.key)}
          </Link>
          {user && (
            <form action={logoutAction} className="hidden xl:block">
              <Button type="submit" variant="ghost" size="sm" className={cn(!solid && "text-hero-sand hover:text-accent")}>
                {t("logout")}
              </Button>
            </form>
          )}
          {!hideBook && (
            // Telefonda 44 px dokunma hedefi; geniş ekranda çubuğun ölçüsüne iner.
            <Button asChild size={tall ? "default" : "sm"} className={cn("h-11 shrink-0 px-3 sm:px-4", tall ? "xl:h-10" : "xl:h-9")}>
              <Link href="/randevu">{t("book")}</Link>
            </Button>
          )}
          <button
            type="button"
            aria-label={open ? t("closeMenu") : t("openMenu")}
            aria-expanded={open}
            aria-controls="mobil-menu"
            onClick={() => setOpen((v) => !v)}
            className={cn(
              "inline-flex size-11 items-center justify-center transition-colors xl:hidden",
              solid ? "text-foreground hover:text-primary" : "text-hero-sand hover:text-accent",
            )}
          >
            {open ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>
      </div>

      {open && (
        <div id="mobil-menu" className="animate-in slide-in-from-top-2 border-t border-border bg-background duration-150 xl:hidden">
          <nav aria-label={t("mainMenu")} className="mx-auto max-w-6xl px-5 pb-4 md:px-10">
            {hero &&
              SECTION_LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block border-b border-border py-3.5 font-display text-2xl transition-colors hover:text-primary"
                >
                  {t(l.key)}
                </Link>
              ))}
            <Link
              href={account.href}
              onClick={() => setOpen(false)}
              className="block border-b border-border py-3.5 font-display text-2xl text-primary transition-colors hover:text-foreground"
            >
              {t(account.key)}
            </Link>
            {user && (
              <form action={logoutAction}>
                <button type="submit" className="block w-full border-b border-border py-3.5 text-left font-display text-2xl transition-colors hover:text-primary">
                  {t("logout")}
                </button>
              </form>
            )}
            <div className="flex items-center justify-between pt-4">
              <LocaleSwitcher tone="default" />
              <ThemeToggle />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
