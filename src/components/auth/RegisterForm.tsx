"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerAction, type LoginState } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function RegisterForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(registerAction, {});
  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="next" value={next ?? ""} />
      <div className="space-y-1.5">
        <Label htmlFor="name">Ad Soyad</Label>
        <Input id="name" name="name" required className="h-11 rounded-none" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="email">E-posta</Label>
        <Input id="email" name="email" type="email" required className="h-11 rounded-none" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="phone">Telefon (isteğe bağlı)</Label>
        <Input id="phone" name="phone" type="tel" className="h-11 rounded-none" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Şifre</Label>
        <Input id="password" name="password" type="password" required minLength={8} className="h-11 rounded-none" />
      </div>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending} className="h-11 w-full rounded-none text-base">
        {pending ? "Kaydediliyor…" : "Kayıt ol"}
      </Button>
      <p className="text-sm text-muted-foreground">
        Zaten hesabın var mı? <Link href={`/giris${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="text-foreground underline underline-offset-4">Giriş yap</Link>
      </p>
    </form>
  );
}
