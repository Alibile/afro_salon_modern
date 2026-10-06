"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

/**
 * `md` altında tablo kart listesine düşer: başlık satırı gizlenir, her satır
 * kenarlıklı bir blok olur, her hücre `data-label` ile kendi etiketini basar.
 * `md` ve üstünde sıradan tablo. Hücre etiketini `RCell` verir; etiket
 * sütun başlığıyla aynı metindir (`data-label` e2e'de de aranır).
 */
export function ResponsiveTable({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("rounded-[var(--radius)] border border-border", className)}>
      <Table
        className={cn(
          "max-md:block max-md:[&_thead]:hidden max-md:[&_tbody]:block",
          "max-md:[&_tr]:block max-md:[&_tr]:border-b max-md:[&_tr]:border-border max-md:[&_tr]:p-4 max-md:[&_tr:last-child]:border-0",
          "max-md:[&_td]:block max-md:[&_td]:px-0 max-md:[&_td]:py-1 max-md:[&_td]:whitespace-normal",
          "max-md:[&_td[data-label]]:before:block max-md:[&_td[data-label]]:before:text-xs max-md:[&_td[data-label]]:before:text-muted-foreground max-md:[&_td[data-label]]:before:content-[attr(data-label)]",
        )}
      >
        {children}
      </Table>
    </div>
  );
}

/** `RHeader` = thead, `RHead` = başlık satırı (tr), `RRow` = gövde satırı, `RBody` = tbody. */
export { TableBody as RBody, TableRow as RHead, TableHeader as RHeader, TableRow as RRow };

/** Etiketli hücre: geniş ekranda sıradan `td`, telefonda etiketi üstünde. */
export function RCell({ label, className, ...props }: React.ComponentProps<typeof TableCell> & { label?: string }) {
  return <TableCell data-label={label} className={cn("px-4 py-3", className)} {...props} />;
}

export function RHeadCell({ className, ...props }: React.ComponentProps<typeof TableHead>) {
  return <TableHead className={cn("px-4", className)} {...props} />;
}
