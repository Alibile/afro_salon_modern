"use client";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/** Etiket değil anahtar taşınır; metni `panel.nav` ad alanı verir. */
const ITEMS = [
  { href: "/panel", key: "today", admin: false },
  { href: "/panel/randevular", key: "appointments", admin: false },
  { href: "/panel/izinler", key: "timeOff", admin: false },
  { href: "/panel/musteriler", key: "customers", admin: false },
  { href: "/panel/profil", key: "profile", admin: false },
  { href: "/panel/hizmetler", key: "services", admin: true },
  { href: "/panel/berberler", key: "barbers", admin: true },
  { href: "/panel/yorumlar", key: "testimonials", admin: true },
  { href: "/panel/galeri", key: "gallery", admin: true },
  { href: "/panel/ayarlar", key: "settings", admin: true },
] as const;

export function PanelNav({ isAdmin }: { isAdmin: boolean }) {
  const t = useTranslations("panel.nav");
  const path = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto px-2 pb-2 md:flex-col md:overflow-visible">
      {ITEMS.filter((i) => isAdmin || !i.admin).map((i) => (
        <Link key={i.href} href={i.href}
          className={cn("whitespace-nowrap rounded-lg px-3 py-2 text-sm", path === i.href ? "bg-primary text-primary-foreground" : "hover:bg-muted")}>
          {t(i.key)}
        </Link>
      ))}
    </nav>
  );
}
