import { Star } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export type TestimonialItem = {
  id: string;
  name: string;
  text: string;
  rating: number;
};

function Rating({ value, label }: { value: number; label: string }) {
  return (
    <p role="img" aria-label={label} className="flex gap-1 text-primary">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          aria-hidden
          className={cn(
            "size-4",
            i <= value ? "fill-current" : "text-muted-foreground/40",
          )}
        />
      ))}
    </p>
  );
}

/** Üç sütun, hizalı. Alıntı italik (gerçekten bir not), ad düz yazı. */
export function TestimonialsSection({ items }: { items: TestimonialItem[] }) {
  const t = useTranslations("landing.testimonials");
  if (items.length === 0) return null;
  return (
    <section id="yorumlar" className="scroll-mt-16 border-b border-border">
      <div className="mx-auto max-w-6xl px-5 py-14 md:px-10 md:py-24">
        <div className="max-w-2xl">
          <h2 className="display-lg">{t("title")}</h2>
          <p className="mt-3 text-muted-foreground">{t("note")}</p>
        </div>
        <ul className="mt-10 grid gap-10 md:grid-cols-3">
          {items.map((item) => (
            <li key={item.id} className="border-t border-border pt-5">
              <Rating
                value={item.rating}
                label={t("rating", { value: item.rating })}
              />
              <blockquote className="editorial-note mt-4 text-lg leading-snug text-foreground">
                “{item.text}”
              </blockquote>
              <p className="mt-4 text-sm text-muted-foreground">{item.name}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
