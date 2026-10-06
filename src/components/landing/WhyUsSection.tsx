import { useTranslations } from "next-intl";

export type WhyUsItem = { title: string; text: string };

/**
 * Üç sebep, düz üç sütun. Sayaç bandı (`%99`, `10+ yıl`) Tur 8'de buradan
 * Hakkımızda'ya taşındı: iki sayı metnin yanında daha sakin duruyor.
 */
export function WhyUsSection({ items }: { items: WhyUsItem[] }) {
  const t = useTranslations("landing.whyUs");
  const filled = items.filter(
    (i) => i.title.trim() !== "" || i.text.trim() !== "",
  );
  if (filled.length === 0) return null;
  return (
    <section id="neden-biz" className="scroll-mt-16 border-b border-border">
      <div className="mx-auto max-w-6xl px-5 py-14 md:px-10 md:py-24">
        <div className="max-w-2xl">
          <h2 className="display-lg">{t("title")}</h2>
          <p className="mt-3 text-muted-foreground">{t("note")}</p>
        </div>
        <ul className="mt-10 grid gap-8 md:grid-cols-3">
          {filled.map((i) => (
            <li key={i.title} className="border-t border-border pt-5">
              <h3 className="display-md">{i.title}</h3>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                {i.text}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
