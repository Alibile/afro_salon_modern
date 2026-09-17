"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerAction, type LoginState } from "@/actions/auth";

export function RegisterForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(registerAction, {});
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next ?? ""} />
      <label className="block">
        <span className="text-sm font-medium">Ad Soyad</span>
        <input name="name" required className="mt-1 w-full rounded-lg border px-3 py-2" />
      </label>
      <label className="block">
        <span className="text-sm font-medium">E-posta</span>
        <input name="email" type="email" required className="mt-1 w-full rounded-lg border px-3 py-2" />
      </label>
      <label className="block">
        <span className="text-sm font-medium">Telefon (isteğe bağlı)</span>
        <input name="phone" type="tel" className="mt-1 w-full rounded-lg border px-3 py-2" />
      </label>
      <label className="block">
        <span className="text-sm font-medium">Şifre</span>
        <input name="password" type="password" required minLength={8} className="mt-1 w-full rounded-lg border px-3 py-2" />
      </label>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button disabled={pending} className="w-full rounded-lg bg-black px-4 py-2 text-white disabled:opacity-50">
        {pending ? "Kaydediliyor…" : "Kayıt ol"}
      </button>
      <p className="text-center text-sm">
        Zaten hesabın var mı? <Link href={`/giris${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="underline">Giriş yap</Link>
      </p>
    </form>
  );
}
