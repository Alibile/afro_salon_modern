# Afro Salon Modern — Tur 8 Implementation Plan (tasarım yenileme)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Site, randevu akışı ve panelin görünümünü "şablondan üretilmiş" hissinden kurtarmak: tutarlı hizalama, tek köşe ve boşluk kuralı, iki yazı tipi, telefon öncelikli düzen; davranış ve veri aynen.

**Architecture:** Yalnızca sunum katmanı değişir: `globals.css` değişkenleri, `src/components/**` ve `src/app/[locale]/**/page.tsx` dosyaları, `messages/*.json` başlık değerleri. Server action, sorgu, şema ve API uçlarına dokunulmaz. Yeni ortak parçalar: `ui/field.tsx`, `ui/select.tsx`, `ui/status-dot.tsx`, `layout/SiteNav.tsx` (tek üst çubuk), `panel/PanelPage.tsx`, `booking/StepIndicator.tsx`, `booking/StepSummary.tsx`, `booking/BookingSummary.tsx`.

**Tech Stack:** aynı (Next 16, Tailwind 4, shadcn radix-nova, next-intl 4, motion 13). Yeni bağımlılık yok; Bebas Neue yükü kalkar.

**Spec:** `docs/superpowers/specs/2026-10-06-tasarim-yenileme-design.md`

## Global Constraints

- Renk paleti değişmez: `--primary`, `--accent`, `--background`, `--foreground`, `--secondary`, `--muted`, `--success`, `--destructive` değerleri `globals.css`'te olduğu gibi kalır.
- Yazı tipi: müşteri yüzü Fraunces + Manrope; panel yalnızca Inter. Bebas Neue (`--font-label`, `.label`) tamamen kalkar.
- Başlıklar cümle düzeni; BÜYÜK HARF yalnızca `landing.hero.headline1/2` ve altbilgideki yığılmış marka adında.
- Köşe: müşteri yüzünde `--radius: 2px`, panel kabuğunda `--radius: 6px`. Hap rozet yok.
- `·` meta ayırıcı ve `tracking-[0.2em] uppercase` etiket hiçbir yerde kullanılmaz.
- Hareket: yalnızca hero açılışı (`.rise`, `.hero-zoom`), galeri lightbox ve kullanıcı eylemine cevap veren geçişler. `Reveal`, `Parallax`, `CountUp` çağrıları kalkar.
- Telefon önce: her bileşen 390 px'te tek sütun ve 44 px dokunma hedefiyle tasarlanır, `md`/`lg` genişletir. Dikey bölüm boşluğu `py-14 md:py-24`, oluk `px-5 md:px-10`, kap `max-w-6xl`.
- Çeviri: üç dosya aynı anahtar kümesini aynı sırayla taşır (`tests/unit/messages.test.ts`); yeni anahtar üç dile birden girer.
- Tur 1–7 kuralları: Türkçe metin, commit'lerde AI ibaresi yok, `.env` commit'lenmez, e2e Pixel 7 profilinde.
- Her görev sonunda `npm run lint`, `npm run typecheck`, `npm test` yeşil; e2e dokunulan akış için çalıştırılır (`npx playwright test tests/e2e/<dosya>`).

## Review Focus

Spec'in ima ettiği ama hiçbir görevin testinin doğrudan örtmediği, kullanıcıyı en çok ısıracak beş durum. Her satırın testi ilgili göreve eklendi.

1. **Uzun salon adı telefonda üst çubuğu taşırmaz.** Ayarlardan "Afro Salon Modern Kadıköy Şubesi" girilince 390 px'te logo, "Randevu al" ve menü düğmesi tek satırda kalır, yatay kaydırma oluşmaz. → Görev 2 e2e.
2. **Sihirbazda geri dönüş seçimi düşürür.** Berber seçildikten sonra "Değiştir" ile hizmete dönülüp hizmet değişince seçili saat sıfırlanır, özet kartı eski saati göstermez. → Görev 4 e2e.
3. **Panel tablosu telefonda okunur.** 390 px'te randevu tablosu satırları kart gibi dizilir, hiçbir hücre kesilmez, durum metni görünür. → Görev 6 e2e.
4. **Koyu temada panel kontrastı.** Aktif menü zemini (`bg-primary/8`) ve nokta rozetleri koyu temada da ayırt edilir; `--border` ince çizgiler kaybolmaz. → Görev 5 görsel kontrol + e2e `prefers-color-scheme: dark` smoke.
5. **Çeviri parite kayması.** Büyük harf değerler cümle düzenine çevrilirken bir dilde anahtar atlanırsa site o alanda anahtar adını basar. → Görev 1 birim testi (mevcut parite testi + "büyük harf değer kalmadı" testi).

---

### Task 1: Temel: yazı tipi, köşe, alan bileşenleri ve çeviri başlıkları

**Files:**
- Modify: `src/app/globals.css`, `src/app/[locale]/layout.tsx`, `src/app/[locale]/panel/layout.tsx`
- Modify: `src/components/ui/button.tsx`, `src/components/ui/input.tsx`, `src/components/ui/textarea.tsx`, `src/components/ui/badge.tsx`
- Create: `src/components/ui/field.tsx`, `src/components/ui/select.tsx`, `src/components/ui/status-dot.tsx`
- Modify: `messages/tr.json`, `messages/en.json`, `messages/fr.json`
- Test: `tests/unit/messages.test.ts`

**Kararlar:**

- `globals.css`: `--radius: 2px` (kök), `.dark` değişmez. `@theme inline` içinden `--font-label` ve `--font-heading` satırları kalkar; `--radius-sm/md/lg/xl` türevleri `calc(var(--radius) + Npx)` kalır. `.label`, `.panel-typography h1/h2/h3` Bebas kuralı, `.leader` silinir. `.panel-typography` yalnızca `--font-sans: var(--font-panel-sans); --font-display: var(--font-panel-sans); --radius: 6px; font-family: var(--font-panel-sans);` yazar. Başlık temel kuralı (`h1,h2,h3 { font-display 600 opsz 108 }`) kalır; `text-wrap: balance` kalır. `.display-*` sınıfları kalır ama `display-lg` artık `clamp(2rem, 3.2vw, 2.75rem)` (bölüm başlıkları küçülür; hero `display-cinema` aynı). `.editorial-note` kalır (yalnızca gerçekten not olan yerlerde kullanılacak).
- `layout.tsx`: `Bebas_Neue` importu ve `bebas` değişkeni kalkar, `<html className>` üç fonta düşer.
- `panel/layout.tsx`: Inter aynı; kabuk Görev 5'te yeniden yazılır, burada yalnızca `.panel-typography` sınıfı kalır.
- `button.tsx`: `size` eşlemesi `default: h-10 px-4`, `sm: h-9 px-3 text-sm`, `lg: h-12 px-6 text-base`, `icon: size-10`, `icon-sm: size-9`; `xs`, `icon-xs`, `icon-lg` kalkar (kullanım yok). `rounded-lg` → `rounded-[var(--radius)]`. Varyantlar aynı.
- `input.tsx`, `textarea.tsx`: `h-10`, `px-3`, `rounded-[var(--radius)]`, `text-base md:text-sm`. `badge.tsx`: `rounded-[var(--radius)]`, `h-6 px-2`; `default` varyantı `bg-primary/10 text-primary` (dolu terracotta hap biter).
- `ui/field.tsx`:

```tsx
import { cn } from "@/lib/utils";
import { Label } from "./label";

/** Etiket + kontrol + ipucu/hata: panel ve müşteri formlarının tek alan düzeni. */
export function Field({ id, label, hint, error, children, className, trailing }: {
  id: string; label: React.ReactNode; hint?: React.ReactNode; error?: string | null;
  children: React.ReactNode; className?: string;
  /** Etiket satırının sağına oturan küçük kontrol (dil sekmeleri gibi). */
  trailing?: React.ReactNode;
}) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={id}>{label}</Label>
        {trailing}
      </div>
      {children}
      {error ? <p className="text-sm text-destructive">{error}</p> : hint ? <p className="text-sm text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
```

- `ui/select.tsx`: native `<select>` sarmalayıcısı; `Input` ile aynı sınıf dizisi + `appearance-none pr-9` ve sağda `ChevronDown` ikonu (`pointer-events-none absolute right-3`). İmza: `Select({ className, children, ...props }: React.ComponentProps<"select">)`.
- `ui/status-dot.tsx`:

```tsx
const TONES = { SCHEDULED: "bg-primary", COMPLETED: "bg-success", CANCELLED: "bg-muted-foreground", NO_SHOW: "bg-destructive" } as const;
export type StatusKey = keyof typeof TONES;
export function StatusDot({ status, label }: { status: StatusKey; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm">
      <span aria-hidden className={cn("size-2 shrink-0 rounded-full", TONES[status])} />
      {label}
    </span>
  );
}
```

- Çeviri değerleri (üç dil, aynı anahtarlar): `nav.faq` kalır ("SSS"/"FAQ" kısaltma). Değişenler:
  - `landing.howItWorks.title`: "Nasıl çalışır" / "How it works" / "Comment ça marche"
  - `landing.services.title`: "Hizmetler ve fiyat" / "Services and prices" / "Prestations et tarifs"
  - `landing.whyUs.title`: "Neden biz" / "Why us" / "Pourquoi nous"
  - `landing.team.title`: "Ekip" / "The team" / "L'équipe"
  - `landing.gallery.title`: "Galeri" / "Gallery" / "Galerie"
  - `landing.testimonials.title`: "Yorumlar" / "Reviews" / "Avis"
  - `landing.faq.title`: "Sıkça sorulanlar" / "Frequently asked" / "Questions fréquentes"
  - `landing.contact.title`: "İletişim" / "Contact" / "Contact"; `whereTitle`: "Neredeyiz" / "Where we are" / "Où nous trouver"; `hoursTitle`: "Çalışma saatleri" / "Opening hours" / "Horaires d'ouverture"; `formTitle`: "Mesaj bırak" / "Leave a message" / "Laisser un message"
  - `landing.package.includesTitle`: "Fiyata dahil" / "Included in the price" / "Compris dans le tarif" (TR zaten cümle düzeni; sınıf değişir)
  - `booking.title`: "Randevu al" / "Book an appointment" / "Prendre rendez-vous"
  - `booking.step1/2/3`: "Hizmet" / "Berber" / "Gün ve saat"; "Service" / "Barber" / "Day and time"; "Prestation" / "Barbier" / "Jour et heure"
  - yeni `booking.change`: "Değiştir" / "Change" / "Modifier"; `booking.summaryTitle`: "Randevu özeti" / "Your booking" / "Votre rendez-vous"; `booking.stepsLabel`: "Randevu adımları" / "Booking steps" / "Étapes de la réservation"; `booking.notChosen`: "Seçilmedi" / "Not chosen yet" / "Pas encore choisi"
  - `account.upcomingTitle`: "Yaklaşan randevularım" / "Upcoming appointments" / "Mes prochains rendez-vous"; `photosTitle`: "Kesim fotoğrafların" / "Your cuts" / "Vos coupes"; `pastTitle`: "Geçmiş" / "Past" / "Historique"
  - `auth.asideHeadline` BÜYÜK HARF kalır (hero ile aynı rol: sol panelin tek manşeti). `auth.login.title`: "Giriş yap" / "Sign in" / "Connexion"; `auth.register.title`: "Kayıt ol" / "Sign up" / "Créer un compte"
  - `footer.site`: "Site" / "Site" / "Site"; `quickLinks`: "Hızlı bağlantılar" / "Quick links" / "Liens rapides"; `contact`: "İletişim" / "Contact" / "Contact"
  - `panel.today.heading`: "Bugün, {date}" / "Today, {date}" / "Aujourd'hui, {date}"
  - yeni `panel.nav.groupDaily`: "Günlük iş" / "Day to day" / "Au quotidien"; `panel.nav.groupManage`: "Yönetim" / "Manage" / "Gestion"; `panel.common.new`: "Yeni" / "New" / "Nouveau"; `panel.common.close`: "Kapat" / "Close" / "Fermer"; `panel.common.actions`: "İşlemler" / "Actions" / "Actions"
  - yeni `landing.hero.statusLine`: "{status} {slots}" **yazılmaz**; hero Görev 3'te iki mevcut metni tek `<p>` içinde iki cümle olarak basar.
- `tests/unit/messages.test.ts`'e test: üç dosyada `landing.hero.headline1/2` ve `auth.asideHeadline` dışında, 3+ karakterli ve tamamen büyük harf hiçbir değer yok (`value === value.toLocaleUpperCase(tag) && /\p{Lu}/u.test(value)`; kısaltma istisnaları `nav.faq`, `footer.rights` hariç).
- Commit: "Tasarım temeli: iki yazı tipi, köşe kuralı, alan bileşenleri ve cümle düzeni başlıklar".

### Task 2: Tek üst çubuk

**Files:**
- Create: `src/components/layout/SiteNav.tsx` (taşınan `landing/SiteNav.tsx`)
- Delete: `src/components/landing/SiteNav.tsx`, `src/components/layout/SiteHeader.tsx`
- Modify: `src/app/[locale]/(musteri)/layout.tsx`, `src/app/[locale]/(musteri)/page.tsx`, `src/components/brand/BrandLogo.tsx`, `src/components/brand/LocaleSwitcher.tsx`, `src/components/landing/SiteFooter.tsx`
- Test: `tests/e2e/landing.spec.ts` ("marka" bloğu), yeni `tests/e2e/nav.spec.ts`

**Kararlar:**

- `SiteNav({ shopName, user, variant })`, `variant: "hero" | "plain"`. `hero`: mevcut şeffaf başlangıç + kaydırınca toplanma (`useScroll`). `plain`: hep düz zemin (`bg-background border-b`), `h-16`, kaydırma dinlenmez (`useScroll` yalnızca `hero`'da kurulur: iki iç bileşen `HeroBar`/`PlainBar` aynı `BarContent`'i kullanır).
- `(musteri)/layout.tsx`: `pathname === "/"` denetimi istemcide kalmasın diye yerleşim `SiteNav`'ı **çizmez**; her sayfa kendi çubuğunu çağırır: ana sayfa `variant="hero"`, `randevu` ve `randevularim` sayfaları `variant="plain"`. Yerleşim yalnızca `<main>` sarar. Böylece `SiteHeader` ve `usePathname` denetimi silinir.
- `BarContent`: `mx-auto flex h-full max-w-6xl items-center gap-3 px-5 md:px-10`. Sol: `BrandLogo compact` (işaret 24 px, ad `font-display font-medium text-lg`, `truncate min-w-0`). Orta (`xl:flex`): bölüm bağlantıları yalnızca `hero` varyantında (iç sayfalarda bölüm çapaları yok). Sağ: `xl` üstünde `LocaleSwitcher`, hesap bağlantısı, `ThemeToggle`; her genişlikte "Randevu al" düğmesi (`/randevu` sayfasında gizli: `hideBook` prop'u) ve `xl:hidden` menü düğmesi. Telefonda `ThemeToggle` ve `LocaleSwitcher` menünün içine iner (çubukta yalnızca logo + düğme + menü).
- Mobil menü (`#mobil-menu`): bölüm bağlantıları (yalnızca hero varyantı), hesap bağlantısı, altta tek satırda dil anahtarı ve tema düğmesi. Bağlantı sınıfı `font-display text-2xl py-3.5 border-b`.
- `LocaleSwitcher`: `.label` yerine `text-xs font-medium tracking-wide`; ayırıcı `·` yerine `gap-3` ve `aria-current` olan koyu, diğerleri soluk. `tone` prop'u aynı.
- `BrandLogo`: `stacked` varyantta Bebas yok; `display-lg leading-[0.9]` Fraunces büyük harf kalır (altbilgi istisnası). `compact` aynı.
- `SiteFooter`: `HEADING = "text-sm font-medium text-primary-foreground/70"`; `.label` kalkar. Gerisi aynı.
- e2e `nav.spec.ts`:
  - `/randevu` ve `/randevularim` (giriş sonrası) çubuğunda logo bağlantısı `Afro Salon Modern — Ana Sayfa` ve menü düğmesi var; `/randevu`'da "Randevu al" düğmesi yok, `/randevularim`'da var.
  - **Review Focus 1:** `page.setViewportSize({ width: 390, height: 844 })`, `/` açılır, `header` yüksekliği ≤ 80 px ve `document.documentElement.scrollWidth <= 390`; ayrıca `page.route` ile `shopName` değiştirilemez, bunun yerine logo `span.truncate` genişliği `< 240` doğrulanır ve `BrandLogo` birim testi: `shortName("Afro Salon Modern Kadıköy Şubesi") === "Afro Salon Modern"` değil, ilk iki kelime → `"Afro Salon"`.
  - Mevcut "marka" testleri aynen geçer (1100 px hamburger, 1280 px masaüstü).
- Commit: "Tek üst çubuk: ana sayfa ve iç sayfalar aynı bileşeni kullanır".

### Task 3: Ana sayfa bölümleri

**Files:**
- Modify: `src/components/landing/Hero.tsx`, `HowItWorksSection.tsx`, `AboutSection.tsx`, `ServicesSection.tsx`, `WhyUsSection.tsx`, `TeamSection.tsx`, `TestimonialsSection.tsx`, `FaqSection.tsx`, `ContactSection.tsx`, `MapEmbed.tsx`, `gallery/GalleryFilters.tsx`, `gallery/GalleryBrowser.tsx`, `src/components/brand/ImageSlot.tsx`
- Modify: `src/app/[locale]/(musteri)/page.tsx` (sayaç değerleri `AboutSection`'a geçer, `MotionProvider` yalnızca hero için kalır)
- Modify: `src/components/motion/Reveal.tsx` (kalır, kullanılmaz), `tests/unit/motion-utils.test.ts` (parallax/formatCount testleri silinir), `src/lib/motion-utils.ts` (`clampParallax`, `parallaxRange`, `formatCount` silinir)
- Delete: `src/components/motion/CountUp.tsx`, `src/components/motion/Parallax.tsx`
- Test: `tests/e2e/landing.spec.ts`, `tests/e2e/i18n.spec.ts`

**Kararlar (bölüm bölüm):**

- **Ortak sarmal:** her bölüm `<section id class="scroll-mt-16 border-b border-border"><div class="mx-auto max-w-6xl px-5 py-14 md:px-10 md:py-24">`. `Reveal` sarmalayıcıları düz `div/li/h2` olur. `staggerDelay` yalnızca `Hero.riseDelay`'de kalır.
- **Hero:** manşet ve düğmeler aynı. Durum satırı: `<p className="rise text-sm text-hero-sand/85 md:text-base">{shopStatusText(...)}{open && ` ${slotsText}.`}</p>`; nokta, `.label`, `·` kalkar. Durum metni çeviride `"Bugün açık · {opensAt}–{closesAt}"` → `"Bugün açığız, {opensAt}–{closesAt}"` / `"Open today, {opensAt}–{closesAt}"` / `"Ouvert aujourd'hui, {opensAt}–{closesAt}"` (anahtar `common.status.open`, üç yerde de aynı cümle). `hero.slotsFull`: "Bugün doluyuz, bu haftadan gün seç" (virgül). Sağdaki dikey "Kaydır" bloğu ve `Parallax` desen katmanı silinir; `hero.scroll` anahtarı üç dilden kalkar. e2e sayaç testi `h1`'in önceki `p`'sinde `/\d+ boş randevu|Bugün doluyuz/` aramaya devam eder (yapı korunur: `p` sonra `h1`).
- **HowItWorks:** başlık bloğu `max-w-2xl`: `<h2 className="display-lg">` + `<p className="mt-3 text-muted-foreground">`. Adımlar `<ol className="mt-10 grid gap-8 md:grid-cols-3">`; her `<li className="border-t border-border pt-5">` içinde `<p className="text-sm font-medium text-primary tabular-nums">1</p>` (üç dilde rakam, `01` değil; `STEPS.number` `"1" | "2" | "3"`), `<h3 className="display-md mt-2">`, metin. İptal notu düz `<p className="mt-10 text-muted-foreground">`. e2e `#nasil ol > li` üç adım testi geçer.
- **About:** props `{ title, text, satisfactionPercent, yearsExperience }`. Fotoğraf `md:col-span-5` sabit (parallax yok), `figure` köşesiz, kenarlıklı. Metin `md:col-span-7`; paragraflar `text-lg leading-relaxed`; altında `<dl className="mt-8 grid grid-cols-2 gap-6 border-t border-border pt-6">` iki satır: `<dd className="display-md text-primary">{percent}</dd><dt className="text-sm text-muted-foreground">müşteri memnuniyeti</dt>` ve `{years} yıl` + "deneyim" (anahtarlar `landing.whyUs.satisfaction/experience/yearsUnit` `landing.about.*` altına taşınır; üç dil). `CountUp` yok, `percentAffix` aynen.
- **Services:** `header` sticky kalkar; `md:col-span-4` başlık + not (`text-muted-foreground`, italik değil). Paket kartı: `h3 display-lg` ad; "Fiyata dahil" `<p className="mt-8 text-sm font-medium">`; liste aynı ikonlarla; sağ sütun fiyat `display-lg text-primary tabular-nums`, süre `text-muted-foreground`, düğme `size="lg"`. Alt not düz `text-muted-foreground`. Çoklu hizmet listesi: `.leader` yerine `grid grid-cols-[1fr_auto] gap-x-6` satırlar.
- **WhyUs:** props `{ items }` (sayaçlar gider). Başlık + not üst üste `max-w-2xl`; maddeler `md:grid-cols-3`, her madde `border-t pt-5`, dönmüş kare kalkar, `h3 display-md`, metin. Alt bant (`bg-secondary` + `AfroPattern` + `Parallax`) **silinir**.
- **Team:** `cn(i % 2 === 1 && "lg:mt-16")` kalkar; ızgara `grid-cols-2 gap-x-5 gap-y-10 sm:gap-x-8 lg:grid-cols-3` (iki berberde `lg:grid-cols-2`). Telefonda iki sütun (3:4 fotoğraf 390 px'te 165 px genişlik, kabul). `AfroPattern` yer tutucu kalır. Bağlantı `text-sm text-primary underline underline-offset-4`.
- **Testimonials:** `md:mt-12` kalkar; `grid gap-10 md:grid-cols-3`; alıntı `text-lg leading-snug` (editorial-note italik kalır: alıntı gerçekten not), ad `<p className="mt-4 text-sm text-muted-foreground">` düz yazı.
- **FAQ:** başlık + not üst üste; `<ul className="mt-10 border-t md:max-w-3xl">`. `summary` `text-lg font-medium` (display-sm yerine), `py-4`, ok aynı; cevap `animate-in` kalır (kullanıcı eylemi).
- **Contact:** başlık + not üst üste. Izgara `mt-10 grid gap-12 md:grid-cols-12`. Sol `md:col-span-5`: `h3 display-md` "Neredeyiz", adres `text-lg`, telefon `text-lg text-primary underline underline-offset-4`, bağlantı listesi aynı `dl`, ardından **çalışma saatleri** (`h3 display-md mt-10`), en altta `MapEmbed`. Sağ `md:col-span-7`: form. Telefonda sıra DOM sırasıdır (adres, bağlantılar, saatler, harita, form). `MapEmbed` düğmesi: `.label` yerine `text-sm font-medium underline underline-offset-4`; e2e harita testi `getByRole("button", { name: "Haritayı yükle" })` ile bulur (büyük harf sorunu kalktı).
- **GalleryFilters:** çip `h-11` (44 px), `px-4`, köşe `rounded-[var(--radius)]`. **ImageSlot** etiket `text-xs` düz.
- **Footer:** Görev 2'de yapıldı.
- **page.tsx:** `MotionProvider` yalnızca `Hero`'yu sarar (`Reveal` artık çağrılmıyor; `motion/react` yükü hero dışına inmez). `WhyUsSection` yalnızca `items`, `AboutSection` sayaçları alır.
- e2e güncellemeleri: `landing.spec` paket bloğu aynı metinlerle geçer; `i18n.spec` "Included in the price" aynı. Yeni test: `#neden-biz` içinde `dl` yok, `#hakkimizda` içinde `%99` ve `10 yıl` metni var (e2e seed değerleri 99 ve 10).
- Commit: "Ana sayfa: her bölüm kendi biçimini alır, hareket yalnızca hero'da".

### Task 4: Randevu sihirbazı ve müşteri sayfaları

**Files:**
- Create: `src/components/booking/StepIndicator.tsx`, `StepSummary.tsx`, `BookingSummary.tsx`
- Modify: `src/components/booking/BookingWizard.tsx`, `ServiceStep.tsx`, `BarberStep.tsx`, `SlotStep.tsx`, `AppointmentCard.tsx`, `CancelButton.tsx`
- Modify: `src/app/[locale]/(musteri)/randevu/page.tsx`, `(musteri)/randevularim/page.tsx`, `(auth)/layout.tsx`, `(auth)/giris/page.tsx`, `(auth)/kayit/page.tsx`, `src/components/auth/LoginForm.tsx`, `RegisterForm.tsx`
- Test: `tests/e2e/booking.spec.ts`, `tests/e2e/i18n.spec.ts`

**Interfaces:**
- `StepIndicator({ current }: { current: 1 | 2 | 3 })` — `booking.step1/2/3` etiketleri; `<ol aria-label={t("stepsLabel")}>`, her `<li aria-current={i === current ? "step" : undefined}>`; tamamlanan `Check` ikonu + `text-foreground`, etkin `font-medium text-primary` + alt çizgi, sıradaki `text-muted-foreground`.
- `StepSummary({ step, title, value, onChange })` — tek satır: `<p className="text-sm text-muted-foreground">{title}</p><p className="font-medium">{value}</p>` solda, sağda `<button type="button" className="text-sm text-primary underline underline-offset-4">{t("change")}</button>`. `data-step={step}`.
- `BookingSummary({ services, barberName, day, startsAt, totalMinutes, totalKurus, confirmLabel, disabled, pending, onConfirm })` — `md:` sağ kart (`border border-border p-5 sticky top-24`), telefonda `fixed inset-x-0 bottom-0 border-t bg-background/95 backdrop-blur px-5 py-3` (`md:static md:border md:p-5`). İçerik: başlık `summaryTitle` (yalnızca `md`), üç satır `dl` (Hizmet / Berber / Gün ve saat; boşsa `notChosen`), toplam satırı `font-medium tabular-nums` ("45 dk, 700,00 ₺" → iki ayrı `span`, aralarında `gap-3`, `·` yok), düğme `size="lg" className="w-full"`.

**Kararlar:**

- `BookingWizard` düzeni:

```tsx
<div className="md:grid md:grid-cols-12 md:gap-10">
  <div className="md:col-span-7 space-y-6">
    <StepIndicator current={step} />
    {step > 1 ? <StepSummary step={1} title={t("step1")} value={selected.map(s => s.name).join(", ")} onChange={() => { setServiceIds([]); setBarberId(null); setStartsAt(null); }} />
              : <ServiceStep ... />}
    {step === 2 && <BarberStep ... />}
    {step > 2 && <StepSummary step={2} title={t("step2")} value={barberName} onChange={() => { setBarberId(null); setStartsAt(null); }} />}
    {step === 3 && barberId && <SlotStep ... />}
  </div>
  <aside className="md:col-span-5">{selected.length > 0 && <BookingSummary ... />}</aside>
</div>
```

  `step` türetimi aynı (`serviceIds.length === 0 ? 1 : !barberId ? 2 : 3`). Tek hizmetli salonda hizmet seçimi hâlâ bir tıklama ister (davranış değişmez). Telefonda alt çubuk içerik altını örtmesin diye sayfa `pb-32 md:pb-24`.
- `ServiceStep`: `h2 display-md` yerine `<h2 className="text-xl font-medium">{t("step1")}</h2>`; kart `min-h-14 grid grid-cols-[1fr_auto] items-center gap-4 border px-4 py-3`, seçili `border-primary bg-primary/5 border-l-4` (sol çizgi), ad `font-display text-lg`, süre `text-sm text-muted-foreground`, fiyat `tabular-nums`, `Check` ikonu fiyatın sağında.
- `BarberStep`: fotoğraf `size-18` (72 px), ad `font-display text-lg`, biyografi `text-sm text-muted-foreground`, son kesim küçük resimleri `mt-2 flex gap-1.5` `size-10`. Seçili kart sol çizgi.
- `SlotStep`: `h2 text-xl font-medium`; gün çipi iki satır `h-14 min-w-[4.5rem] flex-col items-center justify-center px-3` (`<span className="text-sm font-medium">{label}</span><span className="text-xs tabular-nums opacity-80">{sub}</span>`), `data-date` kalır. Saat ızgarası `<div data-slots className="grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-6">`, düğme `h-11`. Bölüm `data-step="3"`.
- `randevu/page.tsx`: `SiteNav variant="plain" hideBook`; kap `mx-auto max-w-6xl px-5 pb-32 pt-6 md:px-10 md:pb-24 md:pt-10`; başlık `display-lg` "Randevu al", altında `<p className="mt-2 text-muted-foreground">{status}. {address}</p>` (nokta cümle sonu). Üstteki `border-b` bölüm kalkar, `mt-8` ile sihirbaz.
- `randevularim/page.tsx`: `SiteNav variant="plain"`; kap `max-w-3xl`; başlıklar `display-lg` / `display-md` cümle düzeni. Liste `AppointmentCard`:
  - `big`: `border-l-4 border-primary bg-card p-5`; saat `display-md tabular-nums`; alt satır `<p className="mt-1 text-muted-foreground">{dayPrefix ? `${dayPrefix}, ` : ""}{date}</p>` ve `<p className="text-muted-foreground">{barberName}</p>`; hizmet ve tutar iki ayrı `span` `flex gap-4`; durum `StatusDot`.
  - normal: `grid grid-cols-[3.5rem_1fr_auto] gap-4 border p-4`: sol tarih bloğu (`<span className="text-xs text-muted-foreground">{gün adı kısa}</span><span className="display-sm tabular-nums">{gün no}</span>` — `formatShopDayShort` zaten "Cmt 11" üretiyor; `time.ts`'e `formatShopDayParts(date, locale): { weekday: string; day: string }` eklenir, birim testi `tests/unit/time.test.ts`'e), orta saat/berber/hizmet, sağ `StatusDot`. "Bugün"/"Yarın" öneki orta blokta `text-primary`.
  - e2e beklentisi `"Bugün ·"` → `"Bugün,"`; `"Yarın ·"` → `"Yarın,"`.
- Giriş/kayıt: `(auth)/layout.tsx`'te `Parallax` ve `Reveal` kalkar, desen sabit; başlıklar `display-lg` cümle düzeni; alanlar `h-11` aynı, köşe değişkenden gelir (`rounded-none` sınıfları kalkar).
- e2e `booking.spec`: `bookingStep` → `page.locator('[data-step="3"]')`; saatler `[data-slots] button`; başlıklar "Yaklaşan randevularım", "Geçmiş"; `"Bugün ·"` → `"Bugün,"`. `i18n.spec` aynı şekilde ("1. Choose a service" → `getByRole("heading", { name: "Service" })`; "UPCOMING APPOINTMENTS" → "Upcoming appointments"; `section:has(h2:text("3. Choose a day and time"))` → `[data-step="3"]`; `div.grid-cols-4 button` → `[data-slots] button`).
- **Review Focus 2** e2e: hizmet ve berber seçip bir saat seçtikten sonra `data-step="1"` özetindeki "Değiştir"e basılır; `[data-step="3"]` kaybolur, hizmet yeniden seçilince berber adımı açılır ve onay düğmesi `toBeDisabled()`.
- Commit: "Randevu sihirbazı: kapanan adımlar, ilerleme göstergesi ve özet kartı".

### Task 5: Panel kabuğu

**Files:**
- Modify: `src/app/[locale]/panel/layout.tsx`, `src/components/panel/PanelNav.tsx`
- Create: `src/components/panel/PanelPage.tsx`
- Test: `tests/e2e/i18n.spec.ts` (panel nav), yeni `tests/e2e/panel.spec.ts`

**Interfaces:**
- `PanelPage({ title, description, action, children, width })` — `width: "default" | "narrow"` (`max-w-5xl` / `max-w-3xl`). Başlık `<h1 className="text-2xl font-semibold tracking-tight">`, açıklama `text-muted-foreground`, `action` sağda (`flex items-start justify-between gap-4`), telefonda `action` başlığın altında (`flex-col sm:flex-row`). İçerik `mt-6 space-y-6`.
- `PanelNav({ isAdmin })` — iki grup: `GROUPS = [{ key: "groupDaily", items: [today, appointments, timeOff, customers] }, { key: "groupManage", admin: true, items: [services, barbers, testimonials, gallery, settings] }]`; `profile` ayrı, en altta. `lg` üstü dikey: grup başlığı `<p className="px-3 pt-4 pb-1 text-xs font-medium text-muted-foreground">`, madde `flex h-10 items-center border-l-2 px-3 text-sm` aktif `border-primary bg-primary/8 font-medium` değilse `border-transparent hover:bg-muted`. `lg` altı: tek yatay kayan şerit (`flex gap-1 overflow-x-auto px-3 py-2`), grup başlıkları gizli, aktif madde `border-b-2 border-primary` (sol çizgi değil).

**Kararlar:**

- `layout.tsx`: `<div className="panel-typography min-h-dvh lg:grid lg:grid-cols-[240px_1fr]">`. `aside` `lg:sticky lg:top-0 lg:h-dvh lg:flex lg:flex-col border-b lg:border-b-0 lg:border-r`. Üst: `BrandMark 20` + `shopName` (`getSettings()` çağrılır) `text-sm font-semibold truncate`, telefonda aynı satırda sağda `ThemeToggle` + çıkış düğmesi (`variant="ghost" size="sm"`). Orta: `PanelNav`. Alt (`lg:mt-auto`): Profilim bağlantısı, kullanıcı adı `text-xs text-muted-foreground truncate`, `LocaleSwitcher`, `ThemeToggle` (lg), çıkış. `main` `px-5 py-6 md:px-8 md:py-8`.
- Panel sayfalarının `h1 text-3xl` → `PanelPage` (Görev 6'da sayfa sayfa). Bu görevde yalnızca `panel/page.tsx` (Bugün) `PanelPage`'e geçer: `title={t("heading", { date })}`.
- e2e `panel.spec.ts`: admin girişi (helper `tests/e2e/booking.spec.ts`'teki giriş adımları `tests/e2e/helpers.ts`'e alınır: `loginAs(page, email, password)`); `/panel`'de `nav` içinde "Günlük iş" ve "Yönetim" grup başlıkları (`getByText`) ve dokuz bağlantı; berber girişiyle (kwame) "Yönetim" yok. Telefonda (varsayılan Pixel 7) grup başlıkları `toBeHidden`, şerit `scrollWidth > clientWidth`. **Review Focus 4:** `page.emulateMedia({ colorScheme: "dark" })` ile `/panel`; aktif bağlantının `background-color` değeri gövde zemininden farklı (`getComputedStyle` karşılaştırması) ve `border-left-color` `--primary` ile aynı.
- `i18n.spec` panel testleri: `nav.getByRole("link", …)` aynı; "Today · " → `/^Today, /`.
- Commit: "Panel kabuğu: gruplanmış menü, sayfa başlığı ve 6 px köşe".

### Task 6: Panel sayfaları

**Files:**
- Modify: `src/app/[locale]/panel/randevular/page.tsx`, `hizmetler/page.tsx`, `berberler/page.tsx`, `berberler/[id]/page.tsx`, `izinler/page.tsx`, `musteriler/page.tsx`, `musteriler/[id]/page.tsx`, `yorumlar/page.tsx`, `galeri/page.tsx`, `ayarlar/page.tsx`, `profil/page.tsx`
- Modify: `src/components/panel/TodayBoard.tsx`, `AppointmentActions.tsx`, `AppointmentsTable.tsx`, `ServiceRow.tsx`, `ServiceForm.tsx`, `BarberForm.tsx`, `WorkingHoursForm.tsx`, `TimeOffForm.tsx`, `TimeOffList.tsx`, `TestimonialForm.tsx`, `TestimonialRow.tsx`, `SettingsForm.tsx`, `ProfileForm.tsx`, `PasswordForm.tsx`, `LanguageForm.tsx`, `I18nField.tsx`, `GalleryCard.tsx`, `GalleryUploader.tsx`, `GalleryTagPicker.tsx`, `ImageUploader.tsx`, `PhotoGrid.tsx`, `PhotoUploadButton.tsx`, `InlinePrice.tsx`, `DeleteButton.tsx`
- Create: `src/components/panel/NewRecordPanel.tsx`, `src/components/panel/ResponsiveTable.tsx`
- Test: `tests/e2e/panel.spec.ts`, `tests/e2e/booking.spec.ts` (panel "Tamamlandı" akışı)

**Interfaces:**
- `NewRecordPanel({ label, title, children })` — istemci bileşeni: kapalıyken `PanelPage.action` olarak `<Button>{t("common.new")} · …</Button>` **değil**, `<Button><Plus /> {label}</Button>`; açıkken içeriğin üstünde `<section className="border border-border p-5">` başlık + "Kapat" düğmesi + `children`. Form `onDone` ile kapatır (`children` bir render fonksiyonu alır: `children: (close: () => void) => React.ReactNode`).
- `ResponsiveTable` — `Table` sarmalayıcısı: `md` altında `[&_thead]:hidden [&_tr]:block [&_tr]:border-b [&_tr]:p-4 [&_td]:block [&_td]:px-0 [&_td]:py-1 [&_td]:whitespace-normal`; her `TableCell` `data-label` alır ve `md` altında `before:content-[attr(data-label)] before:block before:text-xs before:text-muted-foreground` ile etiketini basar.

**Kararlar:**

- **Form kuralı (tüm formlar):** `Field` kullanılır; ızgara `grid gap-4 sm:grid-cols-2`; altlık `<div className="flex justify-end gap-2 sm:col-span-2">` ve birincil düğme `size="default"`; tam genişlik yok. `I18nField`: `FieldShell` → `Field` (`trailing={tabs}`); sekme düğmeleri `h-7 px-2.5 text-xs font-medium` köşe değişkenden, `.label` kalkmış. Hata metni `Field.error` ile.
- **Randevular:** `PanelPage title="Randevular" description={aralık cümlesi}`; filtre `<form className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1fr_auto] lg:items-end">` dört `Field` (Başlangıç, Bitiş, Berber, Durum) + "Uygula" düğmesi (`panel.appointments.filter` değeri "Uygula"/"Apply"/"Appliquer"). Tablo `ResponsiveTable`; durum `StatusDot`; müşteri bağlantısı `font-medium text-foreground hover:underline`, telefon ayrı satır. Yeni anahtarlar `panel.appointments.from/to`: "Başlangıç"/"Bitiş", "From"/"To", "Du"/"Au".
- **Bugün:** `TodayBoard` sütunları `border border-border`; başlık `px-4 py-3 text-base font-medium`; satır `grid grid-cols-[3.25rem_1fr] gap-3 px-4 py-3`: sol saat bloğu (başlangıç `font-medium tabular-nums`, bitiş `text-xs text-muted-foreground`), sağ müşteri bağlantısı + telefon (ayrı satır), hizmet ve tutar iki `span` `flex gap-3 text-sm text-muted-foreground`, `StatusDot`, `AppointmentActions` (`size="sm" variant="outline"` üçü de, tamamlandı `variant="default"`).
- **Hizmetler:** `PanelPage` + `NewRecordPanel label="Yeni hizmet"`; liste `ResponsiveTable` sütunlar Ad, Süre, Fiyat (`InlinePrice`), Sıra, Durum (`Badge variant="outline"` "Pasif" ya da `StatusDot`-benzeri "Aktif" metni), İşlemler (`Düzenle` outline sm, `Pasife al/Aktif et` ghost sm, `DeleteButton` ghost sm destructive). Düzenleme: satırın altında açılan tam genişlik satır (`<tr><td colSpan={6}><ServiceForm initial onDone /></td></tr>`). `DeleteButton` devre dışıysa sebep `title` özniteliğinde ve `aria-describedby` ile; görünür metin yok (satır taşmıyor).
- **Berberler:** `NewRecordPanel label="Yeni berber"`; liste `ResponsiveTable` Fotoğraf+Ad, E-posta, Durum, bağlantı "Düzenle" (`/panel/berberler/[id]`). Detay sayfası: `PanelPage title={ad} action={DeleteButton}` ; iki `section` kenarlıklı, başlık `text-base font-medium`. `WorkingHoursForm` satırı `grid grid-cols-[6rem_1fr_1fr_auto] items-center gap-3`, kutular `Input type="time"` (artık 40 px), onay kutusu `size-4`. "Şifreyi sıfırla" `window.prompt` kalır (davranış değişmez).
- **İzinler:** `NewRecordPanel label="Yeni izin"`; liste satırı `grid grid-cols-[1fr_auto] gap-3 border-b py-3`: berber adı `font-medium`, altında tarih ve saat aralığı iki ayrı `span` (`·` yok), sebep üçüncü satır `text-muted-foreground`; sil düğmesi ghost sm.
- **Müşteriler:** arama `Field` yok, tek `Input` `max-w-md` + `Search` ikonu (`relative` sarmal, `pl-9`); liste `divide-y border` satır `grid grid-cols-[1fr_auto] items-center gap-3 p-4` isim + telefon, sağ "Son: tarih" `text-xs`. Detay: `PanelPage title={ad} description={telefon ve e-posta iki span}`, fotoğraf bölümü `border p-5`, randevular `AppointmentCard` normal varyant.
- **Yorumlar:** `NewRecordPanel label="Yeni yorum"`; satır `border-b py-4 grid gap-2 sm:grid-cols-[1fr_auto]`: ad + yıldızlar (`Star` ikonlarıyla `text-primary`, `★` karakteri kalkar), metin `text-sm text-muted-foreground line-clamp-2`; eylemler sağda. `TestimonialForm` `Field` düzeni, puan `Select` 1–5.
- **Galeri:** `PanelPage title description={counts}`; yükleyici `section border p-5`; kart `border p-4 grid gap-3`; fotoğraf köşesiz; `I18nTextField` + `GalleryTagPicker` (`Field`); eylem satırı `flex items-center gap-1`: `Save` default sm, pasif/aktif ghost sm, yukarı/aşağı `size="icon-sm" variant="outline"` `ArrowUp/ArrowDown` ikonları (`↑`/`↓` metni kalkar, `aria-label` kalır), sağda `DeleteButton` ghost sm. Çipler `h-8 px-3 text-xs` köşe değişkenden.
- **Ayarlar:** `PanelPage width="narrow"` → aslında bölümler iki sütun istediği için `width="default"` ve `max-w-4xl`. Dört bölüm `<section className="grid gap-6 border-t border-border py-8 md:grid-cols-12">`: sol `md:col-span-4` `h2 text-base font-medium` + `p text-sm text-muted-foreground`; sağ `md:col-span-8 grid gap-4 sm:grid-cols-2`. Bölümler ve alanları: **Dükkan** (ad, adres, telefon, e-posta); **Randevu kuralları** (iptal sınırı, en erken randevu, slot adımı `Select`, berbere e-posta onay kutusu); **Bağlantılar** (Instagram, Facebook, WhatsApp, harita); **Site metinleri** (hakkımızda başlığı/metni, memnuniyet, deneyim, üç "neden biz" çifti). Yeni anahtarlar `panel.settings.rulesLegend`: "Randevu kuralları"/"Booking rules"/"Règles de réservation"; `linksLegend`: "Bağlantılar"/"Links"/"Liens"; bölüm açıklamaları `shopHint`, `rulesHint`, `linksHint`, `contentHint` (birer cümle, üç dil). Altlık: `<div className="sticky bottom-0 -mx-5 border-t bg-background/95 px-5 py-3 backdrop-blur md:-mx-8 md:px-8"><div className="flex justify-end">Kaydet</div></div>`. `i18nField.hint` yalnızca Site metinleri bölümünün açıklamasında.
- **Profil:** `PanelPage width="narrow"`; üç `section border-t py-8` (Bilgiler, Dil, Şifre) iki sütun düzeniyle Ayarlar gibi.
- **Review Focus 3** e2e: admin girişi, `/panel/randevular`, Pixel 7'de `thead` `toBeHidden`, ilk satırda `getByText("Durum")` etiketi ve "Planlandı" metni görünür, `scrollWidth <= viewport`.
- `booking.spec` panel akışı: `page.locator("li").filter({ hasText: customer.name })` → `page.locator("[data-appointment]").filter(...)` (TodayBoard satırına `data-appointment={a.id}`).
- Commit: "Panel sayfaları: alan düzeni, listeler önce, tablolar telefonda kart".

### Task 7: Son kontrol: görsel doğrulama, README ve spec durumu

**Files:**
- Modify: `README.md` (Tasarım bölümü: iki yazı tipi, köşe kuralı, mobil öncelik), `docs/superpowers/specs/2026-10-06-tasarim-yenileme-design.md` (Durum: Uygulandı)
- Test: tüm paketler

**Kararlar:**

- `npm run lint && npm run typecheck && npm test && npm run test:integration && npx playwright test` yeşil.
- Playwright ile (scratchpad betiği) 390 px ve 1440 px, açık ve koyu: `/`, `/randevu` (3. adım açık), `/randevularim`, `/giris`, `/panel`, `/panel/randevular`, `/panel/hizmetler`, `/panel/ayarlar`. Her görüntü gözle: sol kenarlar hizalı, taşma yok, büyük harf yalnızca hero/altbilgi/giriş paneli, `·` yok, Bebas yok (`document.fonts` listesinde "Bebas" geçmez: e2e `seo.spec`'e ya da `nav.spec`'e tek satır).
- Hero kontrastı: kum metin / fotoğrafın en açık pikseli 390 ve 1440'ta ≥ 4.5:1 (mevcut ölçüm yöntemi, `hero-scrim` değişmedi).
- Lighthouse (`npx lighthouse http://localhost:3000 --preset=desktop --quiet`) performans ≥ önceki (85).
- README "Tasarım" alt bölümü: yazı tipleri, köşe kuralı, hareket kuralı, mobil öncelik, `Field`/`PanelPage`/`SiteNav` kullanımı; "Bebas" ve "label" geçen cümleler kaldırılır.
- Commit: "Tur 8 son kontrol: görsel doğrulama ve README".

---

## Self-review notları

- Spec §3.1 her satırı Görev 1–2'de; §3.2 Görev 3; §3.3 Görev 4; §3.4 Görev 5–6; §5 Görev 7 ve her görevin test satırlarında.
- Adlar tutarlı: `Field`, `Select`, `StatusDot`, `PanelPage`, `NewRecordPanel`, `ResponsiveTable`, `StepIndicator`, `StepSummary`, `BookingSummary`, `SiteNav({ variant, hideBook })`, `formatShopDayParts`.
- Review Focus 1→Görev 2, 2→Görev 4, 3→Görev 6, 4→Görev 5, 5→Görev 1.
