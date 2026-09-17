"use client";

import { useEffect, useRef, useState } from "react";
import { animate, useInView, useMotionValue, useReducedMotion } from "motion/react";
import { formatCount } from "@/lib/motion-utils";

/**
 * Görüş alanına girince 0'dan `value`'ya sayan rakam. Görünen sayaç sunucuda da
 * 0'dan başlar, yani hidrasyondan önce ve sonra aynı şeyi gösterir — "99 → 0"
 * çakması olmaz. Hareket kapalıysa hiç saymaz, doğrudan son değeri gösterir.
 *
 * Gerçek değer her zaman HTML'de durur (görsel olarak gizli metin): arama
 * motoru, ekran okuyucu ve JavaScript çalışmayan tarayıcı doğru sayıyı görür.
 * Sayaç `aria-hidden` olduğu için ara değerler ekran okuyucuya okunmaz.
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
  const [counted, setCounted] = useState(0);
  // Hareket kapalıyken gösterilen değer bir durum değil, bir türetme: efektle
  // "düzeltmek" fazladan bir çizim turu demek olurdu.
  const display = reduced ? value : counted;

  useEffect(() => {
    if (!inView || reduced) return;
    const controls = animate(progress, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setCounted(v),
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
