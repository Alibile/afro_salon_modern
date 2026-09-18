import { routing, type AppLocale } from "@/i18n/routing";

/**
 * Proxy (middleware) URL'leri next-intl'in `Link`/`redirect` sarmalayıcılarından
 * önce görür: `/en/panel` henüz `/panel` değildir. Yetki kuralları yolun kendisine
 * bakar, dile değil; bu yüzden önek burada bir kez soyulur, üretilen yönlendirme
 * adresine yine burada geri eklenir.
 *
 * Türkçe öneksiz olduğundan (`localePrefix: "as-needed"`) `withLocale("tr", …)`
 * yolu olduğu gibi döner.
 */
export type StrippedPath = { locale: AppLocale; path: string };

const PREFIXED = routing.locales.filter((l) => l !== routing.defaultLocale);

/**
 * Art arda gelen eğik çizgiler tek çizgiye iner. `/en//panel` tarayıcıdan da
 * gelebilir, elle yazılmış bir `next` parametresinden de; soyma yapılmadan
 * önce normalleştirilmezse `/panel` yerine `//panel` kalır ve `//panel`
 * tarayıcı için protokolü koruyan bir *dış* adrestir (`//panel` → başka bir
 * host). Yani bu yalnızca temizlik değil, açık yönlendirme kapatması.
 */
function collapseSlashes(pathname: string): string {
  const collapsed = pathname.replace(/\/{2,}/g, "/");
  return collapsed === "" ? "/" : collapsed;
}

export function stripLocale(pathname: string): StrippedPath {
  const clean = collapseSlashes(pathname);
  for (const locale of PREFIXED) {
    const prefix = `/${locale}`;
    if (clean === prefix) return { locale, path: "/" };
    if (clean.startsWith(`${prefix}/`)) return { locale, path: clean.slice(prefix.length) };
  }
  return { locale: routing.defaultLocale, path: clean };
}

export function withLocale(locale: AppLocale, path: string): string {
  if (locale === routing.defaultLocale) return path;
  if (path === "/") return `/${locale}`;
  return `/${locale}${path}`;
}
