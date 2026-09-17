import { cn } from "@/lib/utils";

export type PatternVariant = "kente" | "mud" | "tarak";

/**
 * Kente/mudcloth esintili geometrik desen. Tek renk (`currentColor`) kullanır,
 * böylece hem açık hem koyu temada bulunduğu bloğun rengini alır.
 * Dekoratiftir: `aria-hidden`.
 */
export function AfroPattern({
  variant = "kente",
  size = 72,
  opacity = 0.08,
  className,
}: {
  variant?: PatternVariant;
  size?: number;
  opacity?: number;
  className?: string;
}) {
  const id = `afro-${variant}-${size}`;
  return (
    <svg aria-hidden="true" focusable="false" className={cn("pointer-events-none absolute inset-0 h-full w-full", className)} style={{ opacity }}>
      <defs>
        <pattern id={id} width={size} height={size} patternUnits="userSpaceOnUse" viewBox="0 0 72 72">
          {variant === "kente" && (
            <g fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M36 4 L68 36 L36 68 L4 36 Z" />
              <path d="M36 22 L50 36 L36 50 L22 36 Z" fill="currentColor" stroke="none" />
              <path d="M0 0 V72 M72 0 V72" strokeWidth="4" />
            </g>
          )}
          {variant === "mud" && (
            <g fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square">
              <path d="M0 14 L18 32 L36 14 L54 32 L72 14" />
              <path d="M0 58 L18 40 L36 58 L54 40 L72 58" />
              <path d="M9 0 H15 M33 0 H39 M57 0 H63 M9 72 H15 M33 72 H39 M57 72 H63" strokeWidth="5" />
            </g>
          )}
          {variant === "tarak" && (
            <g fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M-4 52 A 40 40 0 0 1 76 52" />
              <path d="M-4 24 A 40 40 0 0 1 76 24" />
              <path d="M12 52 V68 M36 52 V68 M60 52 V68" />
            </g>
          )}
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}
