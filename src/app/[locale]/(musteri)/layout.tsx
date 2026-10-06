/**
 * Müşteri yüzünün yerleşimi hiçbir şey çizmez. Üst çubuğu (`SiteNav`) ve
 * `<main>` sarmalını her sayfa kendisi kurar: ana sayfa fotoğrafın üstünde
 * şeffaf başlayan `hero` varyantını, randevu ve hesap sayfaları düz `plain`
 * varyantını ister; çubuk `<main>`in dışında durduğu için `banner` landmark'ı
 * olarak okunur.
 */
export default function MusteriLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
