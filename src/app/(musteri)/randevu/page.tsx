import { getActiveBarbers, getActiveServices } from "@/lib/queries/booking";
import { getTodayShopStatus } from "@/lib/queries/landing";
import { getSettings } from "@/lib/settings";
import { getSessionUser } from "@/lib/auth-helpers";
import { BookingWizard } from "@/components/booking/BookingWizard";

export const dynamic = "force-dynamic";

export default async function RandevuPage(props: { searchParams: Promise<{ s?: string; b?: string; t?: string }> }) {
  const sp = await props.searchParams;
  const [services, barbers, settings, user, status] = await Promise.all([
    getActiveServices(),
    getActiveBarbers(),
    getSettings(),
    getSessionUser(),
    getTodayShopStatus(),
  ]);
  return (
    <div className="mx-auto w-full max-w-lg px-4 pb-24 pt-8">
      <section className="border-b border-border pb-6">
        <h1 className="display-lg">BUGÜN İÇİN RANDEVU AL</h1>
        <p className="mt-3 text-sm text-muted-foreground">{status.text}</p>
        <p className="editorial-note mt-1 text-sm text-muted-foreground">{settings.address}</p>
      </section>
      <div className="pt-8">
        <BookingWizard
          services={services.map((s) => ({ id: s.id, name: s.name, durationMinutes: s.durationMinutes, priceKurus: s.priceKurus }))}
          barbers={barbers}
          isLoggedIn={!!user}
          initial={{ serviceIds: sp.s ? sp.s.split(",") : [], barberId: sp.b ?? null, startsAt: sp.t ?? null }}
        />
      </div>
    </div>
  );
}
