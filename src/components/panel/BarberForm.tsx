"use client";
import { useState, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUploader } from "./ImageUploader";
import { createBarber, updateBarber, resetBarberPassword } from "@/actions/barbers";

type Barber = { id: string; name: string; email: string; bio: string; photoKey: string; isActive: boolean };

export function BarberForm(props: { mode: "create" } | { mode: "edit"; barber: Barber }) {
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
            ? await updateBarber(barber.id, { name: String(fd.get("name")), bio: String(fd.get("bio")), photoKey: String(fd.get("photoKey")), isActive: fd.get("isActive") === "on" })
            : await createBarber({ name: String(fd.get("name")), email: String(fd.get("email")), password: String(fd.get("password")), bio: String(fd.get("bio")), photoKey: String(fd.get("photoKey")) });
          if (!r.ok) { setError(r.error); return; }
          setError(null);
          toast.success(barber ? "Berber güncellendi" : "Berber eklendi");
          if (barber) router.refresh(); else router.push(`/panel/berberler/${(r.data as { barberId: string }).barberId}`);
        });
      }}
    >
      <div><Label htmlFor="name">Ad Soyad</Label><Input id="name" name="name" defaultValue={barber?.name} required /></div>
      {!barber && <div><Label htmlFor="email">E-posta</Label><Input id="email" name="email" type="email" required /></div>}
      {!barber && <div><Label htmlFor="password">Geçici şifre</Label><Input id="password" name="password" type="text" minLength={8} required /></div>}
      <div className="sm:col-span-2"><Label htmlFor="bio">Kısa tanıtım</Label><Textarea id="bio" name="bio" defaultValue={barber?.bio} maxLength={200} /></div>
      <div className="sm:col-span-2">
        <Label>Profil fotoğrafı (zorunlu)</Label>
        <ImageUploader kind="barber" name="photoKey" defaultKey={barber?.photoKey} />
      </div>
      {barber && (
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isActive" defaultChecked={barber.isActive} /> Aktif (müşteriler seçebilir)</label>
      )}
      {error && <p className="text-sm text-destructive sm:col-span-2">{error}</p>}
      <Button type="submit" disabled={pending} className="sm:col-span-2">{barber ? "Kaydet" : "Berber ekle"}</Button>
      {barber && (
        <Button type="button" variant="outline" className="sm:col-span-2"
          onClick={() => {
            const pw = window.prompt("Yeni şifre (en az 8 karakter):");
            if (!pw) return;
            start(async () => {
              const r = await resetBarberPassword(barber.id, pw);
              if (r.ok) toast.success("Şifre güncellendi"); else toast.error(r.error);
            });
          }}>
          Şifreyi sıfırla
        </Button>
      )}
    </form>
  );
}
