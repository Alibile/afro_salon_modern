import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { AfroPattern } from "@/components/brand/AfroPattern";
import { Parallax } from "@/components/motion/Parallax";
import { heroSources } from "@/lib/hero-image";
import { staggerDelay } from "@/lib/motion-utils";
import { shopStatusText, type ShopStatus } from "@/lib/shop-status";
import { cn } from "@/lib/utils";

/**
 * Manşet satır satır dizilir: kırılmayı tarayıcıya bırakmak yerine burada
 * belirlemek hem ölçüyü (Fraunces, Bebas'a göre çok daha geniş bir yüz) hem de
 * sıralı girişi mümkün kılar. Satırların kendisi çeviri dosyasında ayrı iki
 * anahtardır (`hero.headline1`, `hero.headline2`): kırılma noktası her dilde
 * çevirmenin kararıdır, kelime sayısı diller arasında aynı değildir.
 */
const HEADLINE_KEYS = ["hero.headline1", "hero.headline2"] as const;

/**
 * Açılış sırası: manşet satırları 60 ms arayla, ardından alt metin ve düğmeler.
 * Sıra `.rise` (CSS) ile kurulur — sayfanın ilk ekranı Motion'ın hidrasyonunu
 * beklemez.
 */
function riseDelay(index: number) {
  return { animationDelay: `${staggerDelay(index).toFixed(2)}s` };
}

/**
 * Tam ekran sinematik hero: tek bir fotoğraf, üstünde metin.
 *
 * Fotoğraf iki kırpımda hazırdır — masaüstü için 3:2 (`hero.jpg`), telefon için
 * 4:5 (`hero-mobile.jpg`); ikisi de `heroSources()` ile okunur. Seçim
 * `<picture>` içindeki `media` ile yapılır, `hidden`/`block` ikilisiyle değil:
 * gizlenmiş bir `<img>` de indirilir, o yolda her cihaz iki dosyayı birden
 * çekerdi. Görsel gövdenin ilk öğesidir, `fetchPriority="high"` ile istenir ve
 * ana sayfada `preloadHero()` ile ayrıca duyurulur: LCP bu fotoğraftır.
 */
export function Hero({ status }: { status: ShopStatus }) {
  const t = useTranslations("landing");
  const tStatus = useTranslations("common.status");
  const heroAlt = t("hero.photoAlt");
  const open = status.state === "open";
  const { wide, tall } = heroSources(heroAlt);
  // Tek kırpım varsa iki ekranda da o kullanılır; `<source>` ancak iki dosya da
  // gerçekten diskteyse yazılır (eşleşmeyen bir `media` fotoğrafı büsbütün
  // kaybettirirdi). Hiçbiri yoksa aşağıda desenli yer tutucuya düşülür.
  const photo = tall ?? wide;

  return (
    <section
      // Negatif üst boşluk çubuğun yüksekliği kadardır (`h-20`): hero sayfanın
      // en üstünden başlar ve yapışkan çubuk onun üstünde durur.
      className="relative isolate -mt-20 flex min-h-[92svh] flex-col justify-end overflow-hidden border-b border-border bg-hero-ink text-hero-sand"
    >
      {photo ? (
        <div className="hero-zoom absolute inset-0 -z-20">
          <picture>
            {wide && tall && <source media="(min-width: 768px)" srcSet={wide.srcSet} sizes="100vw" />}
            {/* `alt` zaten `photo` içinde; linter yayılmış prop'u göremediği için ayrıca yazılır. */}
            <img {...photo} alt={heroAlt} className="size-full object-cover object-[50%_42%]" />
          </picture>
        </div>
      ) : (
        // Salon kendi fotoğrafını henüz koymadıysa kırık kare yerine `ImageSlot`
        // ile aynı dil: koyu zemin ve afrika geometrik deseni. Metin katmanı
        // değişmediği için manşet ve düğmeler aynı yerinde durur.
        <div role="img" aria-label={heroAlt} className="absolute inset-0 -z-20 bg-hero-ink text-hero-sand">
          <AfroPattern variant="kente" size={96} opacity={0.12} />
        </div>
      )}

      <div aria-hidden className="hero-scrim absolute inset-0 -z-10" />

      {/* Desen yalnızca alt yarıda ve yumuşak maskeyle: fotoğrafın yüzü serbest kalır. */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 -z-10 h-1/2 overflow-hidden text-hero-sand [mask-image:linear-gradient(to_bottom,transparent,black_85%)]"
      >
        <Parallax className="absolute inset-x-0 -top-10 -bottom-10" range={28} speed={0.8} ariaHidden>
          <AfroPattern variant="tarak" size={104} opacity={0.05} />
        </Parallax>
      </div>

      <div className="relative mx-auto w-full max-w-6xl px-5 pt-32 pb-16 md:pb-20">
        <p className="rise flex items-center gap-2.5">
          <span className={cn("size-2 shrink-0 rounded-full", open ? "bg-success" : "bg-primary")} />
          <span className="label pt-px">{shopStatusText(tStatus, status)}</span>
        </p>

        <h1 className="display-cinema mt-6 md:mt-8">
          {HEADLINE_KEYS.map((key, i) => (
            <span key={key} className="rise block" style={riseDelay(i + 1)}>
              {t(key)}
            </span>
          ))}
        </h1>

        <p className="rise mt-6 max-w-[44ch] text-base text-hero-sand/80 md:max-w-none md:text-lg" style={riseDelay(HEADLINE_KEYS.length + 1)}>
          {t("hero.subtitle")}
        </p>

        <div className="rise mt-8 flex flex-wrap items-center gap-4" style={riseDelay(HEADLINE_KEYS.length + 2)}>
          <Button asChild size="lg" className="h-12 rounded-none px-7 text-base">
            <Link href="/randevu">{t("hero.book")}</Link>
          </Button>
          <a
            href="#hizmetler"
            className="inline-flex h-12 items-center border border-hero-sand/45 px-6 text-base transition-colors hover:border-hero-sand hover:bg-hero-sand/10"
          >
            {t("hero.services")}
          </a>
        </div>
      </div>

      <div aria-hidden className="pointer-events-none absolute right-6 bottom-16 hidden flex-col items-center gap-3 md:flex">
        <span className="label [writing-mode:vertical-rl] text-hero-sand/70">{t("hero.scroll")}</span>
        <span className="h-16 w-px bg-hero-sand/40" />
      </div>
    </section>
  );
}
