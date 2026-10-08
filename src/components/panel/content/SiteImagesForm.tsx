"use client";
import { useRef, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { setSiteImage, clearSiteImage } from "@/actions/site-images";
import { SITE_IMAGE_SLOTS, SITE_IMAGE_SLOT_LIST, checkSiteImageSize, type SiteImageSlot } from "@/schemas/site-image";
import type { SiteImages } from "@/lib/queries/content";
import { publicUrl } from "@/lib/storage-public";
import { readImageDimensions } from "@/lib/read-image-dimensions";
import { MAX_UPLOAD_BYTES } from "@/lib/upload-limits";
import { useActionError } from "@/lib/use-action-error";
import { DeleteButton } from "../DeleteButton";

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
/** Yuva boşken gösterilen kurulum dosyası. */
const FALLBACK: Record<SiteImageSlot, string> = { hero: "/landing/hero.jpg", heroMobile: "/landing/hero-mobile.jpg", about: "/landing/about.jpg" };

/**
 * Üç yuva: önizleme, istenen oran ve en küçük genişlik, "Fotoğraf seç" ve
 * doluysa "Varsayılana dön". Yükleme galeriyle aynı yol: boyut istemcide
 * okunur, presign (`site`) ile depoya `PUT`, sonra `setSiteImage`.
 */
export function SiteImagesForm({ images }: { images: SiteImages }) {
  const t = useTranslations("panel.content.images");
  const tUpload = useTranslations("panel.upload");
  const showError = useActionError();
  const router = useRouter();
  const [busy, setBusy] = useState<SiteImageSlot | null>(null);
  const inputs = useRef<Partial<Record<SiteImageSlot, HTMLInputElement | null>>>({});

  async function upload(slot: SiteImageSlot, file: File) {
    if (!ACCEPTED.includes(file.type)) { toast.error(tUpload("onlyImages")); return; }
    if (file.size > MAX_UPLOAD_BYTES) { toast.error(tUpload("tooLarge")); return; }
    setBusy(slot);
    try {
      const { width, height } = await readImageDimensions(file).catch(() => { throw new Error(t("unreadable")); });
      // Boyut ve oran ağa çıkmadan denetlenir; sunucu aynı kuralı yeniden uygular.
      const problem = checkSiteImageSize(slot, width, height);
      if (problem) { toast.error(showError({ error: problem })); return; }
      const res = await fetch("/api/upload/presign", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ kind: "site", contentType: file.type, contentLength: file.size }) });
      if (!res.ok) throw new Error(tUpload("failed"));
      const { url, key } = await res.json();
      const put = await fetch(url, { method: "PUT", headers: { "content-type": file.type }, body: file });
      if (!put.ok) throw new Error(tUpload("failed"));
      const r = await setSiteImage({ slot, storageKey: key, width, height });
      if (!r.ok) { toast.error(showError(r)); return; }
      toast.success(t("saved"));
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : tUpload("failed"));
    } finally {
      setBusy(null);
      const input = inputs.current[slot];
      if (input) input.value = "";
    }
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-3">
      {SITE_IMAGE_SLOT_LIST.map((slot) => {
        const spec = SITE_IMAGE_SLOTS[slot];
        const current = images[slot];
        const src = current ? publicUrl(current.storageKey) : FALLBACK[slot];
        const tall = slot === "heroMobile";
        return (
          <li key={slot} className="grid gap-3 rounded-[var(--radius)] border border-border p-4">
            <div className={tall ? "relative aspect-[4/5] w-full overflow-hidden rounded-[var(--radius)] bg-muted" : "relative aspect-[3/2] w-full overflow-hidden rounded-[var(--radius)] bg-muted"}>
              <Image src={src} alt="" fill sizes="(min-width: 640px) 30vw, 90vw" className="object-cover" />
            </div>
            <div>
              <p className="font-medium">{t(slot)}</p>
              <p className="text-sm text-muted-foreground">{t("requirement", { label: spec.label, minWidth: spec.minWidth })}</p>
              <p className="text-sm text-muted-foreground">{current ? t("current") : t("fallback")}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={(el) => { inputs.current[slot] = el; }}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                tabIndex={-1}
                aria-label={t(slot)}
                disabled={busy !== null}
                onChange={(e) => e.target.files?.[0] && upload(slot, e.target.files[0])}
              />
              <Button size="sm" variant="outline" disabled={busy !== null} onClick={() => inputs.current[slot]?.click()}>
                {busy === slot ? tUpload("uploading") : t("upload")}
              </Button>
              {current && (
                <DeleteButton
                  title={t("resetTitle")}
                  description={t("resetDescription")}
                  confirmLabel={t("reset")}
                  triggerLabel={t("reset")}
                  onConfirm={() => clearSiteImage(slot)}
                  successMessage={t("cleared")}
                />
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
