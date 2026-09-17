"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/panel", label: "Bugün", admin: false },
  { href: "/panel/randevular", label: "Randevular", admin: false },
  { href: "/panel/izinler", label: "İzinler", admin: false },
  { href: "/panel/musteriler", label: "Müşteriler", admin: false },
  { href: "/panel/hizmetler", label: "Hizmetler", admin: true },
  { href: "/panel/berberler", label: "Berberler", admin: true },
  { href: "/panel/yorumlar", label: "Yorumlar", admin: true },
  { href: "/panel/ayarlar", label: "Ayarlar", admin: true },
];

export function PanelNav({ isAdmin }: { isAdmin: boolean }) {
  const path = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto px-2 pb-2 md:flex-col md:overflow-visible">
      {ITEMS.filter((i) => isAdmin || !i.admin).map((i) => (
        <Link key={i.href} href={i.href}
          className={cn("whitespace-nowrap rounded-lg px-3 py-2 text-sm", path === i.href ? "bg-primary text-primary-foreground" : "hover:bg-muted")}>
          {i.label}
        </Link>
      ))}
    </nav>
  );
}
