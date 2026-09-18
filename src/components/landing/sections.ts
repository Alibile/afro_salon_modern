/**
 * Navbar ve footer aynı bölüm listesini kullanır; sıra sayfadaki sırayla aynıdır.
 * Etiketler `messages/*.json` içindeki `nav` ad alanından gelir: liste yalnızca
 * sırayı ve hedefi tutar.
 */
export const SECTION_LINKS = [
  { href: "/", key: "home" },
  { href: "#hakkimizda", key: "about" },
  { href: "#hizmetler", key: "services" },
  { href: "#ekip", key: "team" },
  { href: "#galeri", key: "gallery" },
  { href: "#yorumlar", key: "testimonials" },
  { href: "#iletisim", key: "contact" },
] as const;
