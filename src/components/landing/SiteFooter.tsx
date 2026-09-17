import Link from "next/link";
import { AfroPattern } from "@/components/brand/AfroPattern";
import { SocialLinks, type SocialSettings } from "@/components/brand/SocialLinks";
import { SECTION_LINKS } from "./sections";
import { logoutAction } from "@/actions/auth";
import type { SessionUser } from "@/lib/auth-helpers";

const LINK = "border-b border-primary-foreground/40 pb-0.5 transition-colors hover:border-primary-foreground";
const HEADING = "font-display text-xl tracking-[0.18em] text-primary-foreground/80";

export function SiteFooter({
  shopName,
  user,
  social,
  address,
  phone,
  email,
  statusText,
}: {
  shopName: string;
  user: SessionUser | null;
  social: SocialSettings;
  address: string;
  phone: string;
  email: string;
  statusText: string;
}) {
  const year = new Date().getFullYear();
  return (
    <footer className="relative overflow-hidden bg-primary text-primary-foreground">
      <AfroPattern variant="mud" size={80} opacity={0.12} />
      <div className="relative mx-auto max-w-6xl px-5 py-14">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 sm:gap-10 lg:grid-cols-4">
          <div>
            <p className="display-lg">{shopName.toLocaleUpperCase("tr-TR")}</p>
            <p className="editorial-note mt-4 text-primary-foreground/90">Aynı gün randevu. Yarına değil, bugüne.</p>
            <SocialLinks
              settings={social}
              className="-ml-2 mt-5"
              linkClassName="text-primary-foreground/80 hover:text-primary-foreground"
              iconClassName="size-5"
            />
          </div>

          <nav aria-label="Site bağlantıları">
            <h2 className={HEADING}>SİTE</h2>
            <ul className="mt-4 space-y-2.5">
              {SECTION_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className={LINK}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Hızlı bağlantılar">
            <h2 className={HEADING}>HIZLI BAĞLANTILAR</h2>
            <ul className="mt-4 space-y-2.5">
              <li>
                <Link href="/randevu" className={LINK}>
                  Randevu al
                </Link>
              </li>
              {user ? (
                <>
                  <li>
                    <Link href="/randevularim" className={LINK}>
                      Randevularım
                    </Link>
                  </li>
                  {user.role !== "CUSTOMER" && (
                    <li>
                      <Link href="/panel" className={LINK}>
                        Panel
                      </Link>
                    </li>
                  )}
                  <li>
                    <form action={logoutAction}>
                      <button type="submit" className={LINK}>
                        Çıkış
                      </button>
                    </form>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <Link href="/giris" className={LINK}>
                      Giriş
                    </Link>
                  </li>
                  <li>
                    <Link href="/kayit" className={LINK}>
                      Kayıt ol
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </nav>

          <div>
            <h2 className={HEADING}>İLETİŞİM</h2>
            <address className="mt-4 space-y-2.5 not-italic">
              <p className="text-primary-foreground/90">{address}</p>
              <p>
                <a href={`tel:${phone.replace(/\s/g, "")}`} className={LINK}>
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
            <p className="editorial-note mt-4 text-primary-foreground/90">{statusText}</p>
          </div>
        </div>

        <p className="mt-14 border-t border-primary-foreground/30 pt-5 text-sm text-primary-foreground/80">
          © {year} {shopName}. Tüm hakları saklıdır.
        </p>
      </div>
    </footer>
  );
}
