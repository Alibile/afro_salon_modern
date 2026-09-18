"use client";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changeOwnPassword } from "@/actions/profile";
import { useActionError } from "@/lib/use-action-error";

export function PasswordForm() {
  const t = useTranslations("panel");
  const showError = useActionError();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="grid gap-3 sm:max-w-sm"
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
      <div><Label htmlFor="currentPassword">{t("profile.currentPassword")}</Label><Input id="currentPassword" name="currentPassword" type="password" required /></div>
      <div><Label htmlFor="newPassword">{t("profile.newPassword")}</Label><Input id="newPassword" name="newPassword" type="password" minLength={8} required /></div>
      <div><Label htmlFor="confirmPassword">{t("profile.confirmPassword")}</Label><Input id="confirmPassword" name="confirmPassword" type="password" minLength={8} required /></div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={pending}>{t("profile.changePassword")}</Button>
    </form>
  );
}
