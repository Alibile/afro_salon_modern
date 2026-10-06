import { Inter } from "next/font/google";
import { getTranslations } from "next-intl/server";
import { requireStaff } from "@/lib/auth-helpers";
import { getSettings } from "@/lib/settings";
import { PanelNav } from "@/components/panel/PanelNav";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { LocaleSwitcher } from "@/components/brand/LocaleSwitcher";
import { BrandMark } from "@/components/brand/BrandMark";
import { logoutAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { noIndex } from "@/lib/seo";

/**
 * Panelin tamamı dizin dışı. Yerleşime konduğu için altındaki her sayfa
 * aynı etiketi devralır.
 */
export const metadata = noIndex;

/**
 * Panel bir araçtır ve kendi diliyle kalır: yalnızca Inter, 6 px köşe (bkz.
 * `globals.css`, `.panel-typography`). Inter yalnızca burada yüklenir,
 * böylece ana sayfaya fazladan bir yazı tipi inmez.
 */
const inter = Inter({ subsets: ["latin", "latin-ext"], variable: "--font-panel-sans", display: "swap" });

/**
 * Kabuk: `lg` ve üstünde solda 240 px yapışkan kenar çubuğu (işaret + salon
 * adı, gruplanmış menü, altta kullanıcı, dil, tema, çıkış); altında üstte
 * tek satır başlık ve yatay kayan menü şeridi.
 */
export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const [user, settings, t] = await Promise.all([requireStaff(), getSettings(), getTranslations("nav")]);
  const isAdmin = user.role === "ADMIN";
  return (
    <div className={`${inter.variable} panel-typography min-h-dvh lg:grid lg:grid-cols-[240px_1fr]`}>
      <aside className="border-b border-border lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col lg:border-r lg:border-b-0">
        <div className="flex items-center justify-between gap-3 px-4 py-3 lg:px-5 lg:py-4">
          <span className="flex min-w-0 items-center gap-2 text-primary">
            <BrandMark size={20} className="shrink-0" />
            <span className="truncate text-sm font-semibold text-foreground">{settings.shopName}</span>
          </span>
          <div className="flex items-center gap-1 lg:hidden">
            <ThemeToggle />
            <form action={logoutAction}>
              <Button variant="ghost" size="sm">{t("logout")}</Button>
            </form>
          </div>
        </div>
        <PanelNav isAdmin={isAdmin} />
        <div className="hidden lg:mt-auto lg:block lg:border-t lg:border-border lg:px-5 lg:py-4">
          <p className="truncate text-xs text-muted-foreground">{user.name}</p>
          <div className="mt-2 flex items-center justify-between gap-2">
            <LocaleSwitcher />
            <div className="flex items-center gap-1">
              <ThemeToggle />
              <form action={logoutAction}>
                <Button variant="ghost" size="sm">{t("logout")}</Button>
              </form>
            </div>
          </div>
        </div>
      </aside>
      <main className="min-w-0 px-5 py-6 md:px-8 md:py-8">{children}</main>
    </div>
  );
}
