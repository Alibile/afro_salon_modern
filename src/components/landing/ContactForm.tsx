"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { sendContactMessage } from "@/actions/contact";
import { useActionError } from "@/lib/use-action-error";

/** Kutu yerine alt çizgi: bölümün ince çizgi diline uyar. */
const FIELD =
  "rounded-none border-0 border-b border-input bg-transparent px-0 focus-visible:border-primary focus-visible:bg-primary/5 focus-visible:ring-0 dark:bg-transparent";

export function ContactForm({ services }: { services: string[] }) {
  const t = useTranslations("landing.form");
  const showError = useActionError();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="relative mt-8"
      onSubmit={(e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const fd = new FormData(form);
        start(async () => {
          const r = await sendContactMessage({
            name: String(fd.get("name") ?? ""),
            phone: String(fd.get("phone") ?? ""),
            message: String(fd.get("message") ?? ""),
            services: fd.getAll("services").map(String),
            website: String(fd.get("website") ?? ""),
          });
          if (!r.ok) {
            setError(showError(r));
            return;
          }
          setError(null);
          toast.success(t("success"));
          form.reset();
        });
      }}
    >
      {/* Bot tuzağı: ekran dışında, klavye ve ekran okuyucu sırasının dışında. */}
      <div aria-hidden className="pointer-events-none absolute -left-[9999px] top-0 h-0 w-0 overflow-hidden">
        <label htmlFor="website">{t("honeypot")}</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="contact-name">{t("name")}</Label>
          <Input id="contact-name" name="name" required minLength={2} maxLength={60} autoComplete="name" className={`h-10 ${FIELD}`} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="contact-phone">{t("phone")}</Label>
          <Input id="contact-phone" name="phone" type="tel" maxLength={20} autoComplete="tel" className={`h-10 ${FIELD}`} />
        </div>
      </div>

      {services.length > 0 && (
        <fieldset className="mt-8">
          <legend className="text-sm font-medium">{t("servicesLegend")}</legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {services.map((s) => (
              <label key={s} className="cursor-pointer">
                <input type="checkbox" name="services" value={s} className="peer sr-only" />
                <span className="inline-block border border-border px-3 py-1.5 text-sm transition-colors peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-hover:border-primary">
                  {s}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <div className="mt-8 grid gap-2">
        <Label htmlFor="contact-message">{t("message")}</Label>
        <Textarea
          id="contact-message"
          name="message"
          required
          minLength={10}
          maxLength={1000}
          rows={4}
          placeholder={t("messagePlaceholder")}
          className={`min-h-28 ${FIELD}`}
        />
      </div>

      {error && (
        <p role="alert" className="mt-4 text-sm text-destructive">
          {error}
        </p>
      )}

      <Button type="submit" disabled={pending} className="mt-8 h-12 rounded-none px-7 text-base">
        {pending ? t("sending") : t("submit")}
      </Button>
    </form>
  );
}
