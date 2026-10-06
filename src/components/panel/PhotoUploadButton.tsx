"use client";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { ImageUploader } from "./ImageUploader";
import { addHaircutPhoto } from "@/actions/photos";
import { useActionError } from "@/lib/use-action-error";

export function PhotoUploadButton({ customerId, barbers }: { customerId: string; barbers: { id: string; name: string }[] | null }) {
  const t = useTranslations("panel");
  const showError = useActionError();
  const [open, setOpen] = useState(false);
  const [barberId, setBarberId] = useState(barbers?.[0]?.id);
  const [pending, start] = useTransition();
  const router = useRouter();
  if (!open) return <Button size="sm" onClick={() => setOpen(true)}>{t("customers.addPhoto")}</Button>;
  return (
    <div className="w-full space-y-3 rounded-[var(--radius)] border border-border p-3 sm:max-w-sm">
      {barbers && (
        <Select value={barberId} onChange={(e) => setBarberId(e.target.value)}>
          {barbers.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </Select>
      )}
      <ImageUploader kind="haircut" name="storageKey" onUploaded={(key) => start(async () => {
        const r = await addHaircutPhoto({ customerId, storageKey: key, barberId });
        if (!r.ok) { toast.error(showError(r)); return; }
        toast.success(r.data.deletedKeys.length ? t("customers.photoAddedOldestRemoved") : t("customers.photoAdded"));
        setOpen(false);
        router.refresh();
      })} />
      {pending && <p className="text-sm text-muted-foreground">{t("common.saving")}</p>}
    </div>
  );
}
