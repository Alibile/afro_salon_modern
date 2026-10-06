"use client";
import Image from "next/image";
import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { publicUrl } from "@/lib/storage-public";
import { formatShopDate } from "@/lib/time";
import { deleteHaircutPhoto } from "@/actions/photos";
import { useActionError } from "@/lib/use-action-error";
import type { AppLocale } from "@/i18n/routing";

type P = { id: string; storageKey: string; createdAt: Date; barberName: string; barberId: string };

export function PhotoGrid({ photos, deletableIds }: { photos: P[]; deletableIds: string[] }) {
  const t = useTranslations("panel");
  const locale = useLocale() as AppLocale;
  const showError = useActionError();
  const [pending, start] = useTransition();
  const router = useRouter();
  if (photos.length === 0) return <p className="text-sm text-muted-foreground">{t("customers.noPhotos")}</p>;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {photos.map((p) => (
        <figure key={p.id} className="space-y-1">
          <Image src={publicUrl(p.storageKey)} alt="" width={300} height={300} className="aspect-square w-full rounded-[var(--radius)] object-cover" />
          <figcaption className="flex items-start justify-between gap-2 text-xs text-muted-foreground">
            <span>
              <span className="block">{formatShopDate(p.createdAt, locale)}</span>
              <span className="block">{p.barberName}</span>
            </span>
            {deletableIds.includes(p.id) && (
              <Button size="sm" variant="ghost" disabled={pending} onClick={() => start(async () => {
                const r = await deleteHaircutPhoto(p.id);
                if (r.ok) router.refresh(); else toast.error(showError(r));
              })}>{t("common.delete")}</Button>
            )}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
