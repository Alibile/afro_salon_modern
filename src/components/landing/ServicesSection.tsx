import { Droplets, Scissors } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { telHref } from "@/components/brand/SocialLinks";
import { formatKurus } from "@/lib/money";
import { singlePackage } from "@/lib/package";
import type { AppLocale } from "@/i18n/routing";

export type ServiceRowItem = {
  id: string;
  name: string;
  durationMinutes: number;
  priceKurus: number;
};

/**
 * Sakal için lucide'da uygun bir ikon yok: açık ustura aynı çizim diliyle
 * burada çizilir — 24'lük kutu, 2 birim kalınlık, yuvarlak uçlar, `currentColor`.
 */
function Razor({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2.5 18 13 7.5a3.5 3.5 0 0 1 5 5L7.5 23" />
      <path d="M2.5 18a2.5 2.5 0 0 1-1-2v-2.5" />
    </svg>
  );
}

/**
 * Paketin içindekiler hizmet adına bakmaz: salonun tek paketi yıkama, kesim ve
 * sakaldan oluşuyor ve bu üç satır sabit metindir (`landing.package.includes`).
 */
const INCLUDES = [
  { key: "includes.wash", Icon: Droplets },
  { key: "includes.cut", Icon: Scissors },
  { key: "includes.beard", Icon: Razor },
] as const;

/**
 * Aktif hizmet **tam olarak bir** taneyse bölüm fiyat listesi değil paket
 * kartıdır. Panelden ikinci bir hizmet eklendiği anda aynı bölüm liste
 * düzenine döner — düzen içeriğin şeklinden çıkar.
 */
export function ServicesSection({
  title,
  note,
  packageSectionNote,
  packageNote,
  services,
  phone,
}: {
  title: string;
  note: string;
  packageSectionNote: string;
  packageNote: string;
  services: ServiceRowItem[];
  phone: string;
}) {
  const t = useTranslations("landing.services");
  const tPackage = useTranslations("landing.package");
  const tCommon = useTranslations("common");
  const locale = useLocale() as AppLocale;
  const single = singlePackage(services);
  return (
    <section id="hizmetler" className="scroll-mt-16 border-b border-border">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-5 py-14 md:grid-cols-12 md:px-10 md:py-24">
        <div className="md:col-span-4">
          <h2 className="display-lg">{title}</h2>
          <p className="mt-3 text-muted-foreground">
            {single ? packageSectionNote : note}
          </p>
        </div>
        {services.length === 0 ? (
          <p className="text-muted-foreground md:col-span-8">
            {t("empty")}{" "}
            <a href={telHref(phone)} className="underline underline-offset-4">
              {phone}
            </a>
          </p>
        ) : single ? (
          <div className="md:col-span-8">
            <div className="grid grid-cols-1 gap-8 border-t border-border pt-6 sm:grid-cols-[1fr_auto] sm:gap-12">
              <div>
                <h3 className="display-lg">{single.name}</h3>
                <p className="mt-8 text-sm font-medium">
                  {tPackage("includesTitle")}
                </p>
                <ul className="mt-3 space-y-3">
                  {INCLUDES.map(({ key, Icon }) => (
                    <li key={key} className="flex items-center gap-3">
                      <Icon className="size-5 shrink-0 text-primary" />
                      <span className="text-lg">{tPackage(key)}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-col items-start sm:items-end sm:text-right">
                <p className="display-lg text-primary tabular-nums">
                  {formatKurus(single.priceKurus, locale)}
                </p>
                <p className="mt-2 text-lg text-muted-foreground">
                  {tCommon("minutes", { count: single.durationMinutes })}
                </p>
                <Button asChild size="lg" className="mt-8">
                  <Link href="/randevu">{tPackage("book")}</Link>
                </Button>
              </div>
            </div>
            <p className="mt-10 border-t border-border pt-5 text-muted-foreground">
              {packageNote}
            </p>
          </div>
        ) : (
          <ul className="border-t border-border md:col-span-8">
            {services.map((s) => (
              <li
                key={s.id}
                className="grid grid-cols-[1fr_auto] items-baseline gap-x-6 gap-y-1 border-b border-border py-5"
              >
                <span className="display-sm">{s.name}</span>
                <span className="text-lg tabular-nums">
                  {formatKurus(s.priceKurus, locale)}
                </span>
                <span className="text-sm text-muted-foreground">
                  {tCommon("minutes", { count: s.durationMinutes })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
