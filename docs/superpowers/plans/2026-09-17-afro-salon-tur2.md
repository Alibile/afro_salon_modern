# Afro Salon Modern — Tur 2 Implementation Plan (landing içerik, CRUD, profil)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Landing page'i referans sitenin içerik yapısına (navbar, hakkımızda, neden biz, yorumlar, iletişim formu, sosyal medya) kavuşturmak; ücretsiz lisanslı stok fotoğraflarla doldurmak; hizmet/berber için kalıcı silme, listeden hızlı fiyat düzenleme ve berberin kendi profilini düzenlemesini eklemek.

**Architecture:** Mevcut Next.js 16 + Prisma 7 yapısı korunur. İçerik `Settings` satırına yeni alanlar ve yeni `Testimonial` modeliyle panelden düzenlenebilir olur. Tüm yazma işlemleri Tur 1'deki kalıpla yapılır: `src/actions/impl/*.ts` (mantık, `actor: SessionUser` parametresi) + `src/actions/*.ts` ince `"use server"` wrapper (oturumdan kimlik, `revalidatePath`). Landing bileşenleri `src/components/landing/` altında; görsel dil (editoryal, toprak tonları, AfroPattern) değişmez.

**Tech Stack:** aynı (Next 16, Prisma 7, Auth.js, Tailwind 4, shadcn radix, Resend, Vitest, Playwright).

**Spec:** `docs/superpowers/specs/2026-09-17-afro-salon-randevu-design.md` (§5, §6) + bu plandaki kararlar. Referans içerik yapısı: afrohaircutistanbul.webflow.io (yalnızca bölüm/menü yapısı; görsel dil kopyalanmaz).

## Global Constraints

- Tur 1 Global Constraints aynen geçerli (Next 16, Prisma 7, JWT, `ActionResult`, Türkçe metin, commit'lerde AI ibaresi yok, `.env` commit'lenmez).
- **Yetki:** hiçbir `"use server"` wrapper `actor`/`customerId`/`now` almaz; kimlik `getSessionUser()` ile. Yeni her wrapper `tests/integration/authorization.test.ts` listesine eklenir (anonim → "Yetkiniz yok"/"Giriş yapmalısınız", CUSTOMER → "Yetkiniz yok").
- **Fotoğraflar:** yalnızca Unsplash Lisansı veya Pexels Lisansı (ticari kullanım serbest) altındaki fotoğraflar; her dosya için kaynak URL ve fotoğrafçı `public/landing/CREDITS.md`'ye yazılır. Pinterest veya lisansı belirsiz kaynak KULLANILMAZ. Dosyalar ≤ 400 KB (sıkıştırılmış JPEG, uzun kenar ≤ 1600 px).
- Panel görsel dili (nötr shadcn) değişmez; landing editoryal dil ve `AfroPattern` korunur; opaklık ≤ 0.12.
- Migration'lar `prisma migrate dev --name <ad>` ile eklenir (init migration değişmez); test DB'ye `db:migrate:test`.

## Dosya Yapısı (yeni/değişen)

```
public/landing/hero.jpg, about.jpg, gallery-1..8.jpg, team-1.jpg, team-2.jpg, CREDITS.md
prisma/schema.prisma            Settings alanları + Testimonial modeli; migration
prisma/seed.ts                   varsayılan içerik metinleri, 3 örnek yorum, seed berber fotoğrafları team-*.jpg
src/schemas/settings.ts          yeni alanlar; src/schemas/testimonial.ts; src/schemas/contact.ts; src/schemas/profile.ts
src/actions/impl/{testimonials,contact,profile,services,barbers}.ts  + wrapper'lar
src/lib/queries/landing.ts       testimonials + settings içerik alanları
src/lib/email/templates/ContactMessage.tsx, send.ts → sendContactMessage
src/components/landing/{SiteNav,AboutSection,WhyUsSection,TestimonialsSection,ContactForm}.tsx (+ mevcutlar güncellenir)
src/app/panel/yorumlar/page.tsx, src/app/panel/profil/page.tsx
src/components/panel/{TestimonialForm,TestimonialRow,ProfileForm,PasswordForm,DeleteButton,InlinePrice}.tsx
tests/integration/{testimonials,contact,profile,delete}.test.ts, authorization.test.ts (genişler), unit: contact schema
```

---

### Task 1: Ücretsiz lisanslı stok fotoğraflar ve slot eşlemesi

**Files:** Create `public/landing/*.jpg`, `public/landing/CREDITS.md`; Modify `src/components/brand/ImageSlot.tsx` (gerekirse), `src/lib/queries/booking.ts`/seed (berber `photoKey` → `landing/team-1.jpg`, `landing/team-2.jpg`), `README.md` (Fotoğraflar bölümü).

**Interfaces:** Slot adları sabit: `hero.jpg` (dikey 4:5), `about.jpg` (yatay 3:2), `gallery-1.jpg … gallery-8.jpg` (kare), `team-1.jpg`, `team-2.jpg` (kare, portre). `ImageSlot` mevcut sözleşmesiyle çalışır; dosya varsa `next/image`, yoksa desen.

- [ ] Unsplash'ta (WebSearch/WebFetch ile) "afro hairstyle", "black barber fade", "braids", "twist hairstyle", "barbershop" aramalarıyla 12 fotoğraf seç; `https://unsplash.com/photos/<slug>/download?force=true&w=1600` ile indir. Pexels alternatif (`images.pexels.com/photos/<id>/pexels-photo-<id>.jpeg?auto=compress&w=1600`). İndirme başarısız olursa başka fotoğraf seç; hiç indirilemiyorsa BLOCKED raporla.
- [ ] `sips` ile boyutlandır/kırp (`sips -Z 1600`, kare olanlar `-c`), JPEG kalite ~80; her dosya ≤ 400 KB.
- [ ] `CREDITS.md`: tablo (dosya · fotoğrafçı · kaynak URL · lisans).
- [ ] Seed berberlerinin `photoKey`'i `landing/team-1.jpg` / `landing/team-2.jpg` olsun (publicUrl → `/landing/team-1.jpg`); `public/seed/` ve `seed/` özel durumu (`startsWith("seed/")`) `landing/` için de geçerli olacak şekilde `impl/barbers.ts`'de koşulu `!existing.photoKey.startsWith("seed/") && !existing.photoKey.startsWith("landing/")` yap; `public/seed` klasörünü sil.
- [ ] Galeri: DB'de fotoğraf yoksa `gallery-N.jpg` slotları gösterilir (mevcut davranış) — doğrula.
- [ ] Doğrula: `npm run build`, dev'de `curl -sI localhost:3000/landing/hero.jpg` 200; `npm run test:integration`. Commit: "Ücretsiz lisanslı stok fotoğraflar", push.

---

### Task 2: Landing içerik modeli — Settings alanları, Testimonial, panel CRUD

**Files:** `prisma/schema.prisma` (+migration `landing_content`), `prisma/seed.ts`, `src/schemas/settings.ts`, `src/schemas/testimonial.ts`, `src/actions/impl/testimonials.ts`, `src/actions/testimonials.ts`, `src/actions/impl/settings.ts` (yeni alanlar), `src/components/panel/SettingsForm.tsx`, `src/app/panel/yorumlar/page.tsx`, `src/components/panel/TestimonialForm.tsx`, `TestimonialRow.tsx`, `PanelNav.tsx` ("Yorumlar", admin), tests.

**Interfaces:**
- `Settings` yeni alanlar (hepsi `String @default("")` aksi belirtilmedikçe): `email`, `instagram`, `facebook`, `whatsapp` (uluslararası format, örn. 905550000000), `aboutTitle` (default "Benzersiz bir deneyim"), `aboutText` (`@db.Text`), `whyUs1Title`, `whyUs1Text`, `whyUs2Title`, `whyUs2Text`, `whyUs3Title`, `whyUs3Text`, `satisfactionPercent Int @default(99)`, `yearsExperience Int @default(10)`, `mapsUrl`.
- `model Testimonial { id, name String, text String @db.Text, rating Int (1-5), isActive Boolean @default(true), sortOrder Int @default(0), createdAt DateTime @db.Timestamptz(3) @default(now()) }`.
- `testimonialSchema = { name (2-60), text (10-400), rating int 1-5, sortOrder int ≥0 }`.
- impl: `upsertTestimonialAs(actor, input & {id?})`, `toggleTestimonialAs(actor, id, isActive)`, `deleteTestimonialAs(actor, id)` — sadece ADMIN; wrapper'lar `upsertTestimonial(input)`, `toggleTestimonial(id, isActive)`, `deleteTestimonial(id)`; `revalidatePath("/")` + `/panel/yorumlar`.
- `settingsSchema` yeni alanları içerir: `email: z.email().or(z.literal(""))`, `instagram/facebook/mapsUrl: z.url().or(z.literal(""))` (Instagram için kullanıcı adı da kabul: `@` ile başlıyorsa `https://instagram.com/<ad>`'a normalize), `whatsapp: /^\d{10,15}$/ or ""`, metinler max 500, `satisfactionPercent 0-100`, `yearsExperience 0-100`.
- Seed: Türkçe varsayılan içerik (aboutText 2-3 cümle, whyUs 3 madde: "Usta berberler", "Premium ürünler", "Hijyen ve temizlik"), 3 örnek yorum (isActive true, isimler Türkçe/İngilizce karışık makul).

- [ ] TDD: `tests/integration/testimonials.test.ts` (admin upsert/toggle/delete, BARBER → "Yetkiniz yok", silme sonrası count 0). Settings testine yeni alanlar (geçersiz whatsapp reddi, instagram `@ad` normalize).
- [ ] Migration + generate + test DB migrate; seed güncelle ve çalıştır.
- [ ] Panel: `/panel/ayarlar` formu iki bölüm: "Dükkan" (mevcut) ve "Site içeriği" (yeni alanlar, textarea'lar). `/panel/yorumlar`: liste (ad, puan yıldız, metin özeti, aktif), ekle/düzenle formu, aktif/pasif, "Sil" (onay penceresi — shadcn `alert-dialog` ekle: `npx shadcn@latest add alert-dialog`, metinler Türkçe: "Silinsin mi?", "Vazgeç", "Sil").
- [ ] authorization.test.ts'e üç yeni wrapper eklenir.
- [ ] Doğrula (typecheck, lint, unit, integration, build). Commit: "Landing içerik alanları ve müşteri yorumları", push.

---

### Task 3: Landing bölümleri, navbar, iletişim formu

**Files:** `src/components/landing/SiteNav.tsx` (yeni), `AboutSection.tsx`, `WhyUsSection.tsx`, `TestimonialsSection.tsx`, `ContactForm.tsx`, `ContactSection.tsx` (güncelle), `SiteFooter.tsx` (sosyal ikonlar), `Hero.tsx` (hero.jpg slotu zaten), `src/app/(musteri)/page.tsx`, `src/lib/queries/landing.ts`, `src/schemas/contact.ts`, `src/actions/impl/contact.ts`, `src/actions/contact.ts`, `src/lib/email/templates/ContactMessage.tsx`, `src/lib/email/send.ts` (`sendContactMessage`), `src/lib/rate-limit.ts` (bellek içi, IP+dakika), tests.

**Interfaces:**
- Navbar: landing'de `SiteHeader` yerine `SiteNav` (yalnızca `/`): sol logo/salon adı; orta bağlantılar `#hakkimizda`, `#hizmetler`, `#ekip`, `#galeri`, `#yorumlar`, `#iletisim` (metinler: Hakkımızda, Hizmetler, Ekip, Galeri, Yorumlar, İletişim); sağda tema anahtarı + giriş/randevularım/panel durumuna göre bağlantı + "Randevu al" (`/randevu`). Mobilde hamburger (client component, `aria-expanded`, Escape ile kapanır). Bölüm `<section id=...>` ve `scroll-margin-top`.
- Bölüm sırası: Hero → Hakkımızda (aboutTitle/aboutText + `about.jpg` slotu, asimetrik 5/7 grid) → Hizmetler → Neden Biz (3 madde + iki büyük istatistik `%99` / `10+ yıl`, display tipografi) → Ekip → Galeri → Yorumlar (aktif yorumlar, puan yıldızları, editoryal alıntı stili, 3 sütun/mobil 1) → İletişim → Footer.
- İletişim: sol: adres, tıklanabilir telefon, e-posta, WhatsApp bağlantısı (`https://wa.me/<whatsapp>?text=...`), harita bağlantısı (`mapsUrl` veya adresle Google Maps araması), haftalık saatler (mevcut). Sağ: form — ad (2-60), telefon (opsiyonel, max 20), mesaj (10-1000), ilgilenilen hizmetler (aktif hizmetlerden checkbox), honeypot alanı (`website`, doluysa sessizce ok döner). `contactSchema` Zod.
- `sendContactMessageAs(input, ip)` impl: rate limit (IP başına dakikada 3; `src/lib/rate-limit.ts` bellek içi Map, TTL), e-posta `settings.email` (boşsa `EMAIL_FROM`'a) → `ActionResult<void>`; e-posta gönderimi test/env yoksa `[email:skipped]`. Wrapper `sendContactMessage(input)` `headers()`'dan `x-forwarded-for` alır. Bu wrapper anonim çağrıya AÇIKTIR (yetki testi listesine "public" olarak işaretlenir, yetki kontrolü beklenmez).
- Footer: salon adı, bölüm bağlantıları, sosyal ikonlar (lucide `Instagram`, `Facebook`, `MessageCircle` WhatsApp) yalnızca alan doluysa; mevcut giriş/panel bağlantıları korunur.

- [ ] TDD: unit `tests/unit/schemas-contact.test.ts` (honeypot, uzunluklar); integration `tests/integration/contact.test.ts` (rate limit 4. istekte "Çok fazla deneme, lütfen biraz sonra tekrar deneyin"; e-posta çağrısı `vi.mock("@/lib/email/send")` ile doğrulanır).
- [ ] `getLandingData` yorumları ve yeni settings alanlarını döner; landing testine yorumlar assert'i.
- [ ] Bileşenler; `page.tsx` yeni sırayla; `(musteri)/layout.tsx`'de `/` için `SiteHeader` gizlenir (SiteNav landing içinde render edilir) — mevcut `usePathname` mantığını kullan.
- [ ] Ekran görüntüleri (system Chrome, 390 ve 1440, light+dark) `.superpowers/sdd/<plan>/shots/`.
- [ ] Doğrula + e2e (`npm run test:e2e`, landing'deki "Bugün randevu al" bağlantısı hero'da kalır). Commit: "Landing: navbar, hakkımızda, neden biz, yorumlar, iletişim formu", push.

---

### Task 4: Kalıcı silme (hizmet, berber) ve listeden hızlı fiyat

**Files:** `src/actions/impl/services.ts` (`deleteServiceAs`), `src/actions/services.ts` (`deleteService`), `src/actions/impl/barbers.ts` (`deleteBarberAs`), `src/actions/barbers.ts` (`deleteBarber`), `src/components/panel/DeleteButton.tsx` (alert-dialog), `ServiceRow.tsx` (Sil + `InlinePrice`), `src/components/panel/InlinePrice.tsx`, `src/app/panel/berberler/[id]/page.tsx` (Sil), `src/lib/queries/services.ts`/`barbers.ts` (silinebilirlik bilgisi), tests.

**Interfaces:**
- `deleteServiceAs(actor, id)`: ADMIN; `appointmentService.count({ serviceId })` > 0 → `fail("Bu hizmet geçmiş randevularda kullanılmış, silinemez; pasife alın")`; yoksa `service.delete`. `listServicesForAdmin()` her satıra `usageCount` ekler; UI'da "Sil" butonu `usageCount>0` ise disabled + tooltip/metin.
- `deleteBarberAs(actor, id)`: ADMIN; `appointment.count({ barberId })` > 0 veya `haircutPhoto.count({ barberId })` > 0 → `fail("Bu berberin randevu veya fotoğraf geçmişi var, silinemez; pasife alın")`; yoksa transaction: workingHours/timeOff deleteMany, barber.delete, user.delete; R2 profil fotoğrafı `deleteObject` (seed/landing anahtarları hariç). Admin kendi berber kaydını silemez (varsa) — gerekmez, sadece rol kontrolü.
- `InlinePrice`: fiyat metnine tıklayınca `input type=number step=0.01` açılır; Enter/blur → `upsertService({ id, name, durationMinutes, priceLira, sortOrder })` (mevcut alanlarla), Esc iptal; kaydederken devre dışı; toast "Fiyat güncellendi".
- `DeleteButton({ onConfirm, title, description, disabled, disabledReason })` alert-dialog ile.

- [ ] TDD: `tests/integration/delete.test.ts` (hizmet kullanılmış → red; kullanılmamış → silinir; berber randevulu → red; temiz berber → user+barber+hours silinir; BARBER → "Yetkiniz yok"). authorization.test.ts'e iki wrapper.
- [ ] UI; doğrula; Commit: "Hizmet ve berber silme, listeden hızlı fiyat", push.

---

### Task 5: Berberin kendi profili (`/panel/profil`)

**Files:** `src/schemas/profile.ts`, `src/actions/impl/profile.ts` (`updateOwnProfileAs(actor, input)`, `changeOwnPasswordAs(actor, { currentPassword, newPassword })`), `src/actions/profile.ts`, `src/app/panel/profil/page.tsx`, `src/components/panel/ProfileForm.tsx`, `PasswordForm.tsx`, `PanelNav.tsx` ("Profilim", tüm personel), tests.

**Interfaces:**
- `profileSchema = { name (3-80), phone (max 20, opsiyonel), bio (max 200, opsiyonel), photoKey (min 1) }`; BARBER ve ADMIN kullanabilir; ADMIN'in Barber kaydı yoksa `bio`/`photoKey` alanları gösterilmez ve şemada opsiyonel olur (`profileSchema` iki varyant: `barberProfileSchema`, `userProfileSchema`).
- `updateOwnProfileAs`: `actor.id` ile `user.update({ name, phone })`; `actor.barberId` varsa `barber.update({ bio, photoKey })` ve eski R2 fotoğrafı silme (seed/landing hariç). Aktif/pasif, çalışma saatleri, rol DOKUNULMAZ.
- `changeOwnPasswordAs`: `bcrypt.compare(currentPassword)` yanlışsa `fail("Mevcut şifre hatalı")`; yeni şifre min 8; hash cost 10.
- Wrapper'lar oturumdan `actor`; `revalidatePath("/panel/profil")` ve `/` (ekip kartı adı değişebilir).

- [ ] TDD: `tests/integration/profile.test.ts` (barber kendi adını/bio'sunu günceller; başka kullanıcının kaydı etkilenmez; yanlış mevcut şifre red; doğru şifre değişir ve compare true; CUSTOMER → "Yetkiniz yok"). authorization.test.ts'e iki wrapper.
- [ ] Sayfa/formlar (ImageUploader kind "barber"); doğrula; Commit: "Berber kendi profilini düzenler", push.

---

### Task 6: Son kontrol ve dokümantasyon

- [ ] README: yeni panel sayfaları (Yorumlar, Profilim), site içeriği ayarları, iletişim formu (Resend, `settings.email`), fotoğraf lisansı notu (`CREDITS.md`).
- [ ] `npm run typecheck && npm run lint && npm test && npm run test:integration && npm run build && npm run test:e2e` sıralı; e2e'ye landing navbar bağlantısı testi (Hakkımızda tıkla → `#hakkimizda` görünür) eklenir.
- [ ] Commit: "Tur 2 dokümantasyon ve son kontrol", push.
