/**
 * "Nasıl çalışır": hero'nun hemen altında, ziyaretçi daha aşağı inmeden üç
 * adımı görür. Kendi çağrı düğmesi yok: hero'daki "Hemen randevu al" bir ekran
 * yukarıda duruyor. Metinlerin tamamı panelden (ya da yedek olarak çeviri
 * dosyasından) gelir; numara tek hanelidir ve gövde boyutunda yazılır.
 */
export type HowItWorksStep = { title: string; text: string };

export function HowItWorksSection({ title, note, steps, cancelNote }: { title: string; note: string; steps: HowItWorksStep[]; cancelNote: string }) {
  return (
    <section id="nasil" className="scroll-mt-16 border-b border-border">
      <div className="mx-auto max-w-6xl px-5 py-14 md:px-10 md:py-24">
        <div className="max-w-2xl">
          <h2 className="display-lg">{title}</h2>
          <p className="mt-3 text-muted-foreground">{note}</p>
        </div>
        <ol className="mt-10 grid gap-8 md:grid-cols-3">
          {steps.map((step, i) => (
            <li key={i} className="border-t border-border pt-5">
              <p className="text-sm font-medium text-primary tabular-nums">{i + 1}</p>
              <h3 className="display-md mt-2">{step.title}</h3>
              <p className="mt-3 leading-relaxed text-muted-foreground">{step.text}</p>
            </li>
          ))}
        </ol>
        <p className="mt-10 max-w-2xl text-muted-foreground">{cancelNote}</p>
      </div>
    </section>
  );
}
