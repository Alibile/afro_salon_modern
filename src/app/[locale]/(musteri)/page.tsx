import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getLandingData } from "@/lib/queries/landing";
import { countOpenSlotsToday } from "@/lib/queries/today-slots";
import { getSessionUser } from "@/lib/auth-helpers";
import { preloadHero } from "@/lib/hero-image";
import { shopDayOfWeek } from "@/lib/time";
import { formatKurus } from "@/lib/money";
import { toAppLocale } from "@/i18n/routing";
import { MotionProvider } from "@/components/motion/MotionProvider";
import { SiteNav } from "@/components/landing/SiteNav";
import { Hero } from "@/components/landing/Hero";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { AboutSection } from "@/components/landing/AboutSection";
import { ServicesSection } from "@/components/landing/ServicesSection";
import { WhyUsSection } from "@/components/landing/WhyUsSection";
import { TeamSection } from "@/components/landing/TeamSection";
import { GallerySection } from "@/components/landing/GallerySection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { FaqSection, FAQ_KEYS, type FaqValues } from "@/components/landing/FaqSection";
import { ContactSection } from "@/components/landing/ContactSection";
import { SiteFooter } from "@/components/landing/SiteFooter";

export const dynamic = "force-dynamic";

/**
 * Ana sayfanın kendi başlığı ve açıklaması: kök yerleşimdeki genel site metni
 * arama sonucunda salonun ne yaptığını anlatmıyordu. Dil bağlantıları
 * (`alternates`) yerleşimden gelir — orada zaten `/`, `/en`, `/fr` yazılı.
 * Paylaşım görselini (`opengraph-image.tsx`) Next kendisi ekler.
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta.home");
  return { title: t("title"), description: t("description") };
}

export default async function LandingPage({ params }: { params: Promise<{ locale: string }> }) {
  // Veri beklenmeden önce: LCP fotoğrafının duyurusu `<head>`in en başına,
  // satır içi stil bloğundan da önce girer (bkz. `preloadHero`).
  preloadHero();
  const now = new Date();
  const { locale } = await params;
  const [{ settings, status, services, barbers, gallery, testimonials, weeklyHours }, openSlots, user] = await Promise.all([
    getLandingData(locale, now),
    countOpenSlotsToday(now),
    getSessionUser(),
  ]);
  const social = { instagram: settings.instagram, facebook: settings.facebook, whatsapp: settings.whatsapp };

  // SSS cevaplarındaki değişkenler: iptal penceresi ayarlardan, fiyat ve süre
  // ilk hizmetten (salon tek paketle çalışıyor), açılış–kapanış haftanın ilk
  // açık gününden. İkisinden biri yoksa bölüm hiç basılmaz — yarım cevap
  // yazmaktansa (henüz hizmeti ya da çalışma saati girilmemiş bir salonda)
  // susmak yeğdir; "45 dakika sürer" gibi bir cümle veriden kopuk kalırdı.
  const openDay = weeklyHours.find((d) => d.opensAt && d.closesAt);
  const faqValues: FaqValues | null =
    openDay && services.length > 0
      ? {
          minutes: settings.cancellationWindowMinutes,
          price: formatKurus(services[0].priceKurus, toAppLocale(locale)),
          duration: services[0].durationMinutes,
          open: openDay.opensAt!,
          close: openDay.closesAt!,
        }
      : null;
  const tFaq = faqValues ? await getTranslations("landing.faq") : null;
  // Arama sonucunda soru-cevap olarak görünmesi için aynı metinler yapısal
  // veriyle de duyurulur; kaynak bölümün kendisiyle aynı çeviri anahtarları.
  const faqJsonLd =
    tFaq && faqValues
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQ_KEYS.map((item) => ({
            "@type": "Question",
            name: tFaq(item.q),
            acceptedAnswer: { "@type": "Answer", text: tFaq(item.a, faqValues) },
          })),
        }
      : null;

  return (
    // Hareket yalnızca ana sayfa ağacında: panel ve randevu akışı hareketsiz kalır.
    <MotionProvider>
      <SiteNav shopName={settings.shopName} user={user} />
      <Hero status={status} slots={openSlots} />
      <HowItWorksSection cancellationWindowMinutes={settings.cancellationWindowMinutes} />
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
      {faqValues && <FaqSection values={faqValues} />}
      {faqJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      )}
      <ContactSection
        address={settings.address}
        phone={settings.phone}
        email={settings.email}
        whatsapp={settings.whatsapp}
        mapsUrl={settings.mapsUrl}
        weeklyHours={weeklyHours}
        todayDayOfWeek={shopDayOfWeek(now)}
        services={services.map((s) => s.name)}
      />
      <SiteFooter
        shopName={settings.shopName}
        user={user}
        social={social}
        address={settings.address}
        phone={settings.phone}
        email={settings.email}
        status={status}
      />
    </MotionProvider>
  );
}
