import { getLandingData, DAY_LABELS } from "@/lib/queries/landing";
import { shopDayOfWeek } from "@/lib/time";
import { Hero } from "@/components/landing/Hero";
import { ServicesSection } from "@/components/landing/ServicesSection";
import { TeamSection } from "@/components/landing/TeamSection";
import { GallerySection } from "@/components/landing/GallerySection";
import { ContactSection } from "@/components/landing/ContactSection";
import { SiteFooter } from "@/components/landing/SiteFooter";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const now = new Date();
  const { settings, status, services, barbers, gallery, weeklyHours } = await getLandingData(now);
  return (
    <>
      <Hero status={status} address={settings.address} phone={settings.phone} />
      <ServicesSection
        services={services.map((s) => ({ id: s.id, name: s.name, durationMinutes: s.durationMinutes, priceKurus: s.priceKurus }))}
        phone={settings.phone}
      />
      <TeamSection barbers={barbers.map((b) => ({ id: b.id, name: b.name, bio: b.bio, photoKey: b.photoKey }))} />
      <GallerySection photos={gallery} />
      <ContactSection
        address={settings.address}
        phone={settings.phone}
        weeklyHours={weeklyHours}
        todayLabel={DAY_LABELS[shopDayOfWeek(now)]}
      />
      <SiteFooter shopName={settings.shopName} />
    </>
  );
}
