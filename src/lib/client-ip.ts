/**
 * İstemci IP'sini istek başlıklarından çözer. Yalnızca hız sınırı anahtarı
 * olarak kullanılır; yetkilendirme kararı buna dayanmaz.
 *
 * Sıra, en çok güvenilenden en aza doğrudur:
 * 1. `x-nf-client-connection-ip` — yalnızca Netlify'ın kenar katmanı yazar,
 *    istemciden gelen aynı adlı başlığın üzerine yazılır; taklit edilemez.
 * 2. `x-vercel-forwarded-for` — Vercel'deki karşılığı.
 * 3. `x-real-ip` — proxy'nin (nginx vb.) tek bir değer olarak yazdığı IP.
 * 4. `x-forwarded-for` — istemci kendi başını uydurabildiğinden ilk değil,
 *    SON hop alınır: zinciri en son ekleyen bize en yakın proxy'dir.
 *
 * Hiçbiri yoksa (yerel geliştirme, doğrudan bağlantı) `"local"` döner.
 */
export function clientIp(headers: { get(name: string): string | null }): string {
  const netlify = headers.get("x-nf-client-connection-ip")?.trim();
  if (netlify) return netlify;

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
