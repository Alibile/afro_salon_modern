import Image from "next/image";
import Link from "next/link";
import { publicUrl } from "@/lib/storage-public";
import { AfroPattern } from "@/components/brand/AfroPattern";
import { cn } from "@/lib/utils";

export type TeamMember = { id: string; name: string; bio: string | null; photoKey: string };

export function TeamSection({ barbers }: { barbers: TeamMember[] }) {
  if (barbers.length === 0) return null;
  return (
    <section id="ekip" className="scroll-mt-20 border-b border-border">
      <div className="mx-auto max-w-6xl px-5 py-16 md:py-24">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="display-lg">EKİP</h2>
          <p className="editorial-note max-w-[38ch] text-muted-foreground">
            Berberini seçerek başlayabilir, saatleri doğrudan onun takviminden görebilirsin.
          </p>
        </div>
        <ol className="mt-12 grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {barbers.map((b, i) => (
            <li key={b.id} className={cn(barbers.length > 2 && i % 2 === 1 && "lg:mt-16")}>
              <div className="relative aspect-[3/4] w-full overflow-hidden bg-secondary text-primary">
                <AfroPattern variant="kente" size={72} opacity={0.12} />
                <Image
                  src={publicUrl(b.photoKey)}
                  alt={`${b.name} portresi`}
                  fill
                  sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
                  className="object-cover"
                />
              </div>
              <h3 className="mt-5 font-display text-3xl tracking-wide">{b.name}</h3>
              {b.bio && <p className="editorial-note mt-1 text-muted-foreground">{b.bio}</p>}
              <Link
                href={`/randevu?b=${b.id}`}
                className="mt-4 inline-block border-b border-primary pb-1 text-primary transition-colors hover:border-foreground hover:text-foreground"
              >
                {b.name.split(" ")[0]} ile randevu al
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
