import { useLocale } from "next-intl";
import { BrandMark } from "./BrandMark";
import { intlLocale } from "@/lib/intl";
import { cn } from "@/lib/utils";

/**
 * İşaret + yazı markası. Salonun adı ayarlardan geldiği için (panelden
 * değiştirilebilir) hiçbir yerde sabit yazılmaz; iki varyant da adı dışarıdan
 * alır.
 *
 * - `compact`: üst çubuk. İşaret solda, ad tek satırda. Yalnızca `sm` altında
 *   (telefon) kısa ada düşülür: "Afro Salon Modern" 390 px'te tema düğmesi,
 *   randevu düğmesi ve menü düğmesiyle aynı satıra sığmıyor. `sm` üstünde tam
 *   ad basılır — masaüstü çubuğu 1280 px'ten itibaren açıldığı için (bkz.
 *   `SiteNav`) 1024–1279 arasında zaten bolca yer var, 1280'de de tam ad
 *   bağlantıların yanına sığıyor.
 * - `stacked`: altbilgi. İşaret üstte, adın her kelimesi altında ayrı satırda.
 */
export type BrandLogoVariant = "compact" | "stacked";

/** Uzun adın ilk iki kelimesi; iki kelimeden kısa adlar olduğu gibi kalır. */
function shortName(name: string): string {
  const words = name.trim().split(/\s+/);
  return words.length > 2 ? words.slice(0, 2).join(" ") : name.trim();
}

export function BrandLogo({
  name,
  variant = "compact",
  className,
  markSize,
}: {
  name: string;
  variant?: BrandLogoVariant;
  className?: string;
  markSize?: number;
}) {
  const locale = useLocale();
  const tag = intlLocale(locale);

  if (variant === "stacked") {
    const words = name.trim().split(/\s+/);
    return (
      <span className={cn("flex flex-col items-start gap-4", className)}>
        <BrandMark size={markSize ?? 56} />
        <span className="display-lg leading-[0.88]">
          {words.map((word, i) => (
            <span key={`${word}-${i}`} className="block">
              {word.toLocaleUpperCase(tag)}
            </span>
          ))}
        </span>
      </span>
    );
  }

  const short = shortName(name);
  return (
    <span className={cn("flex min-w-0 items-center gap-2.5", className)}>
      <BrandMark size={markSize ?? 28} className="shrink-0" />
      <span className="truncate">
        {short === name.trim() ? (
          name
        ) : (
          <>
            <span className="sm:hidden">{short}</span>
            <span className="hidden sm:inline">{name}</span>
          </>
        )}
      </span>
    </span>
  );
}
