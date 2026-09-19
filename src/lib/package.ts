/**
 * Salon bugün tek bir paketle çalışıyor: "Yıkama + Kesim + Sakal", 45 dakika,
 * tek fiyat. Ana sayfanın iki yeri bu gerçeğe göre şekil değiştiriyor —
 * hizmetler bölümü (liste yerine paket kartı) ve SSS'teki "ne kadar sürüyor,
 * ne kadar tutuyor" sorusu. İki yer aynı koşulu ayrı ayrı yazsaydı, panelden
 * ikinci bir hizmet eklendiğinde biri paket düzeninden çıkar öbürü tek fiyattan
 * söz etmeye devam ederdi.
 *
 * Koşul bilinçli olarak "tam olarak bir aktif hizmet": sıfırsa ortada anlatacak
 * paket yok, birden fazlaysa "tek fiyat" cümlesi yalan olur.
 */
export function singlePackage<T>(services: readonly T[]): T | null {
  return services.length === 1 ? services[0] : null;
}
