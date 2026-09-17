import Link from "next/link";
import { AfroPattern } from "@/components/brand/AfroPattern";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { logoutAction } from "@/actions/auth";
import type { SessionUser } from "@/lib/auth-helpers";

const LINK = "border-b border-primary-foreground/50 pb-0.5 hover:border-primary-foreground";

export function SiteFooter({ shopName, user }: { shopName: string; user: SessionUser | null }) {
  return (
    <footer className="relative overflow-hidden bg-primary text-primary-foreground">
      <AfroPattern variant="mud" size={80} opacity={0.12} />
      <div className="relative mx-auto max-w-6xl px-5 py-14">
        <div className="flex flex-wrap items-end justify-between gap-8">
          <p className="display-lg">{shopName.toLocaleUpperCase("tr-TR")}</p>
          <nav aria-label="Alt bağlantılar" className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <Link href="/randevu" className={LINK}>Randevu al</Link>
            {user ? (
              <>
                <Link href="/randevularim" className={LINK}>Randevularım</Link>
                {user.role !== "CUSTOMER" && <Link href="/panel" className={LINK}>Panel</Link>}
                <form action={logoutAction}>
                  <button type="submit" className={LINK}>Çıkış</button>
                </form>
              </>
            ) : (
              <>
                <Link href="/giris" className={LINK}>Giriş</Link>
                <Link href="/kayit" className={LINK}>Kayıt ol</Link>
              </>
            )}
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
