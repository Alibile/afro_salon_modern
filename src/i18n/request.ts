import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

/**
 * `[locale]` segmenti aslında bilinmeyen yollar için de eşleşir (`/de`,
 * `/robots.txt`), bu yüzden gelen değer her zaman doğrulanır ve geçersizse
 * varsayılan dile düşülür; sayfanın kendisi zaten 404 verir.
 */
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;
  return {
    locale,
    // Salon tek bir şehirde çalışıyor: tarih ve saat biçimleri dil değişse de
    // İstanbul saatine göre üretilir.
    timeZone: "Europe/Istanbul",
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
