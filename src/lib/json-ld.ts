/**
 * JSON-LD'yi `<script>` gövdesine gömülebilir hâle getirir.
 *
 * `JSON.stringify` çıktısı geçerli JSON'dur ama geçerli **HTML** değildir:
 * metnin içinde geçen bir `</script>` dizisi etiketi olduğu yerde kapatır ve
 * gerisi sayfaya işaretleme olarak girer. Veri panelden (hizmet adı, fiyat) ve
 * çeviri dosyalarından geldiği için bu teoride kalmaz.
 *
 * `<`, `>` ve `&` JSON kaçışlarına (`<` …) çevrilir — JSON çözümleyicisi
 * onları aynı karaktere geri açar, yani yapısal veri birebir aynı kalır.
 * U+2028/U+2029 ise JSON'da serbest, JavaScript kaynağında satır sonu sayılır;
 * onlar da kaçırılır.
 */
const ESCAPES: Record<string, string> = {
  "<": "\\u003c",
  ">": "\\u003e",
  "&": "\\u0026",
  "\u2028": "\\u2028",
  "\u2029": "\\u2029",
};

export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/[<>&\u2028\u2029]/g, (char) => ESCAPES[char]);
}
