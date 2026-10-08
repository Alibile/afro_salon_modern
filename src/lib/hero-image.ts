import fs from "node:fs";
import path from "node:path";
import { getImageProps } from "next/image";
import { preload } from "react-dom";
import { publicUrl } from "@/lib/storage-public";
import type { SiteImages, SiteImageView } from "@/lib/queries/content";

/**
 * Hero fotoğrafının iki kırpımı — masaüstü için 3:2 (`hero.jpg`), telefon için
 * 4:5 (`hero-mobile.jpg`). Next 16'da `priority` deprecate edildi; iki kırpımdan
 * hangisinin LCP olacağı ekran genişliğine bağlı olduğu için belgelerin sanat
 * yönetimi için önerdiği yol izlenir: `loading="eager"` + `fetchPriority="high"`,
 * duyuru ayrıca elle yapılır. Kalite varsayılan (75) bırakılır; `images.qualities`
 * allowlist'i Next 16'da yalnızca bu değeri içerir.
 */
const SHARED = { sizes: "100vw", loading: "eager", fetchPriority: "high" } as const;

/** `public/landing/<name>` dosyası diskte var mı? Yalnızca sunucuda çağrılır. */
function landingFileExists(name: string) {
  return fs.existsSync(path.join(process.cwd(), "public", "landing", name));
}

/**
 * Var olan hero kırpımlarının `<img>` özellikleri. `getImageProps`, Next'in
 * görsel iyileştirmesini (`/_next/image`, AVIF/WebP, `srcset`) `<picture>`
 * içinde de korur; ön yükleme duyurusu da aynı `srcSet`/`sizes` çiftini
 * kullanır, böylece tarayıcı duyurulan dosyayı yeniden indirmez.
 *
 * Dosyası olmayan kırpım `null` döner: `Hero` tek kırpım varsa onu iki ekranda
 * da kullanır, hiçbiri yoksa desenli yer tutucuya düşer (kırık görsel çıkmaz).
 * Kontrol `ImageSlot` ile aynı desendir; hero kendi işaretlemesini kurduğu için
 * o bileşen yerine bu yardımcıyı kullanır.
 *
 * `alt` zorunludur ve varsayılanı yoktur: varsayılan boş dize, çeviriyi
 * geçirmeyi unutan çağrıyı sessizce alt metinsiz bir LCP görseline çevirirdi.
 * Metin gerçekten gereksizse (ön yükleme duyurusu `<img>` üretmez) çağıran
 * bunu açıkça `""` yazarak söyler.
 */
/** Yuva doluysa yuvanın fotoğrafı (kayıtlı ölçüsüyle), yoksa `public/landing/<file>`, o da yoksa `null`. */
function source(slot: SiteImageView | null, file: string, width: number, height: number, alt: string) {
  if (slot) return getImageProps({ ...SHARED, alt, src: publicUrl(slot.storageKey), width: slot.width, height: slot.height }).props;
  if (landingFileExists(file)) return getImageProps({ ...SHARED, alt, src: `/landing/${file}`, width, height }).props;
  return null;
}

export function heroSources(images: Pick<SiteImages, "hero" | "heroMobile">, alt: string) {
  const wide = source(images.hero, "hero.jpg", 2000, 1333, alt);
  const tall = source(images.heroMobile, "hero-mobile.jpg", 1200, 1500, alt);
  return { wide, tall };
}

/**
 * Hero fotoğrafının ön yükleme duyurusu. `Hero` gövdenin içinde olduğu için
 * oradaki `<link>` ancak `inlineCss`in `<head>`e bastığı ~76 KB'lık stil
 * bloğundan sonra görünüyordu; ön tarama yazı tiplerini o blokta önce buluyor
 * ve LCP fotoğrafı yüz kuyruğunun arkasına düşüyordu. `ReactDOM.preload()`
 * kaydı `<head>`in en başına, `charset`/`viewport`tan hemen sonra taşır.
 *
 * Çağrı kökte değil, ana sayfanın kendisinde yapılır (veri beklenmeden önce):
 * çıktıdaki sıra ikisinde de birebir aynı — React duyuruları kendi kovasında
 * toplar — ama kökten çağrılınca hero fotoğrafı giriş/panel gibi onu hiç
 * göstermeyen sayfalarda da indirilirdi.
 *
 * `media` ile iki kırpımdan yalnızca ekrana uyan indirilir; `imageSizes`/
 * `imageSrcSet` çifti `<img>`in kendi `srcset`iyle birebir aynı olduğu için
 * tarayıcı duyurulan dosyayı ikinci kez istemez (cihaz başına tek indirme).
 * Tek kırpım varsa `media` yazılmaz — eşleşmeyen bir sorgu duyuruyu boşa
 * çıkarırdı.
 */
export function preloadHero(images: Pick<SiteImages, "hero" | "heroMobile">) {
  // Duyuru `<img>` üretmez, yalnızca `src`/`srcSet` okunur: alt metni yok.
  const { wide, tall } = heroSources(images, "");
  const both = wide !== null && tall !== null;
  if (wide) {
    preload(wide.src, { as: "image", fetchPriority: "high", imageSrcSet: wide.srcSet, imageSizes: "100vw", media: both ? "(min-width: 768px)" : undefined });
  }
  if (tall) {
    preload(tall.src, { as: "image", fetchPriority: "high", imageSrcSet: tall.srcSet, imageSizes: "100vw", media: both ? "(max-width: 767px)" : undefined });
  }
}
