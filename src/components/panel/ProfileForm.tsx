"use client";
import { useState, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUploader } from "./ImageUploader";
import { updateOwnProfile } from "@/actions/profile";

type Profile = { name: string; phone: string; bio?: string; photoKey?: string };

export function ProfileForm({ profile, hasBarber }: { profile: Profile; hasBarber: boolean }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  return (
    <form
      className="grid gap-3 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        start(async () => {
          const input = hasBarber
            ? { name: String(fd.get("name")), phone: String(fd.get("phone")), bio: String(fd.get("bio")), photoKey: String(fd.get("photoKey")) }
            : { name: String(fd.get("name")), phone: String(fd.get("phone")) };
          const r = await updateOwnProfile(input);
          if (!r.ok) { setError(r.error); return; }
          setError(null);
          toast.success("Profil güncellendi");
          router.refresh();
        });
      }}
    >
      <div><Label htmlFor="name">Ad Soyad</Label><Input id="name" name="name" defaultValue={profile.name} required /></div>
      <div><Label htmlFor="phone">Telefon</Label><Input id="phone" name="phone" defaultValue={profile.phone} maxLength={20} /></div>
      {hasBarber && (
        <>
          <div className="sm:col-span-2"><Label htmlFor="bio">Kısa tanıtım</Label><Textarea id="bio" name="bio" defaultValue={profile.bio} maxLength={200} /></div>
          <div className="sm:col-span-2">
            <Label>Profil fotoğrafı (zorunlu)</Label>
            <ImageUploader kind="barber" name="photoKey" defaultKey={profile.photoKey} />
          </div>
        </>
      )}
      {error && <p className="text-sm text-destructive sm:col-span-2">{error}</p>}
      <Button type="submit" disabled={pending} className="sm:col-span-2">Kaydet</Button>
    </form>
  );
}
