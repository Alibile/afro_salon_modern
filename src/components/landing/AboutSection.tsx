import Link from "next/link";
import { ImageSlot } from "@/components/brand/ImageSlot";

/** `aboutText` panelden serbest metin olarak girilir; boş satırlar paragraf ayırır. */
function paragraphs(text: string) {
  return text
    .split(/\n{2,}|\r\n\r\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export function AboutSection({ title, text }: { title: string; text: string }) {
  const parts = paragraphs(text);
  if (parts.length === 0) return null;
  return (
    <section id="hakkimizda" className="scroll-mt-20 border-b border-border">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-5 py-16 md:grid-cols-12 md:gap-12 md:py-24">
        <figure className="md:col-span-5 md:-mt-6">
          <div className="relative aspect-[3/2] w-full overflow-hidden border border-border md:aspect-[4/5]">
            <ImageSlot name="about.jpg" alt="Salonun içinden bir kare" variant="mud" sizes="(min-width: 768px) 40vw, 100vw" />
          </div>
          <figcaption className="editorial-note mt-3 text-sm text-muted-foreground">
            Koltuk, ayna, tarak: gerisini saçın kendisi söyler.
          </figcaption>
        </figure>
        <div className="md:col-span-7">
          <h2 className="display-lg">{title}</h2>
          {parts.map((p, i) => (
            <p key={i} className="measure mt-6 text-lg leading-relaxed text-muted-foreground">
              {p}
            </p>
          ))}
          <Link
            href="/randevu"
            className="mt-9 inline-block border-b-2 border-primary pb-1 font-display text-2xl tracking-wide text-primary transition-colors hover:border-foreground hover:text-foreground"
          >
            Bugüne yer ayır
          </Link>
        </div>
      </div>
    </section>
  );
}
