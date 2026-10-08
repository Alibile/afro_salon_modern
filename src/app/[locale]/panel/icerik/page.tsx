import { getTranslations } from "next-intl/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { getContentMap, getFaqForPanel, getSiteImages } from "@/lib/queries/content";
import { getActiveServices } from "@/lib/queries/booking";
import { singlePackage } from "@/lib/package";
import { CONTENT_KEYS, type ContentKey } from "@/lib/content-keys";
import { PanelPage } from "@/components/panel/PanelPage";
import { PanelSection } from "@/components/panel/PanelSection";
import { ContentTextForm, type ContentField } from "@/components/panel/content/ContentTextForm";
import { SiteImagesForm } from "@/components/panel/content/SiteImagesForm";
import { FaqManager } from "@/components/panel/content/FaqManager";
import tr from "../../../../../messages/tr.json";
import en from "../../../../../messages/en.json";
import fr from "../../../../../messages/fr.json";

export const dynamic = "force-dynamic";

type Tree = { [key: string]: string | Tree };
const MESSAGES: Record<"tr" | "en" | "fr", Tree> = { tr: tr as Tree, en: en as Tree, fr: fr as Tree };

/** Çeviri dosyasındaki ham metin: panelde yer tutucu olarak gösterilir. */
function fallback(locale: "tr" | "en" | "fr", path: string): string {
  const value = path.split(".").reduce<unknown>((node, key) => (node as Tree)?.[key], MESSAGES[locale]);
  return typeof value === "string" ? value : "";
}

const MULTILINE = new Set<ContentKey>(["hero.subtitle", "howItWorks.step1Text", "howItWorks.step2Text", "howItWorks.step3Text", "howItWorks.cancelNote", "services.note", "package.sectionNote", "package.note", "whyUs.note", "team.note", "gallery.note", "testimonials.note", "faq.note", "contact.note", "contact.formNote", "meta.homeDescription"]);

export default async function IcerikPage() {
  await requireAdmin();
  const [content, faq, images, services, t] = await Promise.all([getContentMap(), getFaqForPanel(), getSiteImages(), getActiveServices("tr"), getTranslations("panel.content")]);

  const field = (key: ContentKey, hint?: string): ContentField => {
    const def = CONTENT_KEYS[key];
    return {
      key,
      label: t(`fields.${key.replace(".", "_")}` as never),
      placeholder: { tr: fallback("tr", def.message), en: fallback("en", def.message), fr: fallback("fr", def.message) },
      max: def.max,
      multiline: MULTILINE.has(key),
      hint,
    };
  };
  const notes: ContentKey[] = ["services.title", "services.note", "package.sectionNote", "package.note", "whyUs.title", "whyUs.note", "team.title", "team.note", "gallery.title", "gallery.note", "testimonials.title", "testimonials.note", "faq.title", "faq.note", "contact.title", "contact.note", "contact.formNote"];

  return (
    <PanelPage title={t("title")} description={t("description")}>
      <div>
        <PanelSection title={t("sections.hero")} description={t("sections.heroHint")}>
          <ContentTextForm fields={[field("hero.headline1"), field("hero.headline2"), field("hero.subtitle")]} initial={content} />
        </PanelSection>
        <PanelSection title={t("sections.images")} description={t("sections.imagesHint")}>
          <SiteImagesForm images={images} />
        </PanelSection>
        <PanelSection title={t("sections.howItWorks")} description={t.raw("sections.howItWorksHint")}>
          <ContentTextForm
            fields={[
              field("howItWorks.title"), field("howItWorks.note"),
              field("howItWorks.step1Title"), field("howItWorks.step1Text"),
              field("howItWorks.step2Title"), field("howItWorks.step2Text"),
              field("howItWorks.step3Title"), field("howItWorks.step3Text"),
              field("howItWorks.cancelNote", "{minutes}"),
            ]}
            initial={content}
          />
        </PanelSection>
        <PanelSection title={t("sections.notes")} description={t("sections.notesHint")}>
          <ContentTextForm fields={notes.map((k) => field(k))} initial={content} />
        </PanelSection>
        <PanelSection title={t("sections.faq")} description={t.raw("sections.faqHint")}>
          <FaqManager items={faq} hasPackage={singlePackage(services) !== null} />
        </PanelSection>
        <PanelSection title={t("sections.footerSeo")} description={t("sections.footerSeoHint")}>
          <ContentTextForm fields={[field("footer.tagline"), field("meta.homeTitle"), field("meta.homeDescription")]} initial={content} />
        </PanelSection>
      </div>
    </PanelPage>
  );
}
