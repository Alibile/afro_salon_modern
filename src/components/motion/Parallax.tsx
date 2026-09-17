"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { parallaxRange } from "@/lib/motion-utils";

/**
 * Kaydırmaya bağlı dikey kayma. Öğe ekranın altından girip üstünden çıkarken
 * `+range` → `-range` piksel arasında ötelenir; `speed` ile katmanlar farklı
 * hızlara ayrılır (desen 1, fotoğraf 0.5 gibi).
 *
 * Yalnızca `transform` yazılır — `top`/`margin` gibi yerleşimi yeniden
 * hesaplatan özellikler kullanılmaz. Hareket azaltılmışsa `style` hiç
 * bağlanmaz ve öğe yerinde durur.
 */
export function Parallax({
  children,
  className,
  range = 40,
  speed = 1,
  ariaHidden = false,
}: {
  children: React.ReactNode;
  className?: string;
  range?: number;
  speed?: number;
  ariaHidden?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], parallaxRange(range, speed));
  return (
    <motion.div ref={ref} data-parallax="" className={className} style={reduced ? undefined : { y }} aria-hidden={ariaHidden || undefined}>
      {children}
    </motion.div>
  );
}
