"use client";

import { MotionConfig } from "motion/react";

/**
 * Hareketin kapsamı. `reducedMotion="user"` ile işletim sistemi ayarı
 * `prefers-reduced-motion: reduce` diyorsa Motion tüm dönüşüm/opaklık
 * animasyonlarını kendiliğinden kapatır ve son duruma atlar.
 *
 * Yalnızca ana sayfa ağacını ve giriş/kayıt sayfalarının sol panelini sarar;
 * kök yerleşime konmaz, böylece panel ve randevu akışı hareketsiz kalır.
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </MotionConfig>
  );
}
