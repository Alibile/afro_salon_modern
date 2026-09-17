"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
              {testimonial.name} {!testimonial.isActive && <Badge variant="secondary">Pasif</Badge>}
            </p>
            <p className="text-sm text-amber-500" aria-label={`${testimonial.rating} / 5 yıldız`}>
              {"★".repeat(testimonial.rating)}
              {"☆".repeat(5 - testimonial.rating)}
            </p>
            <p className="text-sm text-muted-foreground">{truncate(testimonial.text, 120)}</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setEditing(true)}>Düzenle</Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={pending}
              onClick={() => start(async () => { await toggleTestimonial(testimonial.id, !testimonial.isActive); router.refresh(); })}
            >
              {testimonial.isActive ? "Pasife al" : "Aktif et"}
            </Button>
            <DeleteButton
              title="Yorum silinsin mi?"
              description={`"${testimonial.name}" yorumu kalıcı olarak silinecek. Bu işlem geri alınamaz.`}
              onConfirm={() => deleteTestimonial(testimonial.id)}
              successMessage="Yorum silindi"
            />
          </div>
        </div>
      )}
    </li>
  );
}
