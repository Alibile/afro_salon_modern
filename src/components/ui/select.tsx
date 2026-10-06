import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Yerel `<select>`, `Input` ile aynı yükseklik, köşe ve kenarlıkta. Tarayıcı
 * oku gizlenir, yerine sağda tek bir ikon durur; açılır liste tarayıcının
 * kendisidir (telefonda sistem seçicisi), özel bir menü kurulmaz.
 */
export function Select({ className, children, ...props }: React.ComponentProps<"select">) {
  return (
    <span className={cn("relative block", className)}>
      <select
        data-slot="select"
        className={cn(
          "h-10 w-full min-w-0 appearance-none rounded-[var(--radius)] border border-input bg-transparent py-1 pr-9 pl-3 text-base transition-colors outline-none md:text-sm",
          "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30",
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown aria-hidden className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
    </span>
  );
}
