"use client";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { changeOwnPassword } from "@/actions/profile";
import { useActionError } from "@/lib/use-action-error";

export function PasswordForm() {
  const t = useTranslations("panel");
  const showError = useActionError();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="grid gap-4 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const fd = new FormData(form);
        const currentPassword = String(fd.get("currentPassword"));
        const newPassword = String(fd.get("newPassword"));
        const confirmPassword = String(fd.get("confirmPassword"));
        if (newPassword !== confirmPassword) { setError(t("profile.passwordMismatch")); return; }
        start(async () => {
          const r = await changeOwnPassword({ currentPassword, newPassword });
          if (!r.ok) { setError(showError(r)); return; }
          setError(null);
          toast.success(t("common.passwordUpdated"));
          form.reset();
        });
      }}
    >
      <Field id="currentPassword" label={t("profile.currentPassword")} className="sm:col-span-2"><Input id="currentPassword" name="currentPassword" type="password" autoComplete="current-password" required /></Field>
      <Field id="newPassword" label={t("profile.newPassword")}><Input id="newPassword" name="newPassword" type="password" autoComplete="new-password" minLength={8} required /></Field>
      <Field id="confirmPassword" label={t("profile.confirmPassword")}><Input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" minLength={8} required /></Field>
      {error && <p className="text-sm text-destructive sm:col-span-2">{error}</p>}
      <div className="flex justify-end sm:col-span-2">
        <Button type="submit" variant="outline" disabled={pending}>{t("profile.changePassword")}</Button>
      </div>
    </form>
  );
}
