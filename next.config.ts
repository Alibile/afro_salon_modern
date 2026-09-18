import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Tailwind çıktısı 14 KB'lık tek bir dosya ve render'ı kilitliyordu; HTML ile
    // birlikte gelince o tur (Lighthouse'un ölçtüğü ~0.76 sn) ortadan kalkıyor.
    inlineCss: true,
  },
  images: {
    // NEXT_PUBLIC_R2_PUBLIC_URL farklı bir alan adına taşınırsa bu desen de güncellenmeli.
    remotePatterns: [{ protocol: "https", hostname: "**.r2.dev" }],
  },
};

export default nextConfig;
