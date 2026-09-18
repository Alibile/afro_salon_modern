import type { Metadata } from "next";
import { Manrope, Bebas_Neue, Fraunces } from "next/font/google";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

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
 * İtalik yüz ayrı bir örnek. Tek kullanıcısı `.editorial-note` ve o da her
 * sayfada ilk ekranın altında kalıyor; buna karşılık iki alt kümesi
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
const bebas = Bebas_Neue({ weight: "400", subsets: ["latin", "latin-ext"], variable: "--font-label", display: "swap" });

export const metadata: Metadata = {
  title: "Afro Salon Modern",
  description: "Afro saç kesimi, örgü ve şekillendirme. Aynı gün randevu.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" suppressHydrationWarning className={`${manrope.variable} ${fraunces.variable} ${frauncesItalic.variable} ${bebas.variable}`}>
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
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
