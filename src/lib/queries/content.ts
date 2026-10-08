import { prisma } from "@/lib/db";
import { asI18nText, pick } from "@/lib/i18n-content";
import { toContentMap, type ContentMap } from "@/lib/content";
import { FAQ_ORDER } from "@/actions/impl/faq";
import { SITE_IMAGE_SLOT_LIST, type SiteImageSlot } from "@/schemas/site-image";
import { rememberSiteImages } from "@/lib/site-images-cache";

export async function getContentMap(): Promise<ContentMap> {
  return toContentMap(await prisma.contentBlock.findMany({ select: { key: true, textI18n: true } }));
}

export type FaqView = { id: string; question: string; answer: string };

/** Aktif sorular, ziyaretçinin dilinde (çeviri yoksa Türkçe). */
export async function getActiveFaq(locale: string): Promise<FaqView[]> {
  const rows = await prisma.faqItem.findMany({ where: { isActive: true }, orderBy: FAQ_ORDER, select: { id: true, questionI18n: true, answerI18n: true } });
  return rows.map((r) => ({ id: r.id, question: pick(r.questionI18n, locale), answer: pick(r.answerI18n, locale) }));
}

/** Panel listesi: üç dil ham hâliyle, pasifler dahil. */
export async function getFaqForPanel() {
  const rows = await prisma.faqItem.findMany({ orderBy: FAQ_ORDER });
  return rows.map((r) => ({ id: r.id, question: asI18nText(r.questionI18n), answer: asI18nText(r.answerI18n), sortOrder: r.sortOrder, isActive: r.isActive }));
}

export type SiteImageView = { storageKey: string; width: number; height: number };
export type SiteImages = Record<SiteImageSlot, SiteImageView | null>;

export async function getSiteImages(): Promise<SiteImages> {
  const rows = await prisma.siteImage.findMany();
  const out = Object.fromEntries(SITE_IMAGE_SLOT_LIST.map((slot) => [slot, null])) as SiteImages;
  for (const r of rows) {
    if ((SITE_IMAGE_SLOT_LIST as string[]).includes(r.slot)) out[r.slot as SiteImageSlot] = { storageKey: r.storageKey, width: r.width, height: r.height };
  }
  rememberSiteImages(out);
  return out;
}
