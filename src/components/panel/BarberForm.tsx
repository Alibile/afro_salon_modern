"use client";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { ImageUploader } from "./ImageUploader";
import { I18nTextarea } from "./I18nField";
import { useNewRecordClose } from "./NewRecordPanel";
import { createBarber, updateBarber, resetBarberPassword } from "@/actions/barbers";
import { useActionError } from "@/lib/use-action-error";
import { readI18nField, type I18nText } from "@/lib/i18n-content";

type Barber = { id: string; name: string; email: string; bioI18n: I18nText; photoKey: string; isActive: boolean };

export function BarberForm(props: { mode: "create" } | { mode: "edit"; barber: Barber }) {
  const t = useTranslations("panel");
  const showError = useActionError();
  const closePanel = useNewRecordClose();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const barber = props.mode === "edit" ? props.barber : null;

  return (
    <form
      className="grid gap-4 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        start(async () => {
          const r = barber
            ? await updateBarber(barber.id, { name: String(fd.get("name")), bio: readI18nField(fd, "bio"), photoKey: String(fd.get("photoKey")), isActive: fd.get("isActive") === "on" })
            : await createBarber({ name: String(fd.get("name")), email: String(fd.get("email")), password: String(fd.get("password")), bio: readI18nField(fd, "bio"), photoKey: String(fd.get("photoKey")) });
          if (!r.ok) { setError(showError(r)); return; }
          setError(null);
          toast.success(barber ? t("barbers.updated") : t("barbers.added"));
          if (barber) router.refresh();
          else {
            closePanel();
            router.push(`/panel/berberler/${(r.data as { barberId: string }).barberId}`);
          }
        });
      }}
    >
      <Field id="name" label={t("barbers.name")} className={barber ? "sm:col-span-2" : undefined}>
        <Input id="name" name="name" defaultValue={barber?.name} required />
      </Field>
      {!barber && (
        <Field id="email" label={t("barbers.email")}>
          <Input id="email" name="email" type="email" required />
        </Field>
      )}
      {!barber && (
        <Field id="password" label={t("barbers.tempPassword")} className="sm:col-span-2">
          <Input id="password" name="password" type="text" minLength={8} required />
        </Field>
      )}
      <div className="sm:col-span-2">
        <I18nTextarea name="bio" label={t("barbers.bio")} defaultValue={barber?.bioI18n} maxLength={200} hint={t("i18nField.hint")} />
      </div>
      <Field id="photoKey-file" label={t("barbers.photo")} className="sm:col-span-2">
        <ImageUploader kind="barber" name="photoKey" defaultKey={barber?.photoKey} inputId="photoKey-file" />
      </Field>
      {barber && (
        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <input type="checkbox" name="isActive" defaultChecked={barber.isActive} className="size-4 accent-primary" /> {t("barbers.active")}
        </label>
      )}
      {error && <p className="text-sm text-destructive sm:col-span-2">{error}</p>}
      <div className="flex flex-wrap justify-end gap-2 sm:col-span-2">
        {barber && (
          <Button type="button" variant="outline"
            onClick={() => {
              const pw = window.prompt(t("barbers.newPasswordPrompt"));
              if (!pw) return;
              start(async () => {
                const r = await resetBarberPassword(barber.id, pw);
                if (r.ok) toast.success(t("common.passwordUpdated")); else toast.error(showError(r));
              });
            }}>
            {t("barbers.resetPassword")}
          </Button>
        )}
        <Button type="submit" disabled={pending}>{barber ? t("common.save") : t("barbers.submit")}</Button>
      </div>
    </form>
  );
}
