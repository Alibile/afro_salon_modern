"use client";

import { motion, useReducedMotion } from "motion/react";

/** `Reveal`'ın sarabileceği etiketler; hepsi Motion'ın tanıdığı HTML öğeleri. */
export type RevealTag = "div" | "section" | "header" | "figure" | "p" | "span" | "li" | "ul" | "ol" | "h2" | "h3" | "dd";

/**
 * Görüş alanına girince bir kez çalışan fade-up. Yalnızca `opacity` ve
 * `transform` değişir (yerleşim hesabı yok, dolayısıyla CLS yok).
 *
 * Hareket azaltılmışsa içerik ilk boyamada görünür başlar: istemcide
 * `initial={false}` ile opaklık 0 adımı hiç kurulmaz, sunucudan gelen satır içi
 * stili de `globals.css` içindeki `[data-reveal]` kuralı geçersiz kılar — yani
 * metin JavaScript hiç çalışmasa bile gizlenmez.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  as = "div",
  distance = 16,
  ...rest
}: {
  children: React.ReactNode;
  className?: string;
  /** Saniye cinsinden gecikme; sıralı girişler için `staggerDelay` ile üretilir. */
  delay?: number;
  as?: RevealTag;
  distance?: number;
  "aria-hidden"?: boolean;
}) {
  const reduced = useReducedMotion();
  const Tag = motion[as] as typeof motion.div;
  return (
    <Tag
      data-reveal=""
      className={className}
      initial={reduced ? false : { opacity: 0, y: distance }}
      whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15, margin: "0px 0px -8% 0px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      {...rest}
    >
      {children}
    </Tag>
  );
}
