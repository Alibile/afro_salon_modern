# Afro Salon Modern — Tur 9 Implementation Plan (panelden içerik yönetimi)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ana sayfadaki her metin (hero, nasıl çalışır, bölüm başlık ve notları, SSS, altbilgi sloganı, arama başlık/açıklaması) ve üç fotoğraf yuvası (hero geniş, hero telefon, hakkımızda) panelden, üç dilde, kod değişmeden yönetilsin; boş bırakılan her alan bugünkü çeviri dosyası metnine düşsün.

**Architecture:** Üç yeni tablo: `ContentBlock(key, textI18n)` anahtar/değer; `FaqItem` serbest liste; `SiteImage(slot, storageKey, width, height)`. Anahtar listesi kodda (`content-keys.ts`), okuma kuralı saf fonksiyonda (`content.ts: siteText`). `getLandingData` üçünü de çeker; bölüm bileşenleri düz metin almaya devam eder, `page.tsx` metinleri `siteText`ten geçirir. Tek admin sayfası `/panel/icerik`, bölüm başına server action. Görseller mevcut presign akışıyla (`kind: "site"`), R2 yoksa yerel disk.

**Tech Stack:** aynı (Next 16, Prisma 7, next-intl 4, Zod 4). Yeni bağımlılık yok.

**Spec:** `docs/superpowers/specs/2026-10-07-icerik-yonetimi-design.md`

## Global Constraints

- Yalnızca `ADMIN` yazar; action'lar `asAdminActor` ile başlar, bilinmeyen anahtar `errors.invalidInput`.
- Metin alanları `i18nText` şemasıyla; Türkçe zorunlu değil (boş = çeviri dosyasına düş). SSS'de soru ≥ 3, cevap ≥ 10 karakter, Türkçe zorunlu.
- Yedekleme kuralı değişmez: dil → Türkçe → çeviri dosyası. Mevcut e2e'ler içerik tablosu boşken aynı metinleri görmeye devam eder.
- Yer tutucular düz `{ad}` değişimi (`fillPlaceholders`); ICU yalnızca çeviri dosyası yedeğinde.
- Tur 8 tasarım kuralları (Field, PanelPage, PanelSection, NewRecordPanel, 6 px köşe, 44 px dokunma, cümle düzeni başlıklar) aynen.
- Tur 1–8 kuralları: Türkçe metin, commit'lerde AI ibaresi yok, impl/wrapper ayrımı, yetki testleri `authorization.test.ts`'e eklenir, üç dil aynı anahtar kümesi.
- Her görev sonunda `npm run lint`, `npm run typecheck`, `npm test`, dokunulan `test:integration` dosyaları; e2e dokunulan akış için.

## Review Focus

1. **Boş içerik, dolu site.** `ContentBlock` tablosu boşken ana sayfa, SEO başlığı ve JSON-LD birebir bugünkü gibi. → Görev 2 birim (`siteText` yedek) + Görev 4 e2e (mevcut landing testleri değişmeden geçer).
2. **Yarım çeviri.** Admin yalnızca Türkçe hero manşeti girer; `/en` ziyaretçisi Türkçe manşeti görür (çeviri dosyasının İngilizcesini değil): panelden girilen metin çeviri dosyasının önüne geçer. → Görev 2 birim testi.
3. **Yer tutucu bozulursa.** SSS cevabına `{fiyat}` gibi bilinmeyen bir ad yazılırsa olduğu gibi kalır, sayfa düşmez. → Görev 2 birim (`fillPlaceholders`).
4. **Görsel yuvası silinince.** "Varsayılana dön" sonrası hero tekrar `public/landing/hero.jpg`'e döner, ön yükleme bağlantısı da. → Görev 5 entegrasyon + e2e (yuva boşken dosya yedeği).
5. **Seed yeniden koşunca SSS çoğalmaz.** `FaqItem` dolu tabloya ikinci kez yazılmaz; panelden silinen soru seed ile geri gelmez. → Görev 3 entegrasyon (`seed.test.ts`).

---

### Task 1: Veri modeli, migration, seed

**Files:**
- Modify: `prisma/schema.prisma`, `prisma/seed.ts`, `tests/integration/helpers.ts` (`resetDb` TRUNCATE listesi), `src/lib/storage.ts` (`UPLOAD_FOLDERS.site`), `src/lib/local-upload.ts` (`FOLDERS.site`, `parseLocalUploadKey` deseni), `src/app/api/upload/presign/route.ts` (`kind` enum)
- Create: `prisma/migrations/<ts>_site_content/migration.sql` (`prisma migrate dev --name site_content`)
- Test: `tests/integration/seed.test.ts`, `tests/integration/schema.test.ts`, `tests/unit/local-upload.test.ts`

**Kararlar:**

```prisma
/// Panelden girilen ana sayfa metinleri: anahtar `src/lib/content-keys.ts` listesinden, değer `{ tr, en?, fr? }`.
model ContentBlock {
  key       String   @id
  textI18n  Json
  updatedAt DateTime @updatedAt
}

/// Sıkça sorulanlar: serbest liste, üç dilde soru ve cevap.
model FaqItem {
  id           String   @id @default(cuid())
  questionI18n Json
  answerI18n   Json
  sortOrder    Int      @default(0)
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())
}

/// Ana sayfanın sabit fotoğraf yuvaları: `hero`, `heroMobile`, `about`. Boş yuva `public/landing/` dosyasına düşer.
model SiteImage {
  slot       String @id
  storageKey String
  width      Int
  height     Int
}
```

- Seed (`seedFaq`): `faqItem.count() === 0` ise `messages/{tr,en,fr}.json` → `landing.faq.q1..q6/a1..a6` üçlüsünden altı satır, `sortOrder` 0..5. Dolu tabloya dokunmaz (Review Focus 5). Dördüncü soru da eklenir; paket yoksa panelde uyarı (Görev 6).
- `resetDb` TRUNCATE listesine `"ContentBlock","FaqItem","SiteImage"` eklenir.
- Yükleme türü `site`: `UPLOAD_FOLDERS.site = "site"`, `local-upload.ts` deseni `(barbers|haircuts|gallery|site)`, presign `kind` enum'una `"site"`.
- Testler: `seed.test.ts`'e "SSS yalnızca boş tabloya yazılır: ikinci koşu 6'da bırakır, panelden silinen geri gelmez"; `schema.test.ts`'e üç tablonun varlığı; `local-upload.test.ts`'e `site` klasörü.
- Commit: "İçerik tabloları: ContentBlock, FaqItem, SiteImage ve SSS seed'i".

### Task 2: Anahtar listesi ve okuma kuralı (saf)

**Files:**
- Create: `src/lib/content-keys.ts`, `src/lib/content.ts`
- Test: `tests/unit/content.test.ts`

**Interfaces (sonraki görevler bunu tüketir):**

```ts
// content-keys.ts
export const CONTENT_KEYS = {
  "hero.headline1": { message: "landing.hero.headline1", max: 40 },
  "hero.headline2": { message: "landing.hero.headline2", max: 40 },
  "hero.subtitle": { message: "landing.hero.subtitle", max: 160 },
  "howItWorks.title": { message: "landing.howItWorks.title", max: 60 },
  "howItWorks.note": { message: "landing.howItWorks.note", max: 160 },
  "howItWorks.step1Title": { message: "landing.howItWorks.step1Title", max: 60 },
  "howItWorks.step1Text": { message: "landing.howItWorks.step1Text", max: 300 },
  // step2/step3 aynı; "howItWorks.cancelNote": 300 (yer tutucu {minutes})
  "services.title", "services.note", "package.sectionNote", "package.note",
  "whyUs.title", "whyUs.note", "team.title", "team.note", "gallery.title", "gallery.note",
  "testimonials.title", "testimonials.note", "faq.title", "faq.note",
  "contact.title", "contact.note", "contact.formNote",
  "footer.tagline": { message: "footer.tagline", max: 120 },
  "meta.homeTitle": { message: "meta.home.title", max: 70 },
  "meta.homeDescription": { message: "meta.home.description", max: 160 },
} as const;  // başlıklar max 60, notlar max 200
export type ContentKey = keyof typeof CONTENT_KEYS;
export function isContentKey(key: string): key is ContentKey;

// content.ts
export type ContentMap = Partial<Record<ContentKey, I18nText>>;
/** Panel metni (dil → tr) yoksa çeviri dosyası. `t` ICU'lu yedek için next-intl çevirmeni. */
export function siteText(blocks: ContentMap, key: ContentKey, locale: string, fallback: string): string;
/** `{ad}` yer tutucularını değiştirir; bilinmeyen ad olduğu gibi kalır. */
export function fillPlaceholders(text: string, values: Record<string, string | number>): string;
/** Satırları `ContentMap`e indirger (`asI18nText` ile). */
export function toContentMap(rows: { key: string; textI18n: unknown }[]): ContentMap;
```

- Testler: `siteText` üç yedek kademesi (Review Focus 1–2: `/en` için yalnızca TR girilmişse TR döner, hiçbiri yoksa `fallback`); `fillPlaceholders` bilinmeyen `{fiyat}` olduğu gibi kalır, sayı değerleri yazılır (Review Focus 3); `toContentMap` bilinmeyen anahtarı atar; `CONTENT_KEYS.message` anahtarlarının üç dilde var olduğu (`messages/*.json` düzleştirilerek).
- Commit: "İçerik anahtarları ve okuma kuralı".

### Task 3: Şemalar ve action'lar (impl + wrapper)

**Files:**
- Create: `src/schemas/content.ts`, `src/schemas/faq.ts`, `src/schemas/site-image.ts`, `src/actions/impl/content.ts`, `src/actions/impl/faq.ts`, `src/actions/impl/site-images.ts`, `src/actions/content.ts`, `src/actions/faq.ts`, `src/actions/site-images.ts`, `src/lib/queries/content.ts`
- Modify: `src/lib/errors.ts` (`faqQuestionMin3`, `faqAnswerMin10`, `invalidImageSlot`, `imageTooSmall`), `messages/*.json` (`errors.*`), `tests/integration/authorization.test.ts`
- Test: `tests/integration/content.test.ts`

**Interfaces:**

```ts
// schemas/content.ts
export const contentBlocksSchema = z.record(z.string().refine(isContentKey, "errors.invalidInput"), i18nText({ max: 300 }))
  .transform(…)  // her anahtar kendi max'ına göre ayrıca kontrol edilir (refine)
export type ContentBlocksInput = Record<string, { tr: string; en?: string; fr?: string }>;
// impl/content.ts
export async function saveContentBlocksAs(actor, input: ContentBlocksInput): Promise<ActionResult<void>>  // boş tr+en+fr → satır silinir
// schemas/faq.ts
export const faqItemSchema = z.object({ id: z.string().optional(), question: i18nText({ max: 160, trRequired: true, min: 3, minError: "errors.faqQuestionMin3" }), answer: i18nText({ max: 600, trRequired: true, min: 10, minError: "errors.faqAnswerMin10" }), sortOrder: z.coerce.number().int().min(0).default(0) });
// impl/faq.ts
upsertFaqItemAs, toggleFaqItemAs(id, isActive), moveFaqItemAs(id, "up"|"down"), deleteFaqItemAs(id)
// schemas/site-image.ts
export const SITE_IMAGE_SLOTS = { hero: { minWidth: 1600, aspect: [1.3, 1.7] }, heroMobile: { minWidth: 1000, aspect: [0.7, 0.9] }, about: { minWidth: 1000, aspect: [0.5, 2] } } as const;
export const siteImageSchema = z.object({ slot: z.enum(["hero","heroMobile","about"]), storageKey: z.string().regex(/^(site|uploads\/site)\/[0-9a-f-]{36}\.(jpg|png|webp)$/, "errors.invalidPhotoKey"), width, height }).refine(boyut ve oran, "errors.imageTooSmall" / "errors.invalidAspectRatio")
// impl/site-images.ts
setSiteImageAs(actor, input)  // eski nesneyi depodan siler
clearSiteImageAs(actor, slot)  // satırı ve nesneyi siler
// queries/content.ts
getContentMap(): Promise<ContentMap>; getActiveFaq(locale): Promise<{ id, question, answer }[]>; getFaqForPanel(); getSiteImages(): Promise<Record<"hero"|"heroMobile"|"about", { storageKey, width, height } | null>>
```

- Wrapper'lar `revalidatePath("/[locale]", "page")` ve `/[locale]/panel/icerik`.
- `authorization.test.ts`: yeni dokuz wrapper berber ve müşteri için `errors.notAllowed`.
- `content.test.ts`: içerik kaydet/oku, boş değer satırı siler, bilinmeyen anahtar reddi; SSS ekle/sırala/pasif/sil, min uzunluklar; görsel yuva yaz (oran/boyut reddi), değiştir (eski anahtar `deleteObject`'e gider: `vi.mock("@/lib/storage")`), temizle.
- Commit: "İçerik, SSS ve görsel yuvası action'ları".

### Task 4: Ana sayfa ve SEO içerikten okur

**Files:**
- Modify: `src/lib/queries/landing.ts`, `src/app/[locale]/(musteri)/page.tsx`, `src/components/landing/Hero.tsx`, `HowItWorksSection.tsx`, `ServicesSection.tsx`, `WhyUsSection.tsx`, `TeamSection.tsx`, `GallerySection.tsx`, `TestimonialsSection.tsx`, `FaqSection.tsx`, `ContactSection.tsx`, `SiteFooter.tsx`
- Test: `tests/e2e/landing.spec.ts` (mevcutlar geçer), `tests/unit/faq-items.test.ts` (yeni biçim), `tests/unit/json-ld.test.ts`

**Kararlar:**

- `getLandingData` `content: ContentMap`, `faq: { id, question, answer }[]`, `images` döner. `page.tsx` bir `text = (key) => siteText(content, key, locale, t(CONTENT_KEYS[key].message))` kapaması kurar; bölümlere `title`/`note` prop'u geçer (bileşenler artık kendi `t("title")`ini çağırmaz; `useTranslations` yalnızca sabit arayüz metinleri için kalır).
- Hero: `headline1/2`, `subtitle` prop. `HowItWorks`: `title, note, steps[{title,text}], cancelNote` (cancelNote `fillPlaceholders(…, { minutes })`).
- `FaqSection({ title, note, items })`; `visibleFaqKeys`/`FAQ_KEYS`/`faqValueBag` kalkar; JSON-LD `items`ten; cevaplar `fillPlaceholders(answer, { minutes, open, close, price, duration })` ile (paket yoksa `price`/`duration` boş dize).
- `generateMetadata` (ana sayfa) `meta.homeTitle/homeDescription`'ı `getContentMap`ten okur.
- `SiteFooter` `tagline` prop.
- Birim: `faq-items.test.ts` yeni modele göre (aktif süzme, sıralama); `json-ld.test.ts` aynı.
- E2e: mevcut `landing.spec` ve `i18n.spec` değişmeden geçer (Review Focus 1).
- Commit: "Ana sayfa metinleri içerik tablosundan okunur, SSS serbest liste".

### Task 5: Görsel yuvaları ana sayfada

**Files:**
- Modify: `src/lib/hero-image.ts` (`heroSources(images, alt)`, `preloadHero(images)`), `src/components/landing/Hero.tsx`, `src/components/landing/AboutSection.tsx`, `src/components/brand/ImageSlot.tsx` (`storageKey` prop), `src/app/[locale]/(musteri)/page.tsx`
- Test: `tests/unit/hero-image.test.ts` (yeni), `tests/e2e/landing.spec.ts`

**Kararlar:**

- `heroSources(images, alt)`: yuva doluysa `publicUrl(storageKey)` + kayıtlı `width/height`; boşsa bugünkü dosya kontrolü. `preloadHero(images)` aynı kaynaktan. `page.tsx`: önce `const images = await getSiteImages()`, sonra `preloadHero(images)`, sonra `getLandingData`.
- `ImageSlot`: `storageKey` verilirse onu, yoksa `public/landing/<name>` dosyasını, o da yoksa deseni.
- Birim: `heroSources` yuva/dosya/boş üç durumu (fs `vi.mock`).
- E2e: `/` hero `<img>` `src` `/_next/image?url=%2Flanding%2Fhero` ile başlar (yuva boş, Review Focus 4); `<link rel=preload as=image>` var.
- Lighthouse (Görev 7'de): `/en` doğrudan ≥ 85.
- Commit: "Hero ve hakkımızda fotoğrafı yuvadan, boşsa dosyadan".

### Task 6: Panel "İçerik" sayfası

**Files:**
- Create: `src/app/[locale]/panel/icerik/page.tsx`, `src/components/panel/content/ContentTextForm.tsx` (genel: anahtar listesi → `I18nTextField`/`I18nTextarea`, bölüm başına Kaydet), `HeroForm.tsx`, `HowItWorksForm.tsx`, `SectionNotesForm.tsx`, `FooterSeoForm.tsx`, `FaqList.tsx`, `FaqForm.tsx`, `SiteImagesForm.tsx`, `SiteImageSlot.tsx`
- Modify: `src/components/panel/PanelNav.tsx` (Yönetim grubuna `content`), `messages/*.json` (`panel.nav.content`, `panel.content.*`), `src/components/panel/ImageUploader.tsx` (`kind: "site"`, `onUploaded` boyut okuma için `readDimensions` ortaklaştırılır: `src/lib/read-image-dimensions.ts`), `GalleryUploader.tsx` (aynı yardımcıyı kullanır)
- Test: `tests/e2e/content.spec.ts`

**Kararlar:**

- Sayfa `PanelPage title="İçerik"`; altı `PanelSection`: Hero, Görseller, Nasıl çalışır, Bölüm başlıkları ve notları, Sıkça sorulanlar, Altbilgi ve arama.
- `ContentTextForm({ keys, placeholders })`: her anahtar için üç dilli alan, `placeholder` olarak çeviri dosyasının Türkçe/İngilizce/Fransızca metni (sekmeye göre), altında "Boş bırakılırsa bu metin görünür" ipucu; Kaydet `saveContentBlocks` çağırır. `maxLength` `CONTENT_KEYS[key].max`.
- Görseller: yuva başına kart: önizleme (`publicUrl` ya da dosya yedeği etiketiyle "Varsayılan"), istenen oran ve en küçük genişlik, "Yükle" (presign `site`, boyut istemcide okunur, `setSiteImage`), "Varsayılana dön" (`clearSiteImage`, onay diyaloğu).
- SSS: `NewRecordPanel` kurgusu değil (sayfa tek değil, bölümlerden biri): bölüm içinde "Yeni soru" düğmesi, açılınca `FaqForm`; liste satırları soru (TR), durum, yukarı/aşağı, Düzenle (satır içi), Pasif/Aktif, Sil. Yer tutucu ipucu: `{minutes} {open} {close} {price} {duration}`; paket yoksa `price`/`duration` kullanan sorunun yanında "paket yok, boş basılır" uyarısı.
- Yeni anahtarlar üç dilde: `panel.nav.content` "İçerik"/"Content"/"Contenu"; `panel.content.*` (başlıklar, açıklamalar, "Boş bırakılırsa…" ipucu, yuva adları ve oran metinleri, SSS etiketleri, `saved`, `faqAdded/updated/deleted/reordered`, `imageSaved/imageCleared`, uyarılar).
- E2e `content.spec.ts`: admin hero manşet 1'i "Deneme manşet" yapar → `/` h1 içerir → alanı boşaltır → `/` çeviri metnine döner; SSS'ye soru ekler → `/#sss` içinde görünür ve JSON-LD'de var → siler; berber `/panel/icerik` → 403; telefonda sayfa yatay taşmaz.
- Commit: "Panel: İçerik sayfası".

### Task 7: Son kontrol

**Files:** `README.md` ("İçerik yönetimi" bölümü güncellenir), spec durumu.

- Tüm paketler yeşil; e2e tam; Lighthouse üretim derlemesi `/en` doğrudan (Tur 8 ölçümüyle karşılaştır, hedef ≥ 85; düşerse `getSiteImages` `unstable_cache` 60 sn).
- Görsel kontrol: `/panel/icerik` 390 ve 1280 px; `/` değiştirilmiş manşet ve yüklenmiş hero ile (yerel disk).
- README: hangi metinlerin nereden yönetildiği tablosu, yer tutucular, görsel yuvaları ve yedek kuralı; "sabit 6 SSS" cümleleri kaldırılır.
- Commit: "Tur 9 son kontrol ve README".

---

## Self-review notları

- Spec §2.1 → Görev 2–4; §2.2 → Görev 1, 3, 4, 6; §2.3 → Görev 1, 3, 5, 6; §2.4 → Görev 6; §2.5 → Görev 3; §4 testler görevlere dağıtıldı; §5 riskler Görev 5/7'de ölçülür.
- Adlar tutarlı: `CONTENT_KEYS`, `ContentKey`, `isContentKey`, `siteText`, `fillPlaceholders`, `toContentMap`, `getContentMap`, `getActiveFaq`, `getSiteImages`, `saveContentBlocks`, `upsertFaqItem`, `moveFaqItem`, `toggleFaqItem`, `deleteFaqItem`, `setSiteImage`, `clearSiteImage`, `SITE_IMAGE_SLOTS`, `heroSources(images, alt)`, `preloadHero(images)`.
- Review Focus 1→T2/T4, 2→T2, 3→T2, 4→T5, 5→T1.
