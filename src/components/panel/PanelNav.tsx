"use client";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/**
 * Menü iki gruptur: günlük iş (her personel) ve yönetim (yalnızca admin).
 * Profil ayrı durur, kabuğun altında. Etiket değil anahtar taşınır; metni
 * `panel.nav` ad alanı verir.
 */
const GROUPS = [
  {
    key: "groupDaily",
    admin: false,
    items: [
      { href: "/panel", key: "today" },
      { href: "/panel/randevular", key: "appointments" },
      { href: "/panel/izinler", key: "timeOff" },
      { href: "/panel/musteriler", key: "customers" },
    ],
  },
  {
    key: "groupManage",
    admin: true,
    items: [
      { href: "/panel/hizmetler", key: "services" },
      { href: "/panel/berberler", key: "barbers" },
      { href: "/panel/yorumlar", key: "testimonials" },
      { href: "/panel/galeri", key: "gallery" },
      { href: "/panel/ayarlar", key: "settings" },
    ],
  },
] as const;

const PROFILE = { href: "/panel/profil", key: "profile" } as const;

/**
 * `lg` ve üstünde dikey liste: grup başlıkları görünür, aktif madde sol
 * çizgi + hafif zemin. Altında yatay kayan tek şerit: grup başlıkları gizli,
 * aktif madde alt çizgiyle. Aktiflik yolun tam eşleşmesidir; alt sayfalar
 * (`/panel/berberler/[id]`) üst maddeyi aktif sayar.
 */
export function PanelNav({ isAdmin }: { isAdmin: boolean }) {
  const t = useTranslations("panel.nav");
  const path = usePathname();
  const isActive = (href: string) => (href === "/panel" ? path === href : path === href || path.startsWith(href + "/"));
  const item = (i: { href: string; key: string }) => {
    const active = isActive(i.href);
    return (
      <Link
        key={i.href}
        href={i.href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex h-11 shrink-0 items-center px-3 text-sm whitespace-nowrap transition-colors lg:h-10",
          // Telefon: alt çizgi. Geniş ekran: sol çizgi + zemin.
          "border-b-2 lg:border-b-0 lg:border-l-2",
          active ? "border-primary bg-primary/8 font-medium text-foreground" : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground",
        )}
      >
        {t(i.key as never)}
      </Link>
    );
  };
  return (
    <nav aria-label={t("menuLabel")} className="flex gap-1 overflow-x-auto px-3 py-2 scrollbar-none lg:flex-col lg:gap-0 lg:overflow-visible lg:px-0 lg:py-0">
      {GROUPS.filter((g) => isAdmin || !g.admin).map((g) => (
        <div key={g.key} className="contents lg:block">
          <p className="hidden px-3 pt-4 pb-1 text-xs font-medium text-muted-foreground lg:block">{t(g.key)}</p>
          {g.items.map(item)}
        </div>
      ))}
      <div className="contents lg:mt-4 lg:block lg:border-t lg:border-border lg:pt-2">{item(PROFILE)}</div>
    </nav>
  );
}
