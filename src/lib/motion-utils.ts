/**
 * Hareketin saf yardımcıları: React'e ya da DOM'a bağlı değiller, bu yüzden
 * birim testlerle doğrulanabilirler. Bileşenler (`Reveal`, `Parallax`,
 * `CountUp`) yalnızca bu değerleri okur; kural burada tek yerde durur.
 */

/** Sıralı girişlerde iki öğe arasındaki varsayılan gecikme (saniye). */
export const STAGGER_STEP = 0.06;
/**
 * Gecikmenin üst sınırı. Uzun listelerde (12 galeri kartı) `i * step`
 * sınırsız büyürse son kart yarım saniye sonra gelir ve kaydırma hızını
 * yakalayamaz; tavan koyarak sıra hissi korunur, bekleme korunmaz.
 */
export const STAGGER_MAX = 0.3;

/**
 * `index`. öğenin giriş gecikmesi (saniye). Negatif indeks 0 sayılır,
 * sonuç `STAGGER_MAX` ile sınırlanır.
 */
export function staggerDelay(index: number, step: number = STAGGER_STEP, max: number = STAGGER_MAX): number {
  if (!Number.isFinite(index) || index <= 0) return 0;
  const delay = Math.trunc(index) * step;
  return delay > max ? max : delay;
}

/**
 * Parallax kaydırma miktarını ±`range` piksel aralığına kıstırır. `range`
 * negatif verilirse mutlak değeri kullanılır; böylece çağıran taraf yön
 * hatası yüzünden katman taşımaz.
 */
export function clampParallax(value: number, range: number): number {
  const limit = Math.abs(range);
  if (!Number.isFinite(value)) return 0;
  if (value > limit) return limit;
  if (value < -limit) return -limit;
  return value;
}

/**
 * `useTransform` için çıkış aralığı: öğe ekranın altındayken `+range`
 * (aşağıda), üstünden çıkarken `-range` (yukarıda). `speed` katmanları
 * farklı hızlara ayırır (desen 1.0, fotoğraf 0.5 gibi).
 */
export function parallaxRange(range: number, speed: number = 1): [number, number] {
  const limit = Math.abs(range) * Math.abs(speed);
  return [limit, -limit];
}

/**
 * Sayaç metni: ondalık ara değerler tam sayıya yuvarlanır (ekranda hep tam
 * sayı görünür), önek/sonek olduğu gibi eklenir. Türkçe binlik ayracı
 * kullanılmaz — sayılar iki basamaklı, ayraç gürültü olurdu.
 */
export function formatCount(value: number, prefix: string = "", suffix: string = ""): string {
  const safe = Number.isFinite(value) ? Math.round(value) : 0;
  return `${prefix}${safe}${suffix}`;
}
