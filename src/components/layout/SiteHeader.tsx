"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { LocaleSwitcher } from "@/components/brand/LocaleSwitcher";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/actions/auth";
import type { SessionUser } from "@/lib/auth-helpers";

/**
 * Müşteri bölümünün üst çubuğu. Landing (`/`) kendi tam menüsünü
 * (`SiteNav`) sayfa içinde render ettiği için burada hiçbir şey çizilmez;
 * böylece diğer müşteri sayfaları layout'tan başlığı almaya devam eder.
 */
export function SiteHeader({ user, shopName }: { user: SessionUser | null; shopName: string }) {
  const pathname = usePathname();
  const t = useTranslations("nav");
  if (pathname === "/") return null;
  return (
    <header className="sticky top-0 z-20 w-full border-b border-border bg-background/90 backdrop-blur">
      {/*
       * Satır sarabilir: oturum açıkken mobil genişlikte marka + "Randevularım"
       * + "Çıkış" + dil anahtarı + tema düğmesi tek satıra sığmıyor ve çubuk
       * yatay taşıyordu (sayfa yana kayıyor, alttaki sabit onay çubuğu ekranın
       * dışında kalıyordu). Taşmak yerine menü ikinci satıra iner.
       */}
      <div className="mx-auto flex max-w-lg flex-wrap items-center justify-between gap-x-3 gap-y-1 px-5 py-3.5">
        <Link href="/" className="shrink-0 font-display text-lg font-semibold tracking-[0.02em] text-primary sm:text-2xl">
          {shopName}
        </Link>
        <nav aria-label={t("mainMenu")} className="ml-auto flex items-center gap-0.5 sm:gap-1">
          {user ? (
            <>
              {user.role !== "CUSTOMER" && (
                <Button asChild variant="ghost" size="sm">
                  <Link href="/panel">{t("panel")}</Link>
                </Button>
              )}
              <Button asChild variant="ghost" size="sm">
                <Link href="/randevularim">{t("myAppointments")}</Link>
              </Button>
              <form action={logoutAction}>
                <Button variant="ghost" size="sm" type="submit">
                  {t("logout")}
                </Button>
              </form>
            </>
          ) : (
            <Button asChild variant="ghost" size="sm">
              <Link href="/giris">{t("login")}</Link>
            </Button>
          )}
          {pathname !== "/randevu" && (
            <Button asChild size="sm" className="ml-1 rounded-none">
              <Link href="/randevu">{t("book")}</Link>
            </Button>
          )}
          <LocaleSwitcher className="ml-1" />
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
