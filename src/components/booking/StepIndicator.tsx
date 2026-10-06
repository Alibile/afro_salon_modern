"use client";
import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

const STEPS = ["step1", "step2", "step3"] as const;

/**
 * Üç adımlık ilerleme: tamamlanan adım onay işaretiyle, etkin adım terracotta
 * ve alt çizgiyle, sıradaki soluk. Ziyaretçi nerede olduğunu okur; adımların
 * kendisi aşağıda açılıp kapanır.
 */
export function StepIndicator({ current }: { current: 1 | 2 | 3 }) {
  const t = useTranslations("booking");
  return (
    <ol aria-label={t("stepsLabel")} className="flex gap-6 border-b border-border text-sm">
      {STEPS.map((key, i) => {
        const n = i + 1;
        const done = n < current;
        const active = n === current;
        return (
          <li
            key={key}
            aria-current={active ? "step" : undefined}
            className={cn(
              "-mb-px flex items-center gap-1.5 border-b-2 pb-3 whitespace-nowrap",
              active ? "border-primary font-medium text-primary" : "border-transparent",
              done ? "text-foreground" : !active && "text-muted-foreground",
            )}
          >
            {done ? <Check aria-hidden className="size-4 text-primary" /> : <span className="tabular-nums">{n}.</span>}
            {t(key)}
          </li>
        );
      })}
    </ol>
  );
}
