import { useLocale } from "next-intl";
import { BrandMark } from "./BrandMark";
import { intlLocale } from "@/lib/intl";
import { cn } from "@/lib/utils";

/**
 * İşaret + yazı markası. Salonun adı ayarlardan geldiği için (panelden
 * değiştirilebilir) hiçbir yerde sabit yazılmaz; iki varyant da adı dışarıdan
 * alır.
 *
 * - `compact`: üst çubuk. İşaret solda, ad tek satırda. `xl` altında kısa ad
 *   ("Afro Salon Modern" → "Afro Salon") kullanılır: 1280 px'te altı bölüm
 *   bağlantısı, dil anahtarı, tema düğmesi, hesap bağlantısı ve randevu
 *   düğmesi aynı satıra sığmalı ve marka adı kesilmemeli.
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
            <span className="xl:hidden">{short}</span>
            <span className="hidden xl:inline">{name}</span>
          </>
        )}
      </span>
    </span>
  );
}
