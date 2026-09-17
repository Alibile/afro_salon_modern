import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // NEXT_PUBLIC_R2_PUBLIC_URL farklı bir alan adına taşınırsa bu desen de güncellenmeli.
    remotePatterns: [{ protocol: "https", hostname: "**.r2.dev" }],
  },
};

export default nextConfig;
