"use client";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toggleTestimonial, deleteTestimonial } from "@/actions/testimonials";
import { DeleteButton } from "./DeleteButton";
import { TestimonialForm } from "./TestimonialForm";

type T = { id: string; name: string; text: string; rating: number; sortOrder: number; isActive: boolean };

function truncate(text: string, max: number) {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

export function TestimonialRow({ testimonial }: { testimonial: T }) {
  const t = useTranslations("panel");
  const [editing, setEditing] = useState(false);
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <li className="rounded-xl border bg-card p-4">
      {editing ? (
        <TestimonialForm initial={testimonial} onDone={() => setEditing(false)} />
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="font-medium">
              {testimonial.name} {!testimonial.isActive && <Badge variant="secondary">{t("common.inactive")}</Badge>}
            </p>
            <p className="text-sm text-amber-500" aria-label={t("testimonials.stars", { rating: testimonial.rating })}>
              {"★".repeat(testimonial.rating)}
              {"☆".repeat(5 - testimonial.rating)}
            </p>
            <p className="text-sm text-muted-foreground">{truncate(testimonial.text, 120)}</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setEditing(true)}>{t("common.edit")}</Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={pending}
              onClick={() => start(async () => { await toggleTestimonial(testimonial.id, !testimonial.isActive); router.refresh(); })}
            >
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
