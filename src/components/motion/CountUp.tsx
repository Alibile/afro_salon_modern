"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { animate, useInView, useMotionValue, useReducedMotion } from "motion/react";
import { formatCount } from "@/lib/motion-utils";

/** Sunucuda `useLayoutEffect` uyarı verir; orada etkisi olmayan sürüm kullanılır. */
const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * Görüş alanına girince 0'dan `value`'ya sayan rakam. Sunucudan gelen HTML
 * doğru sayıyı içerir (arama motoru ve JavaScript kapalıyken de doğru);
 * sıfırlama ilk boyamadan önce, yerleşim etkisinde yapılır, bu yüzden
 * "99 → 0" çakması görünmez.
 *
 * Ekran okuyucu animasyonun ara değerlerini duymaz: sayaç `aria-hidden`,
 * gerçek değer görsel olarak gizli bir metinde durur.
 */
export function CountUp({
  value,
  prefix = "",
  suffix = "",
  unit,
  duration = 1.6,
  className,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  /** Rakamdan sonra gelen ve rakam ölçeğinde okunmaması gereken birim ("yıl"). */
  unit?: string;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const reduced = useReducedMotion();
  const progress = useMotionValue(0);
  const [display, setDisplay] = useState(value);

  useIsomorphicLayoutEffect(() => {
    if (!reduced) setDisplay(0);
  }, [reduced]);

  useEffect(() => {
    if (!inView || reduced) return;
    const controls = animate(progress, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(v),
    });
    return () => controls.stop();
  }, [inView, reduced, value, duration, progress]);

  return (
    <span ref={ref} className={className}>
      <span aria-hidden className="tabular-nums">
        {formatCount(display, prefix, suffix)}
      </span>
      {/* Birim rakamla aynı puntoda okunursa ikinci bir sayı gibi görünür. */}
      {unit && (
        <span aria-hidden className="display-md ml-2.5 align-baseline">
          {unit}
        </span>
      )}
      <span className="sr-only">{formatCount(value, prefix, suffix)}{unit ? ` ${unit}` : ""}</span>
    </span>
  );
}
