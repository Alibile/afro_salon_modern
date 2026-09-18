import { useLocale, useTranslations } from "next-intl";
import { AfroPattern } from "@/components/brand/AfroPattern";
import { Reveal } from "@/components/motion/Reveal";
import { Parallax } from "@/components/motion/Parallax";
import { CountUp } from "@/components/motion/CountUp";
import { staggerDelay } from "@/lib/motion-utils";
import { percentAffix } from "@/lib/intl";
import type { AppLocale } from "@/i18n/routing";

export type WhyUsItem = { title: string; text: string };

export function WhyUsSection({
  items,
  satisfactionPercent,
  yearsExperience,
}: {
  items: WhyUsItem[];
  satisfactionPercent: number;
  yearsExperience: number;
}) {
  const t = useTranslations("landing.whyUs");
  const percent = percentAffix(useLocale() as AppLocale);
  const filled = items.filter((i) => i.title.trim() !== "" || i.text.trim() !== "");
  if (filled.length === 0) return null;
  return (
    <section id="neden-biz" className="scroll-mt-20 border-b border-border">
      <div className="mx-auto max-w-6xl px-5 py-16 md:py-24">
        <Reveal className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="display-lg">{t("title")}</h2>
          <p className="editorial-note max-w-[38ch] text-muted-foreground">{t("note")}</p>
        </Reveal>
        <ul className="mt-12 grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-8">
          {filled.map((i, index) => (
            <Reveal as="li" key={i.title} className="border-t border-border pt-6" delay={staggerDelay(index)}>
              {/* Kente motifinin iç eşkenar dörtgeni: sıra değil, işaret. */}
              <span aria-hidden className="block size-2.5 rotate-45 bg-primary" />
              <h3 className="display-md mt-5">{i.title}</h3>
              <p className="mt-3 leading-relaxed text-muted-foreground">{i.text}</p>
            </Reveal>
          ))}
        </ul>
      </div>
      <div className="relative overflow-hidden border-t border-border bg-secondary text-primary">
        <Parallax className="absolute inset-x-0 -top-14 -bottom-14" range={40} speed={1} ariaHidden>
          <AfroPattern variant="kente" size={88} opacity={0.12} />
        </Parallax>
        <dl className="relative mx-auto grid max-w-6xl grid-cols-1 gap-10 px-5 py-14 sm:grid-cols-2 md:py-16">
          {/* Sayı gözde önce gelsin diye sütun ters çevrilir; işaretlemede dt önce kalır. */}
          <Reveal className="flex flex-col-reverse items-start gap-3">
            <dt className="text-lg text-secondary-foreground">{t("satisfaction")}</dt>
            <dd className="display-hero text-primary">
              <CountUp value={satisfactionPercent} prefix={percent.prefix} suffix={percent.suffix} />
            </dd>
          </Reveal>
          <Reveal className="flex flex-col-reverse items-start gap-3 sm:border-l sm:border-border sm:pl-10" delay={staggerDelay(1)}>
            <dt className="text-lg text-secondary-foreground">{t("experience")}</dt>
            <dd className="display-hero text-primary">
              <CountUp value={yearsExperience} suffix="+" unit={t("yearsUnit")} />
            </dd>
          </Reveal>
        </dl>
      </div>
    </section>
  );
}
