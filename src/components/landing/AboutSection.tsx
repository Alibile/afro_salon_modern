import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ImageSlot } from "@/components/brand/ImageSlot";
import { formatPercent } from "@/lib/intl";
import type { AppLocale } from "@/i18n/routing";

/** `aboutText` panelden serbest metin olarak girilir; boş satırlar paragraf ayırır. */
function paragraphs(text: string) {
  return text
    .split(/\n{2,}|\r\n\r\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/**
 * Hakkımızda: fotoğraf ve metin. Memnuniyet yüzdesi ve deneyim yılı artık
 * ayrı bir sayaç bandında değil, metnin altında iki sakin satırdır: sayı
 * canlanmaz, olduğu gibi yazılır. Değerler panelden gelir (`Settings`).
 */
export function AboutSection({
  title,
  text,
  satisfactionPercent,
  yearsExperience,
  photoKey = null,
}: {
  title: string;
  text: string;
  satisfactionPercent: number;
  yearsExperience: number;
  /** Panelden yüklenen hakkımızda fotoğrafı; boşsa `about.jpg`. */
  photoKey?: string | null;
}) {
  const t = useTranslations("landing.about");
  const locale = useLocale() as AppLocale;
  const parts = paragraphs(text);
  if (parts.length === 0) return null;
  return (
    <section id="hakkimizda" className="scroll-mt-16 border-b border-border">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-5 py-14 md:grid-cols-12 md:gap-12 md:px-10 md:py-24">
        <figure className="md:col-span-5">
          <div className="relative aspect-[3/2] w-full overflow-hidden border border-border md:aspect-[4/5]">
            <ImageSlot
              name="about.jpg"
              storageKey={photoKey}
              alt={t("photoAlt")}
              label={t("photoSoon")}
              variant="mud"
              sizes="(min-width: 768px) 40vw, 100vw"
            />
          </div>
          <figcaption className="editorial-note mt-3 text-sm text-muted-foreground">
            {t("caption")}
          </figcaption>
        </figure>
        <div className="md:col-span-7">
          <h2 className="display-lg">{title}</h2>
          {parts.map((p, i) => (
            <p
              key={i}
              className="measure mt-6 text-lg leading-relaxed text-muted-foreground"
            >
              {p}
            </p>
          ))}
          <dl className="mt-8 grid max-w-md grid-cols-2 gap-6 border-t border-border pt-6">
            <div>
              <dd className="display-md text-primary tabular-nums">
                {formatPercent(satisfactionPercent, locale)}
              </dd>
              <dt className="mt-1 text-sm text-muted-foreground">
                {t("satisfaction")}
              </dt>
            </div>
            <div>
              <dd className="display-md text-primary tabular-nums">
                {yearsExperience} {t("yearsUnit")}
              </dd>
              <dt className="mt-1 text-sm text-muted-foreground">
                {t("experience")}
              </dt>
            </div>
          </dl>
          <Link
            href="/randevu"
            className="mt-9 inline-block border-b-2 border-primary pb-1 text-lg font-medium text-primary transition-colors hover:border-foreground hover:text-foreground"
          >
            {t("cta")}
          </Link>
        </div>
      </div>
    </section>
  );
}
