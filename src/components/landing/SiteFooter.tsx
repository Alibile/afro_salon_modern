import Link from "next/link";
import { AfroPattern } from "@/components/brand/AfroPattern";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export function SiteFooter({ shopName }: { shopName: string }) {
  return (
    <footer className="relative overflow-hidden bg-primary text-primary-foreground">
      <AfroPattern variant="mud" size={80} opacity={0.14} />
      <div className="relative mx-auto max-w-6xl px-5 py-14">
        <div className="flex flex-wrap items-end justify-between gap-8">
          <p className="display-lg">{shopName.toLocaleUpperCase("tr-TR")}</p>
          <nav aria-label="Alt bağlantılar" className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <Link href="/randevu" className="border-b border-primary-foreground/50 pb-0.5 hover:border-primary-foreground">Randevu al</Link>
            <Link href="/randevularim" className="border-b border-primary-foreground/50 pb-0.5 hover:border-primary-foreground">Randevularım</Link>
            <Link href="/giris" className="border-b border-primary-foreground/50 pb-0.5 hover:border-primary-foreground">Giriş</Link>
            <Link href="/kayit" className="border-b border-primary-foreground/50 pb-0.5 hover:border-primary-foreground">Kayıt ol</Link>
            <ThemeToggle />
          </nav>
        </div>
        <p className="mt-12 border-t border-primary-foreground/30 pt-5 text-sm text-primary-foreground/80">
          Aynı gün randevu. Yarına değil, bugüne.
        </p>
      </div>
    </footer>
  );
}
