import type { SiteImages } from "@/lib/queries/content";

/**
 * Görsel yuvalarının süreç içi son görüntüsü. Hero'nun ön yükleme duyurusu
 * (`preloadHero`) ancak sayfanın ilk `await`inden **önce** çağrılırsa
 * `<head>`e giriyor; yuvalar ise veritabanında. Sayfa önce bu anlık görüntüyle
 * duyurur, sonra gerçek veriyi okur ve görüntüyü tazeler. Panel yuvayı
 * değiştirince görüntü unutulur: bir sonraki istek duyuruyu geç yapar (var
 * ama erken değil), ondan sonrakiler yine erkendir. Birden çok sunucu
 * örneğinde her örnek kendi görüntüsünü ısıtır; bir değişiklikten sonra
 * öbür örnek bir istek boyunca eski dosyayı duyurabilir (fazladan bir
 * indirme, yanlış görsel değil: `<img>` her zaman veritabanından okur).
 */
let snapshot: SiteImages | null = null;

export function peekSiteImages(): SiteImages | null {
  return snapshot;
}

export function rememberSiteImages(images: SiteImages): void {
  snapshot = images;
}

export function forgetSiteImages(): void {
  snapshot = null;
}
