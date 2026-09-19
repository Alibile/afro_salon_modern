import { NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { auth } from "@/lib/auth";
import { routing } from "@/i18n/routing";
import { stripLocale, withLocale } from "@/lib/locale-path";

/**
 * Tek bir proxy iki işi sırayla yapar:
 *
 * 1. **Yetki.** Auth.js sarmalayıcısı oturumu okur. Kural yolun kendisine
 *    bakar, diline değil: `/en/panel` da `/panel` kadar korumalıdır, bu yüzden
 *    dil öneki `stripLocale` ile bir kez soyulur. Üretilen yönlendirme adresine
 *    önek `withLocale` ile geri eklenir — `/en/panel` isteyen ziyaretçi
 *    `/en/giris`e düşer, İngilizce sayfadan Türkçeye savrulmaz.
 * 2. **Dil.** Yetki bir yönlendirme üretmediyse istek next-intl middleware'ine
 *    devredilir: öneksiz yollar varsayılan dile göre `[locale]` segmentine
 *    yeniden yazılır, EN/FR için `/en`, `/fr` öneki uygulanır, `NEXT_LOCALE`
 *    çerezi eşitlenir.
 *
 * `api`, `_next` ve uzantılı dosyalar matcher dışında kalır; `/api/*` ağacı
 * `[locale]` altına taşınmadı ve taşınmamalı.
 *
 * **Kanonik olmayan önekler ve neden güvenliler.** `stripLocale` yalnızca
 * kanonik önekleri (`/en`, `/fr`) tanır. `/EN/panel` (büyük harf) ya da
 * `/tr/panel` (varsayılan dil öneksizdir, yani böyle bir adres yoktur) soyulmaz
 * ve buradaki yetki kuralına `/EN/panel` / `/tr/panel` olarak görünür — yani
 * `/panel` sanılmaz, korumaya takılmaz. Bu, yalnızca next-intl bu adresleri
 * **yönlendirdiği** (redirect) için güvenlidir: ziyaretçi kanonik adrese
 * (`/en/panel`, `/panel`) taşınır ve proxy isteği bir kez daha, bu kez doğru
 * soyulmuş yoluyla görür. next-intl bu önekleri sessizce *yeniden yazsaydı*
 * (rewrite) korumalı sayfa yetki kontrolü hiç çalışmadan render edilirdi.
 * Yani buradaki sıra — önce yetki, sonra dil — ancak dil katmanının kanonik
 * olmayan önekte yönlendirme yapması koşuluyla doğrudur.
 */
const intlMiddleware = createMiddleware(routing);

export const proxy = auth((req) => {
  const { search } = req.nextUrl;
  const { locale, path } = stripLocale(req.nextUrl.pathname);
  const user = req.auth?.user;

  const toLogin = () => {
    const url = new URL(withLocale(locale, "/giris"), req.nextUrl);
    url.searchParams.set("next", withLocale(locale, path) + search);
    return NextResponse.redirect(url);
  };

  if (path === "/panel" || path.startsWith("/panel/")) {
    if (!user) return toLogin();
    if (user.role !== "BARBER" && user.role !== "ADMIN") {
      return NextResponse.redirect(new URL(withLocale(locale, "/403"), req.nextUrl));
    }
  }

  if ((path === "/randevularim" || path.startsWith("/randevularim/")) && !user) {
    return toLogin();
  }

  return intlMiddleware(req);
});

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
