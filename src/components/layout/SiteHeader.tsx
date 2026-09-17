import Link from "next/link";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/actions/auth";
import type { SessionUser } from "@/lib/auth-helpers";

export function SiteHeader({ user, shopName }: { user: SessionUser | null; shopName: string }) {
  return (
    <header className="sticky top-0 z-10 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
        <Link href="/" className="font-display text-2xl tracking-wider text-primary">{shopName}</Link>
        <div className="flex items-center gap-1">
          {user ? (
            <>
              {user.role !== "CUSTOMER" && <Button asChild variant="ghost" size="sm"><Link href="/panel">Panel</Link></Button>}
              <Button asChild variant="ghost" size="sm"><Link href="/randevularim">Randevularım</Link></Button>
              <form action={logoutAction}><Button variant="ghost" size="sm" type="submit">Çıkış</Button></form>
            </>
          ) : (
            <Button asChild variant="ghost" size="sm"><Link href="/giris">Giriş</Link></Button>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
