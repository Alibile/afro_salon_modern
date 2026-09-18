import { getTranslations } from "next-intl/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { getPanelGalleryPhotos } from "@/lib/queries/gallery";
import { GalleryUploader } from "@/components/panel/GalleryUploader";
import { GalleryCard } from "@/components/panel/GalleryCard";

export const dynamic = "force-dynamic";

export default async function GaleriPage() {
  await requireAdmin();
  const photos = await getPanelGalleryPhotos();
  const activeCount = photos.filter((p) => p.isActive).length;
  const t = await getTranslations("panel.gallery");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-3xl">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("counts", { count: photos.length, active: activeCount })}
        </p>
      </div>

      <section className="rounded-xl border bg-card p-4">
        <h2 className="mb-3 text-xl">{t("uploadTitle")}</h2>
        <GalleryUploader />
      </section>

      {photos.length === 0 ? (
        <p className="text-muted-foreground">{t("empty")}</p>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {photos.map((p, i) => (
            <GalleryCard key={p.id} photo={p} index={i} total={photos.length} />
          ))}
        </ul>
      )}
    </div>
  );
}
