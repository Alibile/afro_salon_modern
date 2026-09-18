# Afro Salon Modern — Tur 5 Implementation Plan (çok dilli: TR / EN / FR)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Siteyi üç dilli yapmak (TR varsayılan, EN, FR): müşteri yüzü + panel arayüz metinleri, panelden girilen içerik alanları için TR/EN/FR, e-postalar ve SEO.

**Architecture:** `next-intl` 4 ile `[locale]` segmenti (`localePrefix: "as-needed"` → TR öneksiz, `/en/...`, `/fr/...`). Mevcut `(musteri)`, `(auth)`, `panel`, `403`, `after-login` ağaçları `src/app/[locale]/` altına taşınır; `src/app/api/*` yerinde kalır. Proxy: next-intl middleware + mevcut Auth.js yetki kontrolü tek `proxy.ts` içinde. Mesajlar `messages/{tr,en,fr}.json` (namespace'ler: `common`, `nav`, `landing`, `booking`, `auth`, `account`, `panel`, `errors`, `email`). Server action'lar hata anahtarları döner (`fail("errors.notAllowed")`), istemci `t(error)` ile çevirir; `ActionResult.error` anahtar + opsiyonel `params`. İçerik alanları JSON sütun (`{ tr, en, fr }`), boş → TR. `User.locale` (tr|en|fr) kullanıcı tercihi ve e-posta dili.

**Tech Stack:** aynı + `next-intl@4`.

**Global Constraints:** Tur 1–4 kuralları (impl/wrapper, yetki testleri, opaklık, commit'lerde AI ibaresi yok). Türkçe metinler birebir korunur (TR çevirisi mevcut metinlerdir). EN/FR çeviriler doğal, salon tonunda; makine çevirisi hissi olmasın. Tüm testler TR'de yeşil kalır; EN ve FR için smoke e2e eklenir. Panel görsel dili değişmez.

---

### Task 1: next-intl altyapısı, `[locale]` yönlendirme, dil anahtarı, `User.locale`

**Kararlar:**
- `npm i next-intl@4`. `src/i18n/routing.ts` (`locales: ["tr","en","fr"]`, `defaultLocale: "tr"`, `localePrefix: "as-needed"`, `localeDetection: true`), `src/i18n/request.ts` (`getRequestConfig`, mesaj dosyaları), `src/i18n/navigation.ts` (`Link`, `redirect`, `usePathname`, `useRouter`). `next.config.ts` `createNextIntlPlugin`.
- Dosya taşıma: `src/app/layout.tsx` → `src/app/[locale]/layout.tsx` (`NextIntlClientProvider`, `<html lang={locale}>`, fontlar aynı), `(musteri)`, `(auth)`, `panel`, `403`, `after-login` → `[locale]/…`; `generateStaticParams` locale'ler; geçersiz locale → 404. Kök `src/app/layout.tsx` minimal (gerekirse) — next-intl 4 önerisine göre.
- `proxy.ts`: `createMiddleware(routing)` ile locale yönlendirmesi + mevcut yetki kuralları (locale önekini soyarak `/panel`, `/randevularim` kontrolü; `/giris?next=` locale korunur). Matcher: `["/((?!api|_next|.*\\..*).*)"]`.
- Tüm iç bağlantılar (`next/link`, `useRouter`, `redirect`) `@/i18n/navigation` karşılıklarına geçer; server action'lardaki `revalidatePath` çağrıları locale'siz yolları (`/`, `/panel/...`) ve gerekiyorsa `revalidatePath("/", "layout")` kullanır.
- `LocaleSwitcher` bileşeni (TR · EN · FR; `aria-label`), navbar (masaüstü + mobil menü), footer ve panel sidebar'da; seçim çerezi `NEXT_LOCALE` (next-intl standardı).
- `User.locale String @default("tr")` migration; kayıt/giriş sırasında mevcut locale yazılır; `getSessionUser` locale döner (JWT'ye ekle).
- Mesaj dosyaları bu görevde yalnızca `common` ve `nav` namespace'leriyle başlar (dil anahtarı, marka); metin taşıma Task 2–3'te.
- Testler: tüm mevcut test paketleri TR'de yeşil (e2e yolları değişmez); yeni e2e: `/en` → `<html lang="en">`, `/fr/randevu` 200, `/de` 404, dil anahtarı `/` → `/en` aynı sayfa. Unit: proxy yardımcı `stripLocale(pathname)`.
- Commit: "Çok dilli altyapı: next-intl ve locale yönlendirmesi".

### Task 2: Müşteri yüzü metinleri TR/EN/FR + action hata anahtarları

**Kararlar:**
- Landing (navbar, hero, hakkımızda başlıkları, hizmetler, neden biz, ekip, galeri, yorumlar, iletişim, footer), `/randevu` wizard, `/randevularim`, giriş/kayıt, `403`, `SiteHeader` metinleri `messages/*.json`'a taşınır. Türkçe değerler mevcut metinlerle birebir.
- Zod şema mesajları anahtara döner (`errors.*`), server action `fail()` anahtar döner; istemcide `useTranslations("errors")` ile gösterim; `ActionResult` `{ ok:false, error: string, params?: Record<string,string|number> }`. Integration testleri anahtar bekleyecek şekilde güncellenir (örn. `"errors.slotTaken"`), authorization.test anahtar `errors.notAllowed`.
- Tarih/saat: `useFormatter`/`Intl.DateTimeFormat` locale + `Europe/Istanbul`; `formatKurus` locale'e göre (`tr-TR` "400,00 ₺", `en` "₺400.00", `fr` "400,00 ₺").
- Gün adları (`shopStatus`, çalışma saatleri) çevirili.
- e2e: EN ve FR smoke (`/en` hero CTA "Book today", `/fr/randevu` başlık "1. Choisir un service"), TR akışı değişmeden.
- Commit: "Müşteri yüzü üç dilde".

### Task 3: Panel üç dilde, dil tercihi, e-postalar

**Kararlar:**
- Panel tüm sayfa/bileşen metinleri (`panel` namespace), toast'lar, tablo başlıkları, durum rozetleri; `PanelNav` etiketleri; profil sayfasında dil tercihi (TR/EN/FR select) → `User.locale` günceller ve `/{locale}/panel/profil`'e yönlendirir.
- E-posta şablonları TR/EN/FR (`email` namespace, `getTranslations({ locale })` sunucuda); alıcı dili: müşteri e-postaları `customer.locale`, berber bildirimi `barber.user.locale`; iletişim formu e-postası salon diline (TR) gider.
- Unit test: şablon render EN/FR başlıkları; integration: `sendAppointmentConfirmed` locale seçimi (mock deliver).
- Commit: "Panel ve e-postalar üç dilde".

### Task 4: Panelden girilen içerik alanları TR/EN/FR

**Kararlar:**
- Prisma `Json` alanlar: `Settings.aboutTitle/aboutText/whyUs1..3Title/Text` → `aboutTitleI18n` … (`{tr,en,fr}`); `Service.name` → `nameI18n` (+ `descriptionI18n?`); `GalleryPhoto.caption` → `captionI18n`. Migration: mevcut değerleri `{tr: <eski>}` olarak taşır (SQL `jsonb_build_object`), eski sütunlar kaldırılır; seed güncellenir. `src/lib/i18n-content.ts`: `pick(field, locale)` (boş → tr), Zod `i18nText({ trRequired: true, max })`.
- Galeri etiketleri: `GALLERY_TAGS` sabit anahtar + `messages/*.json`'da çevirileri (`gallery.tags.*`); DB'de anahtar saklanır; filtre çipleri çevrili; `?etiket=` anahtar kullanır.
- Panel formları: üç sekmeli girdi (TR zorunlu, EN/FR opsiyonel) `I18nTextField`/`I18nTextarea` bileşenleri; hizmet, ayarlar (site içeriği), galeri kartı.
- Sorgular locale alır: `getLandingData(locale)`, `getActiveServices(locale)`; randevu snapshot `nameSnapshot` müşterinin dilinde (o anki locale ile `pick`).
- Testler: unit `pick`, integration (migration sonrası `tr` doldu; boş `en` → tr; hizmet adı EN girilince `/en` listede EN), e2e `/en` hizmet adı görünür.
- Commit: "İçerik alanları üç dilde".

### Task 5: SEO, README, son kontrol

- `generateMetadata` locale'e göre başlık/açıklama; `alternates.languages` (hreflang tr/en/fr + x-default); `sitemap.ts` üç dil. README: dil yapısı, mesaj dosyaları, içerik çeviri akışı. Tam doğrulama zinciri + Lighthouse (≥ 85 kalmalı). Commit: "Tur 5 SEO ve son kontrol".
