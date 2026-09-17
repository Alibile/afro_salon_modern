import type { Metadata } from "next";
import { Inter, Bebas_Neue, Fraunces } from "next/font/google";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const inter = Inter({ subsets: ["latin", "latin-ext"], variable: "--font-sans" });
const bebas = Bebas_Neue({ weight: "400", subsets: ["latin", "latin-ext"], variable: "--font-display" });
const fraunces = Fraunces({ subsets: ["latin", "latin-ext"], style: ["italic"], axes: ["SOFT", "WONK", "opsz"], variable: "--font-serif" });

export const metadata: Metadata = {
  title: "Afro Salon Modern",
  description: "Afro saç kesimi, örgü ve şekillendirme. Aynı gün randevu.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" suppressHydrationWarning className={`${inter.variable} ${bebas.variable} ${fraunces.variable}`}>
      <body className="min-h-dvh">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
