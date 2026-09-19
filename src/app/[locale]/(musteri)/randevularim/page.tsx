import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requireUser } from "@/lib/auth-helpers";
import { getCustomerAppointments, getCustomerPhotos } from "@/lib/queries/customer";
import { getSettings } from "@/lib/settings";
import { AppointmentCard } from "@/components/booking/AppointmentCard";
import { publicUrl } from "@/lib/storage-public";
import { formatShopDate } from "@/lib/time";
import { noIndex } from "@/lib/seo";

/**
 * Müşterinin kendi randevuları: oturum ardında, dizine girmez.
 */
export const metadata = noIndex;

export const dynamic = "force-dynamic";

export default async function RandevularimPage() {
  const user = await requireUser("/randevularim");
  const [{ today, past }, photos, settings, t, locale] = await Promise.all([
    getCustomerAppointments(user.id),
    getCustomerPhotos(user.id),
    getSettings(),
    getTranslations("account"),
    getLocale(),
  ]);
  return (
    <div className="mx-auto w-full max-w-lg space-y-12 px-4 pb-24 pt-8">
      <section>
        <h1 className="display-lg border-b border-border pb-4">{t("todayTitle")}</h1>
        <div className="mt-6">
          {today.length === 0 ? (
            <p className="text-muted-foreground">
              {t("noToday")}{" "}
              <Link href="/randevu" className="text-foreground underline underline-offset-4">
                {t("bookToday")}
              </Link>
              .
            </p>
          ) : (
            today.map((a) => <AppointmentCard key={a.id} a={a} shopPhone={settings.phone} big />)
          )}
        </div>
      </section>
      {photos.length > 0 && (
        <section>
          <h2 className="display-md border-b border-border pb-3">{t("photosTitle")}</h2>
          <div className="mt-5 grid grid-cols-2 gap-3">
            {photos.map((p) => (
              <figure key={p.id}>
                <Image src={publicUrl(p.storageKey)} alt={t("photoAlt", { date: formatShopDate(p.createdAt, locale) })} width={300} height={300} className="aspect-square w-full object-cover" />
                <figcaption className="editorial-note mt-2 text-xs text-muted-foreground">
                  {formatShopDate(p.createdAt, locale)}, {p.barberName}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}
      <section>
        <h2 className="display-md border-b border-border pb-3">{t("pastTitle")}</h2>
        <div className="mt-5">
          {past.length === 0 ? (
            <p className="text-muted-foreground">{t("noPast")}</p>
          ) : (
            <div className="space-y-3">{past.map((a) => <AppointmentCard key={a.id} a={a} shopPhone={settings.phone} />)}</div>
          )}
        </div>
      </section>
    </div>
  );
}
