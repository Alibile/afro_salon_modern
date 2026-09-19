/**
 * Sitenin mutlak kök adresi. Arama motorlarına verilen her adres (hreflang
 * bağlantıları, `canonical`, `sitemap.xml`, `robots.txt`) mutlak olmak
 * zorundadır; göreli yol veren bir site haritası geçersizdir.
 *
 * Değer `NEXT_PUBLIC_SITE_URL`'den okunur. Ön ek bilinçli olarak `NEXT_PUBLIC_`:
 * derleme sırasında gömülür, böylece hem sunucuda hem de istemciye giden
 * kodda aynı adres durur ve üretim derlemesi env okumaya bağlı kalmaz.
 * Tanımsız ya da boşsa geliştirme adresine düşer — yerelde `next build`
 * almanın bedeli bir uyarı olmasın diye.
 *
 * Sondaki eğik çizgi(ler) atılır: adresler her zaman `siteUrl() + "/yol"`
 * biçiminde birleştirilir, iki çizgili `https://site//randevu` çıkmasın.
 */
const FALLBACK_SITE_URL = "http://localhost:3000";

export function siteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const base = configured ? configured : FALLBACK_SITE_URL;
  return base.replace(/\/+$/, "");
}
