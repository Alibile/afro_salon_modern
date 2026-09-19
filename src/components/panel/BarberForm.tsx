"use client";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageUploader } from "./ImageUploader";
import { I18nTextarea } from "./I18nField";
import { createBarber, updateBarber, resetBarberPassword } from "@/actions/barbers";
import { useActionError } from "@/lib/use-action-error";
import { readI18nField, type I18nText } from "@/lib/i18n-content";

type Barber = { id: string; name: string; email: string; bioI18n: I18nText; photoKey: string; isActive: boolean };

export function BarberForm(props: { mode: "create" } | { mode: "edit"; barber: Barber }) {
  const t = useTranslations("panel");
  const showError = useActionError();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const barber = props.mode === "edit" ? props.barber : null;

  return (
    <form
      className="grid gap-3 sm:grid-cols-2"
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
          if (barber) router.refresh(); else router.push(`/panel/berberler/${(r.data as { barberId: string }).barberId}`);
        });
      }}
    >
      <div><Label htmlFor="name">{t("barbers.name")}</Label><Input id="name" name="name" defaultValue={barber?.name} required /></div>
      {!barber && <div><Label htmlFor="email">{t("barbers.email")}</Label><Input id="email" name="email" type="email" required /></div>}
      {!barber && <div><Label htmlFor="password">{t("barbers.tempPassword")}</Label><Input id="password" name="password" type="text" minLength={8} required /></div>}
      <div className="sm:col-span-2">
        <I18nTextarea name="bio" label={t("barbers.bio")} defaultValue={barber?.bioI18n} maxLength={200} />
        <p className="mt-1 text-xs text-muted-foreground">{t("i18nField.hint")}</p>
      </div>
      <div className="sm:col-span-2">
        <Label>{t("barbers.photo")}</Label>
        <ImageUploader kind="barber" name="photoKey" defaultKey={barber?.photoKey} />
      </div>
      {barber && (
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isActive" defaultChecked={barber.isActive} /> {t("barbers.active")}</label>
      )}
      {error && <p className="text-sm text-destructive sm:col-span-2">{error}</p>}
      <Button type="submit" disabled={pending} className="sm:col-span-2">{barber ? t("common.save") : t("barbers.submit")}</Button>
      {barber && (
        <Button type="button" variant="outline" className="sm:col-span-2"
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
    </form>
  );
}
