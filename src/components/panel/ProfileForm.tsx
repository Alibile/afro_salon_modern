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
import { updateOwnProfile } from "@/actions/profile";
import { useActionError } from "@/lib/use-action-error";
import { readI18nField, type I18nText } from "@/lib/i18n-content";

type Profile = { name: string; phone: string; bioI18n?: I18nText; photoKey?: string };

export function ProfileForm({ profile, hasBarber }: { profile: Profile; hasBarber: boolean }) {
  const t = useTranslations("panel");
  const showError = useActionError();
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
            ? { name: String(fd.get("name")), phone: String(fd.get("phone")), bio: readI18nField(fd, "bio"), photoKey: String(fd.get("photoKey")) }
            : { name: String(fd.get("name")), phone: String(fd.get("phone")) };
          const r = await updateOwnProfile(input);
          if (!r.ok) { setError(showError(r)); return; }
          setError(null);
          toast.success(t("profile.saved"));
          router.refresh();
        });
      }}
    >
      <div><Label htmlFor="name">{t("profile.name")}</Label><Input id="name" name="name" defaultValue={profile.name} required /></div>
      <div><Label htmlFor="phone">{t("profile.phone")}</Label><Input id="phone" name="phone" defaultValue={profile.phone} maxLength={20} /></div>
      {hasBarber && (
        <>
          <div className="sm:col-span-2">
            <I18nTextarea name="bio" label={t("profile.bio")} defaultValue={profile.bioI18n} maxLength={200} />
            <p className="mt-1 text-xs text-muted-foreground">{t("i18nField.hint")}</p>
          </div>
          <div className="sm:col-span-2">
            <Label>{t("profile.photo")}</Label>
            <ImageUploader kind="barber" name="photoKey" defaultKey={profile.photoKey} />
          </div>
        </>
      )}
      {error && <p className="text-sm text-destructive sm:col-span-2">{error}</p>}
      <Button type="submit" disabled={pending} className="sm:col-span-2">{t("common.save")}</Button>
    </form>
  );
}
