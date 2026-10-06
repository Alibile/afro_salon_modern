import { cn } from "@/lib/utils";
import { Label } from "./label";

/**
 * Etiket + kontrol + ipucu/hata: panel ve müşteri formlarının tek alan düzeni.
 * Etiketle kontrol arasında 6 px, altında isteğe bağlı tek satır. Hata varsa
 * ipucunun yerini alır; ikisi birden basılmaz, alan boyu zıplamaz.
 */
export function Field({
  id,
  label,
  hint,
  error,
  children,
  className,
  trailing,
}: {
  id: string;
  label: React.ReactNode;
  hint?: React.ReactNode;
  error?: string | null;
  children: React.ReactNode;
  className?: string;
  /** Etiket satırının sağına oturan küçük kontrol (dil sekmeleri gibi). */
  trailing?: React.ReactNode;
}) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={id}>{label}</Label>
        {trailing}
      </div>
      {children}
      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-sm text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
