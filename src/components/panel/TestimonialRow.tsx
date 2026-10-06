"use client";
import { useState, useTransition } from "react";
import { Star } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toggleTestimonial, deleteTestimonial } from "@/actions/testimonials";
import { DeleteButton } from "./DeleteButton";
import { TestimonialForm } from "./TestimonialForm";
import { cn } from "@/lib/utils";

type T = { id: string; name: string; text: string; rating: number; sortOrder: number; isActive: boolean };

export function TestimonialRow({ testimonial }: { testimonial: T }) {
  const t = useTranslations("panel");
  const [editing, setEditing] = useState(false);
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <li className="p-4">
      {editing ? (
        <TestimonialForm initial={testimonial} onDone={() => setEditing(false)} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-start">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium">{testimonial.name}</p>
              <p role="img" aria-label={t("testimonials.stars", { rating: testimonial.rating })} className="flex gap-0.5 text-primary">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} aria-hidden className={cn("size-3.5", i <= testimonial.rating ? "fill-current" : "text-muted-foreground/40")} />
                ))}
              </p>
              {!testimonial.isActive && <Badge variant="outline">{t("common.inactive")}</Badge>}
            </div>
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{testimonial.text}</p>
          </div>
          <div className="flex flex-wrap gap-1 sm:justify-end">
            <Button size="sm" variant="outline" onClick={() => setEditing(true)}>{t("common.edit")}</Button>
            <Button size="sm" variant="ghost" disabled={pending}
              onClick={() => start(async () => { await toggleTestimonial(testimonial.id, !testimonial.isActive); router.refresh(); })}>
              {testimonial.isActive ? t("common.deactivate") : t("common.activate")}
            </Button>
            <DeleteButton
              title={t("testimonials.deleteTitle")}
              description={t("testimonials.deleteDescription", { name: testimonial.name })}
              onConfirm={() => deleteTestimonial(testimonial.id)}
              successMessage={t("testimonials.deleted")}
            />
          </div>
        </div>
      )}
    </li>
  );
}
