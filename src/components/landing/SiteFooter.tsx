import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { AfroPattern } from "@/components/brand/AfroPattern";
import { LocaleSwitcher } from "@/components/brand/LocaleSwitcher";
import { SocialLinks, telHref, type SocialSettings } from "@/components/brand/SocialLinks";
import { SECTION_LINKS } from "./sections";
import { shopStatusText, type ShopStatus } from "@/lib/shop-status";
import { intlLocale } from "@/lib/intl";
import { logoutAction } from "@/actions/auth";
import type { SessionUser } from "@/lib/auth-helpers";

const LINK = "border-b border-primary-foreground/40 pb-0.5 transition-colors hover:border-primary-foreground";
/* Küçük kapital sütun başlıkları Bebas'ın tek işi: sıkışık, geniş aralıklı, gövdeye karışmaz. */
const HEADING = "label text-primary-foreground/70";

export async function SiteFooter({
  shopName,
  user,
  social,
  address,
  phone,
  email,
  status,
}: {
  shopName: string;
  user: SessionUser | null;
  social: SocialSettings;
  address: string;
  phone: string;
  email: string;
  status: ShopStatus;
}) {
  const [t, tFooter, tStatus, locale] = await Promise.all([
    getTranslations("nav"),
    getTranslations("footer"),
    getTranslations("common.status"),
    getLocale(),
  ]);
  // Yıl dize olarak geçer: ICU sayıyı biçimlendirir ve Türkçede
  // binlik ayracı koyardı ("2.026").
  const year = String(new Date().getFullYear());
  return (
    <footer className="relative overflow-hidden bg-primary text-primary-foreground">
      <AfroPattern variant="mud" size={80} opacity={0.12} />
      <div className="relative mx-auto max-w-6xl px-5 py-14">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 sm:gap-10 lg:grid-cols-4">
          <div>
            <p className="display-lg">{shopName.toLocaleUpperCase(intlLocale(locale))}</p>
            <p className="editorial-note mt-4 text-primary-foreground/90">{tFooter("tagline")}</p>
            <SocialLinks
              settings={social}
              className="-ml-2 mt-5"
              linkClassName="text-primary-foreground/80 hover:text-primary-foreground"
              iconClassName="size-5"
            />
          </div>

          <nav aria-label={t("siteLinks")}>
            <h2 className={HEADING}>{tFooter("site")}</h2>
            <ul className="mt-4 space-y-2.5">
              {SECTION_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className={LINK}>
                    {t(l.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label={t("quickLinks")}>
            <h2 className={HEADING}>{tFooter("quickLinks")}</h2>
            <ul className="mt-4 space-y-2.5">
              <li>
                <Link href="/randevu" className={LINK}>
                  {t("book")}
                </Link>
              </li>
              {user ? (
                <>
                  <li>
                    <Link href="/randevularim" className={LINK}>
                      {t("myAppointments")}
                    </Link>
                  </li>
                  {user.role !== "CUSTOMER" && (
                    <li>
                      <Link href="/panel" className={LINK}>
                        {t("panel")}
                      </Link>
                    </li>
                  )}
                  <li>
                    <form action={logoutAction}>
                      <button type="submit" className={LINK}>
                        {t("logout")}
                      </button>
                    </form>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <Link href="/giris" className={LINK}>
                      {t("login")}
                    </Link>
                  </li>
                  <li>
                    <Link href="/kayit" className={LINK}>
                      {t("register")}
                    </Link>
                  </li>
                </>
              )}
            </ul>
            <LocaleSwitcher tone="inverted" className="mt-6 -ml-1" />
          </nav>

          <div>
            <h2 className={HEADING}>{tFooter("contact")}</h2>
            <address className="mt-4 space-y-2.5 not-italic">
              <p className="text-primary-foreground/90">{address}</p>
              <p>
                <a href={telHref(phone)} className={LINK}>
                  {phone}
                </a>
              </p>
              {email.trim() && (
                <p>
                  <a href={`mailto:${email.trim()}`} className={`${LINK} break-words`}>
                    {email.trim()}
                  </a>
                </p>
              )}
            </address>
            <p className="editorial-note mt-4 text-primary-foreground/90">{shopStatusText(tStatus, status)}</p>
          </div>
        </div>

        <p className="mt-14 border-t border-primary-foreground/30 pt-5 text-sm text-primary-foreground/80">
          {tFooter("rights", { year, shopName })}
        </p>
      </div>
    </footer>
  );
}
