import { createTranslator } from "next-intl";
import { SHOP_TZ } from "@/lib/time";
import type { AppLocale } from "@/i18n/routing";
import tr from "../../../messages/tr.json";
import en from "../../../messages/en.json";
import fr from "../../../messages/fr.json";

/**
 * E-posta metinleri `getTranslations()` yerine `createTranslator()` kullanır.
 *
 * `getTranslations()` dili istekten türetir (`getRequestConfig` + React
 * `cache`), oysa e-postanın dili alıcının kayıtlı tercihidir ve gövde bir
 * isteğin içinde render edilmek zorunda değildir (arka planda çalışan bir
 * gönderim de aynı metni üretebilmeli). `createTranslator` next-intl'in bunun
 * için verdiği istekten bağımsız API'si; aynı ICU motorunu kullanır, mesajları
 * doğrudan alır ve testte de çalışır.
 *
 * Üç mesaj dosyası birden bundle'a girer; bu modül yalnızca sunucuda, e-posta
 * gönderiminde yükleniyor, istemciye inen bir maliyeti yok.
 */
const MESSAGES = { tr, en, fr } as const;

export type EmailNamespace = keyof (typeof tr)["email"];

export function emailTranslator<N extends EmailNamespace>(locale: AppLocale, namespace: N) {
  return createTranslator({
    locale,
    timeZone: SHOP_TZ,
    messages: MESSAGES[locale],
    namespace: `email.${namespace}` as const,
  });
}
