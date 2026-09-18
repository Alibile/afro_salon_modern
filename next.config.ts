import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Tailwind çıktısı 14 KB'lık tek bir dosya ve render'ı kilitliyordu; HTML ile
    // birlikte gelince o tur (Lighthouse'un ölçtüğü ~0.76 sn) ortadan kalkıyor.
    inlineCss: true,
  },
  images: {
    // Varsayılan yalnızca WebP'dir. AVIF öne alınınca destekleyen tarayıcılar
    // (Accept başlığına göre) hero fotoğrafını belirgin biçimde daha küçük
    // indirir — LCP doğrudan bu baytlara bağlı. Desteklemeyen tarayıcı listedeki
    // bir sonrakine (WebP), o da yoksa kaynağa düşer. Bedeli sunucuda bir kerelik
    // daha yavaş kodlamadır; sonuç önbelleğe alınır.
    formats: ["image/avif", "image/webp"],
    // NEXT_PUBLIC_R2_PUBLIC_URL farklı bir alan adına taşınırsa bu desen de güncellenmeli.
    remotePatterns: [{ protocol: "https", hostname: "**.r2.dev" }],
  },
};

export default nextConfig;
