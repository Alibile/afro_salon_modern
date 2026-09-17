import { getActiveBarbers, getActiveServices } from "@/lib/queries/booking";
import { getSettings } from "@/lib/settings";
import { getSessionUser } from "@/lib/auth-helpers";
import { BookingWizard } from "@/components/booking/BookingWizard";

export const dynamic = "force-dynamic";

export default async function HomePage(props: { searchParams: Promise<{ s?: string; b?: string; t?: string }> }) {
  const sp = await props.searchParams;
  const [services, barbers, settings, user] = await Promise.all([getActiveServices(), getActiveBarbers(), getSettings(), getSessionUser()]);
  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-4xl text-primary">Bugün için randevu al</h1>
        <p className="text-muted-foreground">{settings.address} · {settings.phone}</p>
      </section>
      <BookingWizard
        services={services.map((s) => ({ id: s.id, name: s.name, durationMinutes: s.durationMinutes, priceKurus: s.priceKurus }))}
        barbers={barbers}
        isLoggedIn={!!user}
        initial={{ serviceIds: sp.s ? sp.s.split(",") : [], barberId: sp.b ?? null, startsAt: sp.t ?? null }}
      />
    </div>
  );
}
