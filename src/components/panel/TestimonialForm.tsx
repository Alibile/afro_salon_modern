"use client";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { upsertTestimonial } from "@/actions/testimonials";
import { useActionError } from "@/lib/use-action-error";
import { useNewRecordClose } from "./NewRecordPanel";

type Initial = { id: string; name: string; text: string; rating: number; sortOrder: number };

export function TestimonialForm({ initial, onDone }: { initial?: Initial; onDone?: () => void }) {
  const t = useTranslations("panel");
  const showError = useActionError();
  const closePanel = useNewRecordClose();
  const [pending, start] = useTransition();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  return (
    <form
      className="grid gap-4 sm:grid-cols-4"
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
          if (!r.ok) { setError(showError(r)); return; }
          setError(null);
          toast.success(initial ? t("testimonials.updated") : t("testimonials.added"));
          router.refresh();
          onDone?.();
          if (!initial) { form.reset(); closePanel(); }
        });
      }}
    >
      <Field id="name" label={t("testimonials.name")} className="sm:col-span-2">
        <Input id="name" name="name" defaultValue={initial?.name} required />
      </Field>
      <Field id="rating" label={t("testimonials.rating")}>
        <Select id="rating" name="rating" defaultValue={initial?.rating ?? 5}>
          {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n}</option>)}
        </Select>
      </Field>
      <Field id="sortOrder" label={t("testimonials.sortOrder")}>
        <Input id="sortOrder" name="sortOrder" type="number" min={0} defaultValue={initial?.sortOrder ?? 0} />
      </Field>
      <Field id="text" label={t("testimonials.text")} className="sm:col-span-4">
        <Textarea id="text" name="text" defaultValue={initial?.text} required rows={3} />
      </Field>
      {error && <p className="text-sm text-destructive sm:col-span-4">{error}</p>}
      <div className="flex justify-end gap-2 sm:col-span-4">
        {initial && onDone && <Button type="button" variant="ghost" onClick={onDone}>{t("common.cancel")}</Button>}
        <Button type="submit" disabled={pending}>{initial ? t("common.save") : t("common.add")}</Button>
      </div>
    </form>
  );
}
