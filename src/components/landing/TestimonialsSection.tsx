import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export type TestimonialItem = { id: string; name: string; text: string; rating: number };

function Rating({ value }: { value: number }) {
  return (
    <p role="img" aria-label={`5 üzerinden ${value} puan`} className="flex gap-1 text-primary">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} aria-hidden className={cn("size-4", i <= value ? "fill-current" : "text-muted-foreground/40")} />
      ))}
    </p>
  );
}

export function TestimonialsSection({ items }: { items: TestimonialItem[] }) {
  if (items.length === 0) return null;
  return (
    <section id="yorumlar" className="scroll-mt-20 border-b border-border">
      <div className="mx-auto max-w-6xl px-5 py-16 md:py-24">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="display-lg">YORUMLAR</h2>
          <p className="editorial-note max-w-[38ch] text-muted-foreground">
            Koltuktan kalkarken söylenenler; olduğu gibi aktarıyoruz.
          </p>
        </div>
        <ul className="mt-12 grid grid-cols-1 gap-x-10 gap-y-12 md:grid-cols-3">
          {items.map((t, i) => (
            <li key={t.id} className={cn("border-t border-border pt-6", i % 3 === 1 && "md:mt-12")}>
              <Rating value={t.rating} />
              <blockquote className="editorial-note mt-5 text-xl leading-snug text-foreground">
                <span aria-hidden className="mr-1 text-primary">“</span>
                {t.text}
                <span aria-hidden className="ml-0.5 text-primary">”</span>
              </blockquote>
              <p className="mt-5 font-display text-2xl tracking-wide text-muted-foreground">{t.name}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
