import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AfroPattern } from "@/components/brand/AfroPattern";
import { telHref } from "@/components/brand/SocialLinks";
import { ImageSlot } from "@/components/brand/ImageSlot";
import { Parallax } from "@/components/motion/Parallax";
import { staggerDelay } from "@/lib/motion-utils";
import type { ShopStatus } from "@/lib/shop-status";
import { cn } from "@/lib/utils";

/**
 * Manşet satır satır dizilir: kırılmayı tarayıcıya bırakmak yerine burada
 * belirlemek hem ölçüyü (Fraunces, Bebas'a göre çok daha geniş bir yüz) hem de
 * sıralı girişi mümkün kılar. Metin değişmez; yalnızca nerede kırıldığı bilinir.
 */
const HEADLINE_LINES = ["KIVRIMIN KENDİ", "GEOMETRİSİ VAR."];

/**
 * Açılış sırası: manşet satırları 60 ms arayla, ardından alt metin, gövde ve
 * düğmeler. Sıra `.rise` (CSS) ile kurulur — sayfanın ilk ekranı Motion'ın
 * hidrasyonunu beklemez. Kaydırmaya bağlı derinlik (desen + fotoğraf) Motion'ın
 * işidir; o sırada içerik zaten görünürdür.
 */
function riseDelay(index: number) {
  return { animationDelay: `${staggerDelay(index).toFixed(2)}s` };
}

export function Hero({ status, address, phone }: { status: ShopStatus; address: string; phone: string }) {
  const open = status.isOpenToday && status.text.startsWith("Bugün açık");
  const afterHeadline = HEADLINE_LINES.length;
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 hidden w-[36%] overflow-hidden bg-primary/8 text-primary md:block">
        {/* Desen en hızlı katman: sayfa kayarken arka plan derinlik kazanır. */}
        <Parallax className="absolute inset-x-0 -top-16 -bottom-16" range={44} speed={1} ariaHidden>
          <AfroPattern variant="tarak" size={96} opacity={0.12} />
        </Parallax>
      </div>

      <div className="relative mx-auto max-w-6xl px-5 pb-16 pt-8 md:pb-20 md:pt-14">
        <p className="rise flex items-center gap-2.5 text-muted-foreground">
          <span className={cn("size-2 shrink-0 rounded-full", open ? "bg-success" : "bg-primary")} />
          <span className="label pt-px">{status.text}</span>
        </p>

        <h1 className="display-hero mt-8 md:mt-10">
          {HEADLINE_LINES.map((line, i) => (
            <span key={line} className="rise block" style={riseDelay(i + 1)}>
              {line}
            </span>
          ))}
        </h1>

        <div className="mt-10 grid grid-cols-1 gap-12 md:grid-cols-12 md:gap-10">
          <div className="flex flex-col md:col-span-7 md:pr-10">
            <p className="rise editorial-note max-w-[36ch] text-xl text-primary md:text-2xl" style={riseDelay(afterHeadline + 1)}>
              Erkeklere özel afro kesim, fade, örgü ve twist — hepsi bugünün içinde.
            </p>
            <p className="rise measure mt-5 leading-relaxed text-muted-foreground" style={riseDelay(afterHeadline + 2)}>
              Yarına söz vermiyoruz. Bugünün boş saatlerini burada görür, berberini seçer, iki dakikada yerini ayırırsın.
            </p>
            <div className="rise mt-9 flex flex-wrap items-center gap-x-7 gap-y-4" style={riseDelay(afterHeadline + 3)}>
              <Button asChild size="lg" className="h-12 rounded-none px-7 text-base">
                <Link href="/randevu">Bugün randevu al</Link>
              </Button>
              <a href="#hizmetler" className="border-b border-foreground/30 pb-1 text-base transition-colors hover:border-foreground">
                Hizmetler ve fiyatlar
              </a>
            </div>
            <div className="rise mt-12 border-t border-border pt-5 text-sm text-muted-foreground md:mt-auto" style={riseDelay(afterHeadline + 4)}>
              <p>{address}</p>
              <a href={telHref(phone)} className="mt-1 inline-block underline underline-offset-4 hover:text-foreground">
                {phone}
              </a>
            </div>
          </div>

          <div className="md:col-span-5">
            <figure className="rise" style={riseDelay(afterHeadline + 2)}>
              <div className="relative aspect-[4/5] w-full overflow-hidden border border-border">
                {/* Fotoğraf desenin yarı hızında: iki katman birlikte kaymaz, aralarında derinlik açılır. */}
                <Parallax className="absolute inset-x-0 -top-10 -bottom-10" range={44} speed={0.45}>
                  <ImageSlot
                    name="hero.jpg"
                    alt="Salonda tamamlanmış bir afro kesim"
                    sizes="(min-width: 768px) 40vw, 100vw"
                    variant="kente"
                    priority
                  />
                </Parallax>
              </div>
              <figcaption className="editorial-note mt-3 text-sm text-muted-foreground">
                Her saç kendi düzenini kurar; biz o düzeni açığa çıkarırız.
              </figcaption>
            </figure>
          </div>
        </div>
      </div>
    </section>
  );
}
