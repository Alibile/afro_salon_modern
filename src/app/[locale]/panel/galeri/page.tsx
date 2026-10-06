import { getTranslations } from "next-intl/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { getPanelGalleryPhotos } from "@/lib/queries/gallery";
import { GalleryUploader } from "@/components/panel/GalleryUploader";
import { GalleryCard } from "@/components/panel/GalleryCard";
import { PanelPage } from "@/components/panel/PanelPage";

export const dynamic = "force-dynamic";

export default async function GaleriPage() {
  await requireAdmin();
  const photos = await getPanelGalleryPhotos();
  const activeCount = photos.filter((p) => p.isActive).length;
  const t = await getTranslations("panel.gallery");

  return (
    <PanelPage title={t("title")} description={t("counts", { count: photos.length, active: activeCount })}>
      <section className="rounded-[var(--radius)] border border-border p-5">
        <h2 className="mb-3 text-base font-medium">{t("uploadTitle")}</h2>
        <GalleryUploader />
      </section>

      {photos.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {photos.map((p, i) => (
            <GalleryCard key={p.id} photo={p} index={i} total={photos.length} />
          ))}
        </ul>
      )}
    </PanelPage>
  );
}
