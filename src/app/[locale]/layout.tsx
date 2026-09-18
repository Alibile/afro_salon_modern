import type { Metadata } from "next";
import { Manrope, Bebas_Neue, Fraunces } from "next/font/google";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";
import { routing } from "@/i18n/routing";
import "../globals.css";

/**
 * Üç yüz, üç iş: Fraunces manşet ve başlıklarda (yüksek `opsz` ile keskin,
 * editoryal kontrast; italiği editoryal notlarda), Manrope gövdede (geniş
 * açıklıklı, küçük puntoda okunaklı, tabular rakamlar fiyat listesinde),
 * Bebas Neue yalnızca küçük kapital etiketlerde. Değişken eksenler bilinçli
 * olarak dar tutuldu (`opsz`): her ek eksen indirilen dosyayı büyütür.
 *
 * Üçü de değişken kalır: `.display-*` ve `.editorial-note` sınıfları
 * `font-variation-settings: "opsz" …` yazar, gövde ise 400–700 arasında
 * serbestçe ağırlık değiştirir. Sabit ağırlık listesine (`weight: [...]`)
 * inmek dosyaları küçültmez — ağırlık başına ayrı dosya üretir — ve `opsz`
 * eksenini büsbütün kaybettirir.
 */
const manrope = Manrope({ subsets: ["latin", "latin-ext"], variable: "--font-sans", display: "swap" });
const fraunces = Fraunces({
  subsets: ["latin", "latin-ext"],
  style: ["normal"],
  axes: ["opsz"],
  variable: "--font-display",
  display: "swap",
});
/**
 * İtalik yüz ayrı bir örnek. Tek kullanıcısı `.editorial-note`: ana sayfada
 * ilk ekranın altında kalır (giriş/kayıt ve randevu akışında ilk ekranda
 * görünebilir — orada yedek yüzle başlayıp swap etmesi kabul edilen tercih);
 * buna karşılık iki alt kümesi
 * (latin + latin-ext) birlikte 150 KB tutuyor ve hero fotoğrafıyla (LCP) aynı
 * bant genişliğini paylaşıyordu. İki değişiklik:
 *
 * - `axes` verilmiyor. `.editorial-note` zaten `opsz` 14 istiyor, o da
 *   Fraunces'in varsayılanı: eksen düşünce dosyalar 150 KB'den 84 KB'ye
 *   iniyor ve ekranda hiçbir şey değişmiyor (`font-variation-settings`
 *   yazımı yerinde kalır, artık etkisizdir).
 * - `preload: false`. Yüz ilk ekranda kullanılmıyor; `display: swap` ile o ana
 *   kadar düşey ölçüsü ayarlanmış yedek yüz görünür (CLS ölçümlerde 0).
 */
const frauncesItalic = Fraunces({
  subsets: ["latin", "latin-ext"],
  style: ["italic"],
  variable: "--font-display-italic",
  display: "swap",
  preload: false,
});
/**
 * Bebas yalnızca `.label` küçük kapitallerinde: hero'daki durum satırı, bölüm
 * üst etiketleri. İki alt kümesi ön yüklenen yüz kuyruğuna ~14 KB ekliyor;
 * `preload: false` denendi ve ölçümde geri alındı: ön yükleme kalkınca dosya
 * ilk turda değil, düzen yüzü isteyince "VeryHigh" öncelikle isteniyor, yani
 * ilk boyamanın zincirine giriyor — Lighthouse'un varsayılan benzetiminde FCP
 * 1.5 sn'den 1.8 sn'ye, puan 85'ten 82'ye düşüyor. Ön yükleme kalıyor.
 */
const bebas = Bebas_Neue({ weight: "400", subsets: ["latin", "latin-ext"], variable: "--font-label", display: "swap" });

/** Sekme başlığı ve arama sonucu açıklaması da ziyaretçinin dilinde gelir. */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return { title: t("title"), description: t("description") };
}

/**
 * Uygulamanın tek kök yerleşimi bu dosyadır: `[locale]` segmenti kökün üstünde
 * durduğu için `<html lang>` doğrudan seçilen dile bağlanır. `generateStaticParams`
 * üç dili de bildirir; segment bilinmeyen yollar için de eşleştiğinden
 * (`/de`, `/robots.txt`) gelen değer `hasLocale` ile doğrulanır ve geçersizse 404
 * verilir.
 */
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  return (
    <html lang={locale} suppressHydrationWarning className={`${manrope.variable} ${fraunces.variable} ${frauncesItalic.variable} ${bebas.variable}`}>
      <head>
        {/*
         * JavaScript kapalıyken Motion hiç bağlanmaz ve sunucudan gelen satır içi
         * başlangıç stili (`opacity: 0`, `translateY`) DOM'da kalırdı: hero'nun
         * altındaki her bölüm görünmezdi. Bu kural içeriği ilk boyamada yerine
         * oturtur — animasyon olmaz, ama metin ve görseller eksiksiz görünür.
         */}
        <noscript>
          <style>{`[data-reveal]{opacity:1!important;transform:none!important}[data-parallax]{transform:none!important}`}</style>
        </noscript>
      </head>
      <body className="min-h-dvh">
        <NextIntlClientProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            {children}
            <Toaster />
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
