import { cn } from "@/lib/utils";

const TONES = {
  SCHEDULED: "bg-primary",
  COMPLETED: "bg-success",
  CANCELLED: "bg-muted-foreground",
  NO_SHOW: "bg-destructive",
} as const;

export type StatusKey = keyof typeof TONES;

/**
 * Randevu durumu: renkli nokta + metin. Dolu renkli hap yerine bu; durum
 * bilgi verir, dikkat çekmez. Metin çağıran taraftan çevrili gelir.
 */
export function StatusDot({ status, label, className }: { status: StatusKey; label: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-sm whitespace-nowrap", className)}>
      <span aria-hidden className={cn("size-2 shrink-0 rounded-full", TONES[status])} />
      {label}
    </span>
  );
}
