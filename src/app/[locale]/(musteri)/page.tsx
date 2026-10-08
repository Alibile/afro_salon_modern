import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getLandingData } from "@/lib/queries/landing";
import { getContentMap, getSiteImages } from "@/lib/queries/content";
import { countOpenSlotsToday } from "@/lib/queries/today-slots";
import { getSessionUser } from "@/lib/auth-helpers";
import { preloadHero } from "@/lib/hero-image";
import { shopDayOfWeek } from "@/lib/time";
import { formatKurus } from "@/lib/money";
import { serializeJsonLd } from "@/lib/json-ld";
import { singlePackage } from "@/lib/package";
import { fillPlaceholders, siteText, type ContentMap } from "@/lib/content";
import { CONTENT_KEYS, type ContentKey } from "@/lib/content-keys";
import { faqPlaceholderValues, renderFaq } from "@/lib/faq";
import { toAppLocale } from "@/i18n/routing";
import { MotionProvider } from "@/components/motion/MotionProvider";
import { SiteNav } from "@/components/layout/SiteNav";
import { Hero } from "@/components/landing/Hero";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { AboutSection } from "@/components/landing/AboutSection";
import { ServicesSection } from "@/components/landing/ServicesSection";
import { WhyUsSection } from "@/components/landing/WhyUsSection";
import { TeamSection } from "@/components/landing/TeamSection";
import { GallerySection } from "@/components/landing/GallerySection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { FaqSection } from "@/components/landing/FaqSection";
import { ContactSection } from "@/components/landing/ContactSection";
import { SiteFooter } from "@/components/landing/SiteFooter";

export const dynamic = "force-dynamic";

/**
 * Metin okuyucu: panelden girilen içerik (ziyaretçinin dili → Türkçe) yoksa
 * çeviri dosyasındaki metin. Çevirmen `getTranslations()` köksüz kurulur ki
 * `CONTENT_KEYS` içindeki tam yollar (`landing.hero.headline1`) doğrudan
 * okunsun; `t.raw` ile **ham** metin alınır: yer tutucular (`{minutes}`)
 * panel metinleriyle aynı yoldan, `fillPlaceholders` ile doldurulur, ICU'ya
 * değer verilmediği için biçimlendirme hatası düşmez.
 */
function textReader(content: ContentMap, locale: string, t: (key: string) => string) {
  return (key: ContentKey) => siteText(content, key, locale, t(CONTENT_KEYS[key].message));
}

/**
 * Ana sayfanın kendi başlığı ve açıklaması panelden değiştirilebilir; dil
 * bağlantıları (`alternates`) yerleşimden gelir. Paylaşım görselini
 * (`opengraph-image.tsx`) Next kendisi ekler.
 */
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const [content, t] = await Promise.all([getContentMap(), getTranslations()]);
  const text = textReader(content, locale, (k) => String(t.raw(k as never)));
  return { title: text("meta.homeTitle"), description: text("meta.homeDescription") };
}

export default async function LandingPage({ params }: { params: Promise<{ locale: string }> }) {
  // Görsel yuvaları önce ve tek başına çekilir: LCP fotoğrafının duyurusu
  // geri kalan veri beklenmeden `<head>`e girer (bkz. `preloadHero`).
  const images = await getSiteImages();
  preloadHero(images);
  const now = new Date();
  const { locale } = await params;
  const [{ settings, status, services, barbers, gallery, testimonials, weeklyHours, content, faq }, openSlots, user, t] = await Promise.all([
    getLandingData(locale, now),
    countOpenSlotsToday(now),
    getSessionUser(),
    getTranslations(),
  ]);
  const text = textReader(content, locale, (k) => String(t.raw(k as never)));
  const social = { instagram: settings.instagram, facebook: settings.facebook, whatsapp: settings.whatsapp };

  // SSS cevaplarındaki yer tutucular: iptal penceresi ayarlardan, açılış ve
  // kapanış haftanın ilk açık gününden, fiyat ve süre paketten. Paket yoksa
  // fiyat/süre boş basılır; yönetici o soruyu panelden pasife alır.
  const openDay = weeklyHours.find((d) => d.opensAt && d.closesAt);
  const pkg = singlePackage(services);
  const faqValues = faqPlaceholderValues({
    minutes: settings.cancellationWindowMinutes,
    open: openDay?.opensAt ?? null,
    close: openDay?.closesAt ?? null,
    package: pkg ? { price: formatKurus(pkg.priceKurus, toAppLocale(locale)), duration: pkg.durationMinutes } : null,
  });
  const faqItems = renderFaq(faq, faqValues);
  // Arama sonucunda soru-cevap olarak görünmesi için aynı metinler yapısal
  // veriyle de duyurulur: bölümle aynı liste, aynı doldurulmuş cevaplar.
  const faqJsonLd =
    faqItems.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqItems.map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })),
        }
      : null;

  return (
    <>
      {/* Hareket yalnızca üst çubukta (kaydırma eşiği): bölümler kendiliğinden
          hareket etmez, hero'nun açılışı CSS ile kurulur. */}
      <MotionProvider>
        <SiteNav shopName={settings.shopName} user={user} variant="hero" />
      </MotionProvider>
      <main>
        <Hero headline={[text("hero.headline1"), text("hero.headline2")]} subtitle={text("hero.subtitle")} images={images} status={status} slots={openSlots} />
        <HowItWorksSection
          title={text("howItWorks.title")}
          note={text("howItWorks.note")}
          steps={[
            { title: text("howItWorks.step1Title"), text: text("howItWorks.step1Text") },
            { title: text("howItWorks.step2Title"), text: text("howItWorks.step2Text") },
            { title: text("howItWorks.step3Title"), text: text("howItWorks.step3Text") },
          ]}
          cancelNote={fillPlaceholders(text("howItWorks.cancelNote"), { minutes: settings.cancellationWindowMinutes })}
        />
        <AboutSection
          title={settings.aboutTitle}
          text={settings.aboutText}
          satisfactionPercent={settings.satisfactionPercent}
          yearsExperience={settings.yearsExperience}
          photoKey={images.about?.storageKey ?? null}
        />
        <ServicesSection
          title={text("services.title")}
          note={text("services.note")}
          packageSectionNote={text("package.sectionNote")}
          packageNote={text("package.note")}
          services={services.map((s) => ({ id: s.id, name: s.name, durationMinutes: s.durationMinutes, priceKurus: s.priceKurus }))}
          phone={settings.phone}
        />
        <WhyUsSection
          title={text("whyUs.title")}
          note={text("whyUs.note")}
          items={[
            { title: settings.whyUs1Title, text: settings.whyUs1Text },
            { title: settings.whyUs2Title, text: settings.whyUs2Text },
            { title: settings.whyUs3Title, text: settings.whyUs3Text },
          ]}
        />
        <TeamSection title={text("team.title")} note={text("team.note")} barbers={barbers.map((b) => ({ id: b.id, name: b.name, bio: b.bio, photoKey: b.photoKey }))} />
        <GallerySection title={text("gallery.title")} note={text("gallery.note")} photos={gallery.photos} tags={gallery.tags} />
        <TestimonialsSection title={text("testimonials.title")} note={text("testimonials.note")} items={testimonials} />
        <FaqSection title={text("faq.title")} note={text("faq.note")} items={faqItems} />
        {faqJsonLd && (
          // `serializeJsonLd`: metnin içinden gelebilecek bir `</script>` dizisi
          // etiketi kapatmasın (veri panelden geliyor).
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(faqJsonLd) }} />
        )}
        <ContactSection
          title={text("contact.title")}
          note={text("contact.note")}
          formNote={text("contact.formNote")}
          address={settings.address}
          phone={settings.phone}
          email={settings.email}
          whatsapp={settings.whatsapp}
          mapsUrl={settings.mapsUrl}
          weeklyHours={weeklyHours}
          todayDayOfWeek={shopDayOfWeek(now)}
          services={services.map((s) => s.name)}
        />
      </main>
      <SiteFooter
        shopName={settings.shopName}
        tagline={text("footer.tagline")}
        user={user}
        social={social}
        address={settings.address}
        phone={settings.phone}
        email={settings.email}
        status={status}
      />
    </>
  );
}
