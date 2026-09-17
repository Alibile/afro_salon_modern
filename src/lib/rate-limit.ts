/**
 * Tek süreçte çalışan, bellek içi kayan pencere sayacı. Küçük bir salon için
 * yeterlidir: birden çok sunucu örneği kullanılmaya başlanırsa paylaşımlı bir
 * depoya (Redis vb.) taşınmalıdır. Süreç yeniden başladığında sayaç sıfırlanır.
 */
const hits = new Map<string, number[]>();

/** Harita sınırsız büyümesin: eşik aşılınca süresi geçmiş anahtarlar atılır. */
const MAX_KEYS = 5_000;

function prune(now: number, windowMs: number) {
  for (const [key, times] of hits) {
    if (times.length === 0 || times[times.length - 1] <= now - windowMs) hits.delete(key);
  }
}

/**
 * `key` için son `windowMs` içinde `limit` isteğe izin verir. İzin verilen her
 * çağrı sayılır; reddedilen çağrı sayılmaz, yani pencereyi uzatmaz.
 */
export function allow(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  if (hits.size > MAX_KEYS) prune(now, windowMs);
  const cutoff = now - windowMs;
  const recent = (hits.get(key) ?? []).filter((t) => t > cutoff);
  if (recent.length >= limit) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  return true;
}

/** Yalnızca testler için: tüm sayaçları sıfırlar. */
export function resetRateLimit() {
  hits.clear();
}
