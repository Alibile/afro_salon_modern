import { Inter } from "next/font/google";
import { requireStaff } from "@/lib/auth-helpers";
import { PanelNav } from "@/components/panel/PanelNav";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { LocaleSwitcher } from "@/components/brand/LocaleSwitcher";
import { logoutAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";

/**
 * Panelin görsel dili Tur 2'de donduruldu: gövde Inter, başlıklar Bebas.
 * Ana sayfanın editoryal tipografisi (Fraunces + Manrope) müşteriye bakan
 * yüzeylerin dili; panel bir araç ve kendi diliyle kalır. Inter yalnızca burada
 * yüklenir, böylece ana sayfaya fazladan bir yazı tipi inmez. Değişken
 * eşlemeleri ve başlık kuralları `globals.css` içindeki `.panel-typography`.
 */
const inter = Inter({ subsets: ["latin", "latin-ext"], variable: "--font-panel-sans", display: "swap" });

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const user = await requireStaff();
  return (
    <div className={`${inter.variable} panel-typography min-h-dvh md:grid md:grid-cols-[220px_1fr]`}>
      <aside className="border-b md:border-b-0 md:border-r">
        <div className="flex items-center justify-between p-4">
          <span className="font-display text-xl text-primary">Panel</span>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <form action={logoutAction}><Button variant="ghost" size="sm">Çıkış</Button></form>
          </div>
        </div>
        <PanelNav isAdmin={user.role === "ADMIN"} />
        <div className="flex items-center justify-between gap-2 px-4 pb-3">
          <p className="text-xs text-muted-foreground">{user.name}</p>
          <LocaleSwitcher />
        </div>
      </aside>
      <main className="p-4 md:p-6">{children}</main>
    </div>
  );
}
