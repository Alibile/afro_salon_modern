"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction, type LoginState } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(loginAction, {});
  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="next" value={next ?? ""} />
      <div className="space-y-1.5">
        <Label htmlFor="email">E-posta</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" className="h-11 rounded-none" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Şifre</Label>
        <Input id="password" name="password" type="password" required autoComplete="current-password" className="h-11 rounded-none" />
      </div>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending} className="h-11 w-full rounded-none text-base">
        {pending ? "Giriş yapılıyor…" : "Giriş yap"}
      </Button>
      <p className="text-sm text-muted-foreground">
        Hesabın yok mu? <Link href={`/kayit${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="text-foreground underline underline-offset-4">Kayıt ol</Link>
      </p>
    </form>
  );
}
