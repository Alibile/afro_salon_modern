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
 */
const manrope = Manrope({ subsets: ["latin", "latin-ext"], variable: "--font-sans", display: "swap" });
const fraunces = Fraunces({
  subsets: ["latin", "latin-ext"],
  style: ["normal", "italic"],
  axes: ["opsz"],
  variable: "--font-display",
  display: "swap",
});
const bebas = Bebas_Neue({ weight: "400", subsets: ["latin", "latin-ext"], variable: "--font-label", display: "swap" });

export const metadata: Metadata = {
  title: "Afro Salon Modern",
  description: "Afro saç kesimi, örgü ve şekillendirme. Aynı gün randevu.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" suppressHydrationWarning className={`${manrope.variable} ${fraunces.variable} ${bebas.variable}`}>
      <body className="min-h-dvh">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
