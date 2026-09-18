import { getLandingData, DAY_LABELS } from "@/lib/queries/landing";
import { getSessionUser } from "@/lib/auth-helpers";
import { shopDayOfWeek } from "@/lib/time";
import { MotionProvider } from "@/components/motion/MotionProvider";
import { SiteNav } from "@/components/landing/SiteNav";
import { Hero } from "@/components/landing/Hero";
import { AboutSection } from "@/components/landing/AboutSection";
import { ServicesSection } from "@/components/landing/ServicesSection";
import { WhyUsSection } from "@/components/landing/WhyUsSection";
import { TeamSection } from "@/components/landing/TeamSection";
import { GallerySection } from "@/components/landing/GallerySection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { ContactSection } from "@/components/landing/ContactSection";
import { SiteFooter } from "@/components/landing/SiteFooter";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const now = new Date();
  const [{ settings, status, services, barbers, gallery, testimonials, weeklyHours }, user] = await Promise.all([
    getLandingData(now),
    getSessionUser(),
  ]);
  const social = { instagram: settings.instagram, facebook: settings.facebook, whatsapp: settings.whatsapp };
  return (
    // Hareket yalnızca ana sayfa ağacında: panel ve randevu akışı hareketsiz kalır.
    <MotionProvider>
      <SiteNav shopName={settings.shopName} user={user} />
      <Hero status={status} />
      <AboutSection title={settings.aboutTitle} text={settings.aboutText} />
      <ServicesSection
        services={services.map((s) => ({ id: s.id, name: s.name, durationMinutes: s.durationMinutes, priceKurus: s.priceKurus }))}
        phone={settings.phone}
      />
      <WhyUsSection
        items={[
          { title: settings.whyUs1Title, text: settings.whyUs1Text },
          { title: settings.whyUs2Title, text: settings.whyUs2Text },
          { title: settings.whyUs3Title, text: settings.whyUs3Text },
        ]}
        satisfactionPercent={settings.satisfactionPercent}
        yearsExperience={settings.yearsExperience}
      />
      <TeamSection barbers={barbers.map((b) => ({ id: b.id, name: b.name, bio: b.bio, photoKey: b.photoKey }))} />
      <GallerySection photos={gallery.photos} tags={gallery.tags} />
      <TestimonialsSection items={testimonials} />
      <ContactSection
        address={settings.address}
        phone={settings.phone}
        email={settings.email}
        whatsapp={settings.whatsapp}
        mapsUrl={settings.mapsUrl}
        weeklyHours={weeklyHours}
        todayLabel={DAY_LABELS[shopDayOfWeek(now)]}
        services={services.map((s) => s.name)}
      />
      <SiteFooter
        shopName={settings.shopName}
        user={user}
        social={social}
        address={settings.address}
        phone={settings.phone}
        email={settings.email}
        statusText={status.text}
      />
    </MotionProvider>
  );
}
