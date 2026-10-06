/**
 * Hareketin saf yardımcıları: React'e ya da DOM'a bağlı değiller, bu yüzden
 * birim testlerle doğrulanabilirler. Tur 8'den beri tek kullanıcı hero'nun
 * açılış sırası (`Hero.riseDelay`): bölüm bölüm giriş, parallax ve sayaç
 * kalktı, onların yardımcıları da (`clampParallax`, `parallaxRange`,
 * `formatCount`) silindi.
 */

/** Sıralı girişlerde iki öğe arasındaki varsayılan gecikme (saniye). */
export const STAGGER_STEP = 0.06;
/**
 * Gecikmenin üst sınırı: `i * step` sınırsız büyürse son öğe yarım saniye
 * sonra gelir; tavan koyarak sıra hissi korunur, bekleme korunmaz.
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
