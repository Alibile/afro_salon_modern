import { useTranslations } from "next-intl";
import { Reveal } from "@/components/motion/Reveal";
import { staggerDelay } from "@/lib/motion-utils";

/**
 * Numaralar üç kez yazılmasın diye adımlar anahtarlarıyla listelenir; sıra
 * hem çeviri dosyasında hem burada aynıdır.
 */
const STEPS = [
  { number: "01", title: "step1Title", text: "step1Text" },
  { number: "02", title: "step2Title", text: "step2Text" },
  { number: "03", title: "step3Title", text: "step3Text" },
] as const;

/**
 * "Nasıl çalışır": hero'nun hemen altında, ziyaretçi daha aşağı inmeden üç
 * adımı görür. Üst çubuğa girmez — menü zaten altı bölüm taşıyor ve bu bölüm
 * kaydırma yolunun üstünde duruyor.
 *
 * Kendi çağrı düğmesi yok: hero'daki "Bugün randevu al" bir ekran yukarıda
 * duruyor, aynı işi iki kez istemek sayfayı gürültüye boğardı. Alt not iptal
 * penceresini ayarlardan alır (`cancellationWindowMinutes`), sayı metne
 * gömülmez.
 */
export function HowItWorksSection({ cancellationWindowMinutes }: { cancellationWindowMinutes: number }) {
  const t = useTranslations("landing.howItWorks");
  return (
    <section id="nasil" className="scroll-mt-20 border-b border-border">
      <div className="mx-auto max-w-6xl px-5 py-16 md:py-24">
        <Reveal className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="display-lg">{t("title")}</h2>
          <p className="editorial-note max-w-[38ch] text-muted-foreground">{t("note")}</p>
        </Reveal>
        <ol className="mt-12 grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-8">
          {STEPS.map((step, i) => (
            <Reveal as="li" key={step.number} className="border-t border-border pt-6" delay={staggerDelay(i)}>
              <p className="display-lg text-primary/35 tabular-nums">{step.number}</p>
              <h3 className="display-md mt-4">{t(step.title)}</h3>
              <p className="mt-3 leading-relaxed text-muted-foreground">{t(step.text)}</p>
            </Reveal>
          ))}
        </ol>
        <Reveal as="p" className="editorial-note mt-10 text-muted-foreground" delay={staggerDelay(STEPS.length)}>
          {t("cancelNote", { minutes: cancellationWindowMinutes })}
        </Reveal>
      </div>
    </section>
  );
}
