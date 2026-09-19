import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { toAppLocale } from "@/i18n/routing";
import { pageAlternates } from "@/lib/seo";
import { getActiveBarbers, getActiveServices } from "@/lib/queries/booking";
import { getTodayShopStatus } from "@/lib/queries/landing";
import { getSettings } from "@/lib/settings";
import { getSessionUser } from "@/lib/auth-helpers";
import { BookingWizard } from "@/components/booking/BookingWizard";
import { shopStatusText } from "@/lib/shop-status";

export const dynamic = "force-dynamic";

/**
 * Randevu sayfası kendi başlığını, açıklamasını ve kendi dil bağlantılarını
 * taşır: yerleşimden gelen `alternates` ana sayfayı gösterirdi, oysa
 * `/randevu`nun İngilizcesi `/en/randevu`dur.
 */
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = toAppLocale((await params).locale);
  const t = await getTranslations("meta.booking");
  return { title: t("title"), description: t("description"), alternates: pageAlternates("/randevu", locale) };
}

export default async function RandevuPage(props: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ s?: string; b?: string; t?: string; gun?: string }>;
}) {
  const [sp, { locale }] = await Promise.all([props.searchParams, props.params]);
  const [services, barbers, settings, user, status, t, tStatus] = await Promise.all([
    getActiveServices(locale),
    getActiveBarbers(locale),
    getSettings(),
    getSessionUser(),
    getTodayShopStatus(),
    getTranslations("booking"),
    getTranslations("common.status"),
  ]);
  return (
    <div className="mx-auto w-full max-w-lg px-4 pb-24 pt-8">
      <section className="border-b border-border pb-6">
        <h1 className="display-lg">{t("title")}</h1>
        <p className="mt-3 text-sm text-muted-foreground">{shopStatusText(tStatus, status)}</p>
        <p className="editorial-note mt-1 text-sm text-muted-foreground">{settings.address}</p>
      </section>
      <div className="pt-8">
        <BookingWizard
          services={services.map((s) => ({ id: s.id, name: s.name, durationMinutes: s.durationMinutes, priceKurus: s.priceKurus }))}
          barbers={barbers}
          isLoggedIn={!!user}
          initial={{ serviceIds: sp.s ? sp.s.split(",") : [], barberId: sp.b ?? null, startsAt: sp.t ?? null, day: sp.gun ?? null }}
        />
      </div>
    </div>
  );
}
