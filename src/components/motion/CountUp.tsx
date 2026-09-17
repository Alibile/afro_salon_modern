"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { animate, useInView, useMotionValue, useReducedMotion } from "motion/react";
import { formatCount } from "@/lib/motion-utils";

/**
 * Hidrasyon algılama: sunucu anlık görüntüsü `false`, istemcininki `true`.
 * Abonelik gerekmez — değer bir kez değişir, onu da React hidrasyondan sonra
 * kendisi yeniden okur. (Efektte `setState` çağırmanın lint'siz karşılığı.)
 */
const subscribeNever = () => () => {};

/**
 * Görüş alanına girince 0'dan `value`'ya sayan rakam.
 *
 * Sunucu çıktısı ve hidrasyon anı gerçek değeri basar: JavaScript hiç
 * çalışmazsa sayfada "0" değil, doğru sayı kalır. Sıfırdan sayma ancak istemci
 * bağlandıktan sonra başlar (`hydrated`), yani hidrasyon uyuşmazlığı olmaz.
 * Hareket kapalıysa hiç saymaz, doğrudan son değeri gösterir.
 *
 * Gerçek değer ayrıca görsel olarak gizli metinde durur: arama motoru ve ekran
 * okuyucu doğru sayıyı görür. Sayaç `aria-hidden` olduğu için ara değerler
 * ekran okuyucuya okunmaz.
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
  const hydrated = useSyncExternalStore(subscribeNever, () => true, () => false);
  // Hareket kapalıyken (ya da istemci henüz bağlanmamışken) gösterilen değer bir
  // durum değil, bir türetme: efektle "düzeltmek" fazladan bir çizim turu olurdu.
  const display = reduced || !hydrated ? value : counted;

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
