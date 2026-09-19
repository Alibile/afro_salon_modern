import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { publicUrl } from "@/lib/storage-public";
import { AfroPattern } from "@/components/brand/AfroPattern";
import { Reveal } from "@/components/motion/Reveal";
import { staggerDelay } from "@/lib/motion-utils";
import { cn } from "@/lib/utils";

/** `bio` ziyaretçinin dilinde seçilmiş metindir; çevirisi de Türkçesi de
 *  yoksa boş dizedir ve satır hiç basılmaz (bkz. `getActiveBarbers`). */
export type TeamMember = { id: string; name: string; bio: string; photoKey: string };

export function TeamSection({ barbers }: { barbers: TeamMember[] }) {
  const t = useTranslations("landing.team");
  if (barbers.length === 0) return null;
  return (
    <section id="ekip" className="scroll-mt-20 border-b border-border">
      <div className="mx-auto max-w-6xl px-5 py-16 md:py-24">
        <Reveal className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="display-lg">{t("title")}</h2>
          <p className="editorial-note max-w-[38ch] text-muted-foreground">{t("note")}</p>
        </Reveal>
        <ol className="mt-12 grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {barbers.map((b, i) => (
            <Reveal as="li" key={b.id} className={cn(barbers.length > 2 && i % 2 === 1 && "lg:mt-16")} delay={staggerDelay(i, 0.08)}>
              <div className="relative aspect-[3/4] w-full overflow-hidden bg-secondary text-primary">
                <AfroPattern variant="kente" size={72} opacity={0.12} />
                <Image
                  src={publicUrl(b.photoKey)}
                  alt={t("portraitAlt", { name: b.name })}
                  fill
                  sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
                  className="object-cover"
                />
              </div>
              <h3 className="display-md mt-5">{b.name}</h3>
              {b.bio && <p className="editorial-note mt-1 text-muted-foreground">{b.bio}</p>}
              <Link
                href={`/randevu?b=${b.id}`}
                className="mt-4 inline-block border-b border-primary pb-1 text-primary transition-colors hover:border-foreground hover:text-foreground"
              >
                {t("bookWith", { name: b.name.split(" ")[0] })}
              </Link>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
