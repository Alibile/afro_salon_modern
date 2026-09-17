"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction, type LoginState } from "@/actions/auth";

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(loginAction, {});
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next ?? ""} />
      <label className="block">
        <span className="text-sm font-medium">E-posta</span>
        <input name="email" type="email" required autoComplete="email" className="mt-1 w-full rounded-lg border px-3 py-2" />
      </label>
      <label className="block">
        <span className="text-sm font-medium">Şifre</span>
        <input name="password" type="password" required autoComplete="current-password" className="mt-1 w-full rounded-lg border px-3 py-2" />
      </label>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button disabled={pending} className="w-full rounded-lg bg-black px-4 py-2 text-white disabled:opacity-50">
        {pending ? "Giriş yapılıyor…" : "Giriş yap"}
      </button>
      <p className="text-center text-sm">
        Hesabın yok mu? <Link href={`/kayit${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="underline">Kayıt ol</Link>
      </p>
    </form>
  );
}
