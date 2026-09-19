/**
 * Navbar ve footer aynı bölüm listesini kullanır; sıra sayfadaki sırayla aynıdır.
 * Etiketler `messages/*.json` içindeki `nav` ad alanından gelir: liste yalnızca
 * sırayı ve hedefi tutar.
 *
 * "Ana Sayfa" bağlantısı listede yoktur: üst çubuktaki logo zaten ana sayfaya
 * gider (erişilebilir adını `nav.home` verir) ve kendi sayfasına işaret eden
 * bir menü maddesi altı bölüm bağlantısının yanında yalnızca yer kaplıyordu.
 */
export const SECTION_LINKS = [
  { href: "#hakkimizda", key: "about" },
  { href: "#hizmetler", key: "services" },
  { href: "#ekip", key: "team" },
  { href: "#galeri", key: "gallery" },
  { href: "#yorumlar", key: "testimonials" },
  { href: "#iletisim", key: "contact" },
] as const;

/**
 * Altbilginin "Site" sütunu bir adım uzun: SSS bölümü üst çubuğa girmez
 * (menüyü 1280 px'te taşırırdı) ama aranan bir bağlantıdır, altbilgide durur.
 * "Nasıl çalışır" ikisinde de yoktur — hero'nun hemen altında, ziyaretçi zaten
 * oradan geçiyor.
 */
export const FOOTER_LINKS = [...SECTION_LINKS, { href: "#sss", key: "faq" }] as const;
