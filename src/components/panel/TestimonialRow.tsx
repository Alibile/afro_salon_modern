"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toggleTestimonial, deleteTestimonial } from "@/actions/testimonials";
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
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="destructive" disabled={pending}>Sil</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Silinsin mi?</AlertDialogTitle>
                  <AlertDialogDescription>Bu yorum kalıcı olarak silinecek. Bu işlem geri alınamaz.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Vazgeç</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => start(async () => {
                      const r = await deleteTestimonial(testimonial.id);
                      if (!r.ok) { toast.error(r.error); return; }
                      toast.success("Yorum silindi");
                      router.refresh();
                    })}
                  >
                    Sil
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      )}
    </li>
  );
}
