import { AfroPattern } from "@/components/brand/AfroPattern";

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
  const filled = items.filter((i) => i.title.trim() !== "" || i.text.trim() !== "");
  if (filled.length === 0) return null;
  return (
    <section id="neden-biz" className="scroll-mt-20 border-b border-border">
      <div className="mx-auto max-w-6xl px-5 py-16 md:py-24">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="display-lg">NEDEN BİZ</h2>
          <p className="editorial-note max-w-[38ch] text-muted-foreground">
            Sıra beklemeden, dokunu bilen ellere oturmak için üç sebep.
          </p>
        </div>
        <ul className="mt-12 grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-8">
          {filled.map((i) => (
            <li key={i.title} className="border-t border-border pt-6">
              {/* Kente motifinin iç eşkenar dörtgeni: sıra değil, işaret. */}
              <span aria-hidden className="block size-2.5 rotate-45 bg-primary" />
              <h3 className="mt-5 font-display text-3xl tracking-wide">{i.title}</h3>
              <p className="mt-3 leading-relaxed text-muted-foreground">{i.text}</p>
            </li>
          ))}
        </ul>
      </div>
      <div className="relative overflow-hidden border-t border-border bg-secondary text-primary">
        <AfroPattern variant="kente" size={88} opacity={0.12} />
        <dl className="relative mx-auto grid max-w-6xl grid-cols-1 gap-10 px-5 py-14 sm:grid-cols-2 md:py-16">
          {/* Sayı gözde önce gelsin diye sütun ters çevrilir; işaretlemede dt önce kalır. */}
          <div className="flex flex-col-reverse items-start gap-3">
            <dt className="text-lg text-secondary-foreground">müşteri memnuniyeti</dt>
            <dd className="display-hero text-primary">%{satisfactionPercent}</dd>
          </div>
          <div className="flex flex-col-reverse items-start gap-3 sm:border-l sm:border-border sm:pl-10">
            <dt className="text-lg text-secondary-foreground">deneyim</dt>
            <dd className="display-hero text-primary">{yearsExperience}+ yıl</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
