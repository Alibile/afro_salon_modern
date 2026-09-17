"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { upsertTestimonial } from "@/actions/testimonials";

type Initial = { id: string; name: string; text: string; rating: number; sortOrder: number };

export function TestimonialForm({ initial, onDone }: { initial?: Initial; onDone?: () => void }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  return (
    <form
      className="grid gap-3 sm:grid-cols-4"
      onSubmit={(e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const fd = new FormData(form);
        start(async () => {
          const r = await upsertTestimonial({
            id: initial?.id,
            name: String(fd.get("name")),
            text: String(fd.get("text")),
            rating: Number(fd.get("rating")),
            sortOrder: Number(fd.get("sortOrder")),
          });
          if (!r.ok) { setError(r.error); return; }
          setError(null);
          toast.success(initial ? "Yorum güncellendi" : "Yorum eklendi");
          router.refresh();
          onDone?.();
          if (!initial) form.reset();
        });
      }}
    >
      <div className="sm:col-span-2"><Label htmlFor="name">Ad</Label><Input id="name" name="name" defaultValue={initial?.name} required /></div>
      <div><Label htmlFor="rating">Puan (1-5)</Label><Input id="rating" name="rating" type="number" min={1} max={5} defaultValue={initial?.rating ?? 5} required /></div>
      <div><Label htmlFor="sortOrder">Sıra</Label><Input id="sortOrder" name="sortOrder" type="number" min={0} defaultValue={initial?.sortOrder ?? 0} /></div>
      <div className="sm:col-span-4"><Label htmlFor="text">Yorum</Label><Textarea id="text" name="text" defaultValue={initial?.text} required /></div>
      {error && <p className="text-sm text-destructive sm:col-span-4">{error}</p>}
      <Button type="submit" disabled={pending} className="sm:col-span-4">{initial ? "Kaydet" : "Ekle"}</Button>
    </form>
  );
}
