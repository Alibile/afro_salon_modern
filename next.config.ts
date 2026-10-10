import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  // `src/lib/hero-image.ts` hero kırpımlarının varlığını diskten (`fs.existsSync`)
  // denetler. Netlify/Vercel gibi sunucusuz ortamlarda `public/` CDN'den servis
  // edilir, fonksiyon paketine girmez; dosya izleyici de dinamik bir `fs`
  // çağrısını göremez. Ana sayfanın izine bu iki dosya elle eklenir, yoksa yuva
  // boşken hero desenli yer tutucuya düşerdi. Anahtar picomatch deseni olduğu
  // için köşeli parantezler kaçışlıdır.
  outputFileTracingIncludes: {
    "/\\[locale\\]": ["./public/landing/hero.jpg", "./public/landing/hero-mobile.jpg"],
  },
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

// `src/i18n/request.ts` varsayılan konumdur; eklenti mesaj yüklemesini ve
// `next-intl/config` takma adını bu dosyaya bağlar.
export default createNextIntlPlugin()(nextConfig);
