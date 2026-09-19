import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { AfroPattern } from "@/components/brand/AfroPattern";
import { MotionProvider } from "@/components/motion/MotionProvider";
import { Parallax } from "@/components/motion/Parallax";
import { Reveal } from "@/components/motion/Reveal";
import { getSettings } from "@/lib/settings";
import { noIndex } from "@/lib/seo";

/**
 * Giriş ve kayıt sayfaları dizine girmez: arama sonucundan gelen ziyaretçinin
 * göreceği sayfa ana sayfadır, form değil.
 */
export const metadata = noIndex;

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const [settings, t] = await Promise.all([getSettings(), getTranslations("auth")]);
  return (
    <div className="grid min-h-dvh grid-cols-1 md:grid-cols-2">
      {/* Hareket yalnızca marka panelinde: form sütunu sabittir. */}
      <MotionProvider>
        <aside className="relative flex flex-col justify-between gap-10 overflow-hidden bg-primary p-6 text-primary-foreground md:p-12">
          <Parallax className="absolute inset-x-0 -top-12 -bottom-12" range={36} speed={1} ariaHidden>
            <AfroPattern variant="kente" size={84} opacity={0.12} />
          </Parallax>
          <Link href="/" className="relative font-display text-2xl font-medium tracking-[0.02em]">
            {settings.shopName}
          </Link>
          <Reveal className="relative">
            <p className="display-lg">{t("asideHeadline")}</p>
            <p className="editorial-note mt-4 max-w-[32ch] text-lg text-primary-foreground/85">{t("asideNote")}</p>
          </Reveal>
          <p className="relative text-sm text-primary-foreground/75">{settings.address}</p>
        </aside>
      </MotionProvider>
      <main className="flex items-center justify-center px-5 py-12 md:px-10">
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  );
}
