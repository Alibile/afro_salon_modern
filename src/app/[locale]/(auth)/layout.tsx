import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { AfroPattern } from "@/components/brand/AfroPattern";
import { getSettings } from "@/lib/settings";
import { noIndex } from "@/lib/seo";

/**
 * Giriş ve kayıt sayfaları dizine girmez: arama sonucundan gelen ziyaretçinin
 * göreceği sayfa ana sayfadır, form değil.
 */
export const metadata = noIndex;

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [settings, t] = await Promise.all([
    getSettings(),
    getTranslations("auth"),
  ]);
  return (
    <div className="grid min-h-dvh grid-cols-1 md:grid-cols-2">
      <aside className="relative flex flex-col justify-between gap-10 overflow-hidden bg-primary p-6 text-primary-foreground md:p-12">
        <AfroPattern variant="kente" size={84} opacity={0.12} />
        <Link
          href="/"
          className="relative font-display text-2xl font-medium tracking-[0.02em]"
        >
          {settings.shopName}
        </Link>
        <div className="relative">
          <p className="display-hero">{t("asideHeadline")}</p>
          <p className="editorial-note mt-4 max-w-[32ch] text-lg text-primary-foreground/85">
            {t("asideNote")}
          </p>
        </div>
        <p className="relative text-sm text-primary-foreground/75">
          {settings.address}
        </p>
      </aside>
      <main className="flex items-center justify-center px-5 py-12 md:px-10">
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  );
}
