import { telHref } from "@/components/brand/SocialLinks";
import { formatKurus } from "@/lib/money";
import { Reveal } from "@/components/motion/Reveal";
import { staggerDelay } from "@/lib/motion-utils";

export type ServiceRowItem = { id: string; name: string; durationMinutes: number; priceKurus: number };

/** Fiyat satırları hızlı bir sırayla gelir: 40 ms liste ritmi verir, bekletmez. */
const ROW_STEP = 0.04;

export function ServicesSection({ services, phone }: { services: ServiceRowItem[]; phone: string }) {
  return (
    <section id="hizmetler" className="scroll-mt-20 border-b border-border">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-5 py-16 md:grid-cols-12 md:gap-10 md:py-24">
        <Reveal as="header" className="md:col-span-4 md:sticky md:top-8 md:self-start">
          <h2 className="display-lg">HİZMETLER</h2>
          <p className="editorial-note mt-3 text-muted-foreground">
            Süreler yaklaşıktır; birden fazla hizmeti aynı randevuda birleştirebilirsin.
          </p>
        </Reveal>
        {services.length === 0 ? (
          <p className="text-muted-foreground md:col-span-8">
            Fiyat listesi güncelleniyor. Bu arada salonu arayabilirsin:{" "}
            <a href={telHref(phone)} className="underline underline-offset-4">{phone}</a>
          </p>
        ) : (
          <ul className="border-t border-border md:col-span-8">
            {services.map((s, i) => (
              <Reveal as="li" key={s.id} className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b border-border py-5" delay={staggerDelay(i, ROW_STEP)}>
                <span className="display-sm">{s.name}</span>
                <span className="editorial-note text-sm text-muted-foreground">{s.durationMinutes} dakika</span>
                <span aria-hidden className="leader hidden sm:block" />
                <span className="ml-auto text-lg tabular-nums sm:ml-0">{formatKurus(s.priceKurus)}</span>
              </Reveal>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
