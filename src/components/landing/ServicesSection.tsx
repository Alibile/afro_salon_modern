import { Droplets, Scissors } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { telHref } from "@/components/brand/SocialLinks";
import { formatKurus } from "@/lib/money";
import type { AppLocale } from "@/i18n/routing";
import { Reveal } from "@/components/motion/Reveal";
import { staggerDelay } from "@/lib/motion-utils";

export type ServiceRowItem = { id: string; name: string; durationMinutes: number; priceKurus: number };

/** Fiyat satırları hızlı bir sırayla gelir: 40 ms liste ritmi verir, bekletmez. */
const ROW_STEP = 0.04;

/**
 * Sakal için lucide'da uygun bir ikon yok (kitaplıkta `beard`, `razor`, `shave`
 * diye bir ad geçmiyor): açık ustura aynı çizim diliyle burada çizilir —
 * 24'lük kutu, 2 birim kalınlık, yuvarlak uçlar, `currentColor`. Eğik ağız
 * (yuvarlak uçlu kalın bir şerit) ve sol alttaki kısa sap kavisi.
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
 * kartıdır: tek satırlık bir liste, salonun "tek fiyat" teklifini anlatmıyordu.
 * Panelden ikinci bir hizmet eklendiği anda aynı bölüm eski liste düzenine
 * döner — düzen içeriğin şeklinden çıkar, elle bir bayrak çevrilmez.
 */
export function ServicesSection({ services, phone }: { services: ServiceRowItem[]; phone: string }) {
  const t = useTranslations("landing.services");
  const tPackage = useTranslations("landing.package");
  const tCommon = useTranslations("common");
  const locale = useLocale() as AppLocale;
  const single = services.length === 1 ? services[0] : null;
  return (
    <section id="hizmetler" className="scroll-mt-20 border-b border-border">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-5 py-16 md:grid-cols-12 md:gap-10 md:py-24">
        <Reveal as="header" className="md:col-span-4 md:sticky md:top-8 md:self-start">
          <h2 className="display-lg">{t("title")}</h2>
          <p className="editorial-note mt-3 text-muted-foreground">{single ? tPackage("sectionNote") : t("note")}</p>
        </Reveal>
        {services.length === 0 ? (
          <p className="text-muted-foreground md:col-span-8">
            {t("empty")}{" "}
            <a href={telHref(phone)} className="underline underline-offset-4">{phone}</a>
          </p>
        ) : single ? (
          <div className="md:col-span-8">
            <div className="grid grid-cols-1 gap-10 border-t border-border pt-8 sm:grid-cols-2 sm:gap-8">
              <Reveal>
                <h3 className="display-lg">{single.name}</h3>
                <p className="label mt-8 text-muted-foreground">{tPackage("includesTitle")}</p>
                <ul className="mt-4 space-y-3.5">
                  {INCLUDES.map(({ key, Icon }) => (
                    <li key={key} className="flex items-center gap-3">
                      <Icon className="size-5 shrink-0 text-primary" />
                      <span className="text-lg">{tPackage(key)}</span>
                    </li>
                  ))}
                </ul>
              </Reveal>
              <Reveal className="flex flex-col items-start sm:items-end sm:text-right" delay={staggerDelay(1, 0.08)}>
                <p className="display-lg tabular-nums text-primary">{formatKurus(single.priceKurus, locale)}</p>
                <p className="editorial-note mt-3 text-lg text-muted-foreground">
                  {tCommon("minutes", { count: single.durationMinutes })}
                </p>
                <Button asChild size="lg" className="mt-8 h-12 rounded-none px-7 text-base">
                  <Link href="/randevu">{tPackage("book")}</Link>
                </Button>
              </Reveal>
            </div>
            <p className="editorial-note mt-10 border-t border-border pt-5 text-muted-foreground">{tPackage("note")}</p>
          </div>
        ) : (
          <ul className="border-t border-border md:col-span-8">
            {services.map((s, i) => (
              <Reveal as="li" key={s.id} className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b border-border py-5" delay={staggerDelay(i, ROW_STEP)}>
                <span className="display-sm">{s.name}</span>
                <span className="editorial-note text-sm text-muted-foreground">{tCommon("minutes", { count: s.durationMinutes })}</span>
                <span aria-hidden className="leader hidden sm:block" />
                <span className="ml-auto text-lg tabular-nums sm:ml-0">{formatKurus(s.priceKurus, locale)}</span>
              </Reveal>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
