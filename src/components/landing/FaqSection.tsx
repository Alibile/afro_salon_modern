import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { Reveal } from "@/components/motion/Reveal";
import { staggerDelay } from "@/lib/motion-utils";

/**
 * Sorular dizi değil, numaralı anahtar çiftleri: `messages/*.json` içinde dizi
 * tutmak üç dilin sırasını ve sayısını birbirine bağlayamazdı (parite testi
 * anahtar yollarına bakıyor). Aynı liste hem bölümü hem sayfadaki `FAQPage`
 * JSON-LD'sini besler.
 */
export const FAQ_KEYS = [
  { q: "q1", a: "a1" },
  { q: "q2", a: "a2" },
  { q: "q3", a: "a3" },
  { q: "q4", a: "a4" },
  { q: "q5", a: "a5" },
  { q: "q6", a: "a6" },
] as const;

/**
 * Cevaplardaki değişkenler tek yerden gelir: iptal penceresi ayarlardan, fiyat
 * ve süre paketin kendisinden, açılış–kapanış bugünün çalışma saatlerinden.
 * Metinlere sayı gömülmez, çeviriler eskimez — paket 45 dakikadan 60'a çıkarsa
 * cevap da onunla birlikte değişir.
 */
export type FaqValues = { minutes: number; price: string; duration: number; open: string; close: string };

/**
 * SSS. `<details>/<summary>` ile kurulur: JavaScript hiç çalışmasa da açılır
 * kapanır, arama motoru da içeriği görür. Açılışta yalnızca içerik bloğu
 * yumuşak bir giriş yapar (`animate-in`); hareket azaltılmışsa `globals.css`
 * süreyi sıfırlar.
 */
export function FaqSection({ values }: { values: FaqValues }) {
  const t = useTranslations("landing.faq");
  return (
    <section id="sss" className="scroll-mt-20 border-b border-border">
      <div className="mx-auto max-w-6xl px-5 py-16 md:py-24">
        <Reveal className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="display-lg">{t("title")}</h2>
          <p className="editorial-note max-w-[38ch] text-muted-foreground">{t("note")}</p>
        </Reveal>
        <ul className="mt-12 border-t border-border md:max-w-3xl">
          {FAQ_KEYS.map((item, i) => (
            <Reveal as="li" key={item.q} className="border-b border-border" delay={staggerDelay(i, 0.05)}>
              <details className="group">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-5 transition-colors hover:text-primary [&::-webkit-details-marker]:hidden">
                  <span className="display-sm">{t(item.q)}</span>
                  <ChevronDown
                    aria-hidden
                    className="mt-1 size-5 shrink-0 text-primary transition-transform duration-200 group-open:rotate-180"
                  />
                </summary>
                <p className="measure animate-in fade-in slide-in-from-top-1 pb-6 leading-relaxed text-muted-foreground duration-200">
                  {t(item.a, values)}
                </p>
              </details>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
