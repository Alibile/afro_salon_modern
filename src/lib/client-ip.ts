/**
 * İstemci IP'sini istek başlıklarından çözer. Yalnızca hız sınırı anahtarı
 * olarak kullanılır; yetkilendirme kararı buna dayanmaz.
 *
 * Sıra, en çok güvenilenden en aza doğrudur:
 * 1. `x-vercel-forwarded-for` — yalnızca Vercel proxy'si yazar, istemci
 *    tarafından taklit edilemez.
 * 2. `x-real-ip` — proxy'nin (nginx vb.) tek bir değer olarak yazdığı IP.
 * 3. `x-forwarded-for` — istemci kendi başını uydurabildiğinden ilk değil,
 *    SON hop alınır: zinciri en son ekleyen bize en yakın proxy'dir.
 *
 * Hiçbiri yoksa (yerel geliştirme, doğrudan bağlantı) `"local"` döner.
 */
export function clientIp(headers: { get(name: string): string | null }): string {
  const vercel = headers.get("x-vercel-forwarded-for")?.trim();
  if (vercel) return vercel;

  const real = headers.get("x-real-ip")?.trim();
  if (real) return real;

  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const hops = forwarded
      .split(",")
      .map((h) => h.trim())
      .filter((h) => h !== "");
    const last = hops[hops.length - 1];
    if (last) return last;
  }

  return "local";
}
