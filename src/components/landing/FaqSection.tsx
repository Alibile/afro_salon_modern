import { ChevronDown } from "lucide-react";
import type { FaqView } from "@/lib/queries/content";

/**
 * SSS. Sorular panelden gelir (`FaqItem`), cevapların yer tutucuları sayfada
 * doldurulmuştur (`renderFaq`). `<details>/<summary>` ile kurulur: JavaScript
 * hiç çalışmasa da açılır kapanır, arama motoru da içeriği görür. Açılışta
 * içerik bloğu yumuşak bir giriş yapar (`animate-in`): kullanıcı eylemine
 * cevap veren tek hareket; hareket azaltılmışsa `globals.css` süreyi sıfırlar.
 */
export function FaqSection({ title, note, items }: { title: string; note: string; items: FaqView[] }) {
  if (items.length === 0) return null;
  return (
    <section id="sss" className="scroll-mt-16 border-b border-border">
      <div className="mx-auto max-w-6xl px-5 py-14 md:px-10 md:py-24">
        <div className="max-w-2xl">
          <h2 className="display-lg">{title}</h2>
          <p className="mt-3 text-muted-foreground">{note}</p>
        </div>
        <ul className="mt-10 border-t border-border md:max-w-3xl">
          {items.map((item) => (
            <li key={item.id} className="border-b border-border">
              <details className="group">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-4 transition-colors hover:text-primary [&::-webkit-details-marker]:hidden">
                  <span className="text-lg font-medium">{item.question}</span>
                  <ChevronDown aria-hidden className="mt-1 size-5 shrink-0 text-primary transition-transform duration-200 group-open:rotate-180" />
                </summary>
                <p className="measure animate-in fade-in slide-in-from-top-1 pb-5 leading-relaxed text-muted-foreground duration-200">{item.answer}</p>
              </details>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
