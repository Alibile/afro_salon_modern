"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { registerAction, type LoginState } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useActionError } from "@/lib/use-action-error";

export function RegisterForm({ next }: { next?: string }) {
  const t = useTranslations("auth");
  const showError = useActionError();
  const [state, action, pending] = useActionState<LoginState, FormData>(registerAction, {});
  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="next" value={next ?? ""} />
      <div className="space-y-1.5">
        <Label htmlFor="name">{t("fields.name")}</Label>
        <Input id="name" name="name" required className="h-11 rounded-none" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="email">{t("fields.email")}</Label>
        <Input id="email" name="email" type="email" required className="h-11 rounded-none" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="phone">{t("fields.phone")}</Label>
        <Input id="phone" name="phone" type="tel" className="h-11 rounded-none" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">{t("fields.password")}</Label>
        <Input id="password" name="password" type="password" required minLength={8} className="h-11 rounded-none" />
      </div>
      {state.error && <p className="text-sm text-destructive">{showError({ error: state.error })}</p>}
      <Button type="submit" disabled={pending} className="h-11 w-full rounded-none text-base">
        {pending ? t("register.submitting") : t("register.submit")}
      </Button>
      <p className="text-sm text-muted-foreground">
        {t("register.haveAccount")}{" "}
        <Link href={`/giris${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="text-foreground underline underline-offset-4">
          {t("register.login")}
        </Link>
      </p>
    </form>
  );
}
