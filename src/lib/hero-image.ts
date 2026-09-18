import fs from "node:fs";
import path from "node:path";
import { getImageProps } from "next/image";

/** Hero fotoğrafının alternatif metni; hem `<img>` hem de yer tutucu kullanır. */
export const HERO_ALT = "Koyu bir stüdyo ışığında, geniş afro saçlı bir adamın portresi";

/**
 * Hero fotoğrafının iki kırpımı — masaüstü için 3:2 (`hero.jpg`), telefon için
 * 4:5 (`hero-mobile.jpg`). Next 16'da `priority` deprecate edildi; iki kırpımdan
 * hangisinin LCP olacağı ekran genişliğine bağlı olduğu için belgelerin sanat
 * yönetimi için önerdiği yol izlenir: `loading="eager"` + `fetchPriority="high"`,
 * duyuru ayrıca elle yapılır. Kalite varsayılan (75) bırakılır; `images.qualities`
 * allowlist'i Next 16'da yalnızca bu değeri içerir.
 */
const SHARED = { alt: HERO_ALT, sizes: "100vw", loading: "eager", fetchPriority: "high" } as const;

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
 */
export function heroSources() {
  const wide = landingFileExists("hero.jpg")
    ? getImageProps({ ...SHARED, src: "/landing/hero.jpg", width: 2000, height: 1333 }).props
    : null;
  const tall = landingFileExists("hero-mobile.jpg")
    ? getImageProps({ ...SHARED, src: "/landing/hero-mobile.jpg", width: 1200, height: 1500 }).props
    : null;
  return { wide, tall };
}

