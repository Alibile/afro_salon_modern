import { useTranslations } from "next-intl";

/**
 * Adımlar anahtarlarıyla listelenir; sıra hem çeviri dosyasında hem burada
 * aynıdır. Numara tek hanelidir ve gövde boyutunda yazılır: içerik gerçekten
 * bir sıradır, ama numara süs değil işarettir.
 */
const STEPS = [
  { number: "1", title: "step1Title", text: "step1Text" },
  { number: "2", title: "step2Title", text: "step2Text" },
  { number: "3", title: "step3Title", text: "step3Text" },
] as const;

/**
 * "Nasıl çalışır": hero'nun hemen altında, ziyaretçi daha aşağı inmeden üç
 * adımı görür. Kendi çağrı düğmesi yok: hero'daki "Hemen randevu al" bir ekran
 * yukarıda duruyor. Alt not iptal penceresini ayarlardan alır.
 */
export function HowItWorksSection({
  cancellationWindowMinutes,
}: {
  cancellationWindowMinutes: number;
}) {
  const t = useTranslations("landing.howItWorks");
  return (
    <section id="nasil" className="scroll-mt-16 border-b border-border">
      <div className="mx-auto max-w-6xl px-5 py-14 md:px-10 md:py-24">
        <div className="max-w-2xl">
          <h2 className="display-lg">{t("title")}</h2>
          <p className="mt-3 text-muted-foreground">{t("note")}</p>
        </div>
        <ol className="mt-10 grid gap-8 md:grid-cols-3">
          {STEPS.map((step) => (
            <li key={step.number} className="border-t border-border pt-5">
              <p className="text-sm font-medium text-primary tabular-nums">
                {step.number}
              </p>
              <h3 className="display-md mt-2">{t(step.title)}</h3>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                {t(step.text)}
              </p>
            </li>
          ))}
        </ol>
        <p className="mt-10 max-w-2xl text-muted-foreground">
          {t("cancelNote", { minutes: cancellationWindowMinutes })}
        </p>
      </div>
    </section>
  );
}
