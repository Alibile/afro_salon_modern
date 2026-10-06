import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { AfroPattern } from "@/components/brand/AfroPattern";
import { heroSources } from "@/lib/hero-image";
import { staggerDelay } from "@/lib/motion-utils";
import { shopStatusText, type ShopStatus } from "@/lib/shop-status";

/**
 * Manşet satır satır dizilir: kırılmayı tarayıcıya bırakmak yerine burada
 * belirlemek hem ölçüyü hem de sıralı girişi mümkün kılar. Satırların kendisi
 * çeviri dosyasında ayrı iki anahtardır (`hero.headline1`, `hero.headline2`):
 * kırılma noktası her dilde çevirmenin kararıdır.
 */
const HEADLINE_KEYS = ["hero.headline1", "hero.headline2"] as const;

/**
 * Açılış sırası: durum satırı, manşet satırları 60 ms arayla, ardından alt
 * metin ve düğmeler. Sıra `.rise` (CSS) ile kurulur: ilk ekran Motion'ın
 * hidrasyonunu beklemez. Sitedeki tek kendiliğinden hareket budur.
 */
function riseDelay(index: number) {
  return { animationDelay: `${staggerDelay(index).toFixed(2)}s` };
}

/**
 * Tam ekran sinematik hero: tek bir fotoğraf, üstünde metin.
 *
 * Fotoğraf iki kırpımda hazırdır (masaüstü 3:2, telefon 4:5), seçim
 * `<picture>` içindeki `media` ile yapılır. Görsel gövdenin ilk öğesidir,
 * `fetchPriority="high"` ile istenir ve ana sayfada `preloadHero()` ile
 * ayrıca duyurulur: LCP bu fotoğraftır.
 *
 * Durum satırı düz bir cümledir: "Bugün açığız, 11:00–22:30. 14 boş randevu."
 * Nokta işareti, aralıklı büyük harf etiket ve orta nokta ayırıcı yok;
 * ziyaretçi okur, çözmez.
 */
export function Hero({ status, slots }: { status: ShopStatus; slots: number }) {
  const t = useTranslations("landing");
  const tStatus = useTranslations("common.status");
  const heroAlt = t("hero.photoAlt");
  const { wide, tall } = heroSources(heroAlt);
  const photo = tall ?? wide;
  // Sayaç yalnızca dükkan **şu an** açıkken basılır: kapanış saatinden sonra
  // "bugün doluyuz" demek "Bugün kapandık" ile çelişirdi.
  const slotsText =
    status.state === "open"
      ? slots > 0
        ? t("hero.slotsToday", { count: slots })
        : t("hero.slotsFull")
      : null;

  return (
    <section
      // Negatif üst boşluk çubuğun yüksekliği kadardır (`h-20`): hero sayfanın
      // en üstünden başlar ve yapışkan çubuk onun üstünde durur.
      className="relative isolate -mt-20 flex min-h-[92svh] flex-col justify-end overflow-hidden border-b border-border bg-hero-ink text-hero-sand"
    >
      {photo ? (
        <div className="hero-zoom absolute inset-0 -z-20">
          <picture>
            {wide && tall && (
              <source
                media="(min-width: 768px)"
                srcSet={wide.srcSet}
                sizes="100vw"
              />
            )}
            {/* `alt` zaten `photo` içinde; linter yayılmış prop'u göremediği için ayrıca yazılır. */}
            <img
              {...photo}
              alt={heroAlt}
              className="size-full object-cover object-[50%_42%]"
            />
          </picture>
        </div>
      ) : (
        <div
          role="img"
          aria-label={heroAlt}
          className="absolute inset-0 -z-20 bg-hero-ink text-hero-sand"
        >
          <AfroPattern variant="kente" size={96} opacity={0.12} />
        </div>
      )}

      <div aria-hidden className="hero-scrim absolute inset-0 -z-10" />

      <div className="relative mx-auto w-full max-w-6xl px-5 pt-32 pb-14 md:px-10 md:pb-20">
        <p className="rise max-w-[40ch] text-sm text-hero-sand/85 md:text-base">
          {shopStatusText(tStatus, status)}.{slotsText && ` ${slotsText}.`}
        </p>

        <h1 className="display-cinema mt-5 md:mt-7">
          {HEADLINE_KEYS.map((key, i) => (
            <span key={key} className="rise block" style={riseDelay(i + 1)}>
              {t(key)}
            </span>
          ))}
        </h1>

        <p
          className="rise mt-6 max-w-[44ch] text-base text-hero-sand/80 md:text-lg"
          style={riseDelay(HEADLINE_KEYS.length + 1)}
        >
          {t("hero.subtitle")}
        </p>

        <div
          className="rise mt-8 flex flex-wrap items-center gap-3"
          style={riseDelay(HEADLINE_KEYS.length + 2)}
        >
          <Button asChild size="lg">
            <Link href="/randevu">{t("hero.book")}</Link>
          </Button>
          <a
            href="#hizmetler"
            className="inline-flex h-12 items-center rounded-[var(--radius)] border border-hero-sand/45 px-6 text-base transition-colors hover:border-hero-sand hover:bg-hero-sand/10"
          >
            {t("hero.services")}
          </a>
        </div>
      </div>
    </section>
  );
}
