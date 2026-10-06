import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { publicUrl } from "@/lib/storage-public";
import { AfroPattern } from "@/components/brand/AfroPattern";
import { cn } from "@/lib/utils";

/** `bio` ziyaretçinin dilinde seçilmiş metindir; boşsa satır hiç basılmaz. */
export type TeamMember = {
  id: string;
  name: string;
  bio: string;
  photoKey: string;
};

/**
 * Kartlar hizalı bir ızgarada durur: telefonda iki sütun (3:4 fotoğraf 390
 * px'te 165 px genişlik), geniş ekranda kadroya göre iki ya da üç sütun. Tek
 * tek kaydırılmış kartlar (eski `lg:mt-16`) kalktı; sıra kadronun sırasıdır.
 */
export function TeamSection({ barbers }: { barbers: TeamMember[] }) {
  const t = useTranslations("landing.team");
  if (barbers.length === 0) return null;
  const wide = barbers.length < 3;
  const sizes = wide
    ? "(min-width: 1024px) 45vw, 50vw"
    : "(min-width: 1024px) 30vw, 50vw";
  return (
    <section id="ekip" className="scroll-mt-16 border-b border-border">
      <div className="mx-auto max-w-6xl px-5 py-14 md:px-10 md:py-24">
        <div className="max-w-2xl">
          <h2 className="display-lg">{t("title")}</h2>
          <p className="mt-3 text-muted-foreground">{t("note")}</p>
        </div>
        <ol
          className={cn(
            "mt-10 grid grid-cols-2 gap-x-5 gap-y-10 sm:gap-x-8",
            wide ? "lg:grid-cols-2 lg:gap-x-12" : "lg:grid-cols-3",
          )}
        >
          {barbers.map((b) => (
            <li key={b.id}>
              <div className="relative aspect-[3/4] w-full overflow-hidden bg-secondary text-primary">
                <AfroPattern variant="kente" size={72} opacity={0.12} />
                <Image
                  src={publicUrl(b.photoKey)}
                  alt={t("portraitAlt", { name: b.name })}
                  fill
                  sizes={sizes}
                  className="object-cover"
                />
              </div>
              <h3 className="display-md mt-4">{b.name}</h3>
              {b.bio && (
                <p className="mt-1 text-sm text-muted-foreground">{b.bio}</p>
              )}
              <Link
                href={`/randevu?b=${b.id}`}
                className="mt-3 inline-block text-sm text-primary underline underline-offset-4 hover:text-foreground"
              >
                {t("bookWith", { name: b.name.split(" ")[0] })}
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
