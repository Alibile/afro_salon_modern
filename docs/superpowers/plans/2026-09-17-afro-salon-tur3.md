# Afro Salon Modern — Tur 3 Implementation Plan (erkek odaklı içerik, modern galeri, tipografi + parallax)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Siteyi yalnızca erkeklere hizmet veren bir berber olarak konumlandırmak (fotoğraf ve metin), panelden yönetilen modern bir galeri (masonry, etiket filtresi, lightbox, "daha fazla göster") eklemek ve ana sayfaya editoryal tipografi + parallax/scroll animasyonları vermek.

**Architecture:** Mevcut yapı korunur: `src/actions/impl/*` (mantık, `actor`) + ince `"use server"` wrapper; Prisma 7 migration; R2 presign (`kind: "gallery"` eklenir); landing bileşenleri `src/components/landing/`. Animasyon için `motion` (v13, `motion/react`) eklenir; yalnızca `transform`/`opacity` animasyonları; `prefers-reduced-motion` ile tüm hareket kapanır. Panel görsel dili değişmez.

**Tech Stack:** aynı + `motion`.

**Spec:** `docs/superpowers/specs/2026-09-17-afro-salon-randevu-design.md` (§6) + bu plan. Tur 1/2 Global Constraints aynen geçerli (wrapper'lar `actor`/`now` almaz; yeni wrapper'lar `authorization.test.ts`'e eklenir; fotoğraflar yalnızca Unsplash/Pexels lisanslı ve `CREDITS.md`'de; opaklık ≤ 0.12; Türkçe; commit'lerde AI ibaresi yok).

---

### Task 1: Erkek odaklı içerik ve fotoğraflar

**Files:** `public/landing/*.jpg` (değişenler), `public/landing/CREDITS.md`, `prisma/seed.ts` (metinler, ikinci berber adı/e-postası), `src/components/landing/Hero.tsx` (manşet/alt metin), `src/components/landing/*` içindeki sabit metinler, `README.md` (seed hesapları).

**Kararlar:**
- Kadın model içeren dosyalar erkek afro kesim/fade/örgü/twist/sakal fotoğraflarıyla değiştirilir: kesin olarak `team-1.jpg` (Amara, kadın örgü), `gallery-8.jpg` ("smiling black girl"), `gallery-7.jpg` ("redhead with afro"); diğer tüm dosyalar uygulayıcı tarafından açılıp kontrol edilir (Read ile görsel bak), kadın/çocuk içerenler de değiştirilir. Kaynak: Pexels/Unsplash; boyut/kalite kuralları Tur 2 ile aynı (≤ 400 KB, uzun kenar ≤ 1600).
- Seed: "Amara Diallo" → "Yusuf Adeyemi", e-posta `yusuf@afrosalon.local`, bio "Örgü, twist ve line-up". Seed idempotent: eski `amara@afrosalon.local` kaydı varsa adı/e-postası güncellenmez (gerçek verilere dokunma); README seed hesaplarını günceller. Test DB temizlendiği için e2e etkilenmez (`booking.spec` "Kwame Mensah" kullanıyor).
- Metinler: hero manşet erkek berber dili ("Kıvrımın kendi geometrisi var." kalabilir), alt metin "Erkeklere özel afro kesim, fade, örgü ve twist — hepsi bugünün içinde."; `aboutText` seed'de "erkeklere özel" ibaresi; hizmet adları aynı. Cinsiyet kısıtı kodlanmaz.
- Doğrulama: `npm run build`, integration, e2e. Commit: "Erkek odaklı içerik ve fotoğraflar".

---

### Task 2: Modern galeri (panelden yüklenen, masonry, etiket filtresi, lightbox)

**Files:** `prisma/schema.prisma` (+migration `gallery`), `prisma/seed.ts` (8 stok fotoğraf `landing/gallery-N.jpg` etiketlerle), `src/schemas/gallery.ts`, `src/actions/impl/gallery.ts`, `src/actions/gallery.ts`, `src/lib/queries/gallery.ts`, `src/lib/storage.ts` (`kind: "gallery"`), `src/app/api/upload/presign/route.ts` (kind enum), `src/app/panel/galeri/page.tsx`, `src/components/panel/{GalleryUploader,GalleryCard}.tsx`, `PanelNav.tsx` ("Galeri", admin), `src/components/landing/GallerySection.tsx` (yeniden), `src/components/landing/gallery/{MasonryGrid,GalleryFilters,Lightbox}.tsx`, `src/lib/gallery-utils.ts`, tests.

**Model:** `GalleryPhoto { id, storageKey String, caption String @default(""), tags String[] @default([]), width Int, height Int, sortOrder Int @default(0), isActive Boolean @default(true), createdAt timestamptz }`.

**Action'lar (ADMIN):** `addGalleryPhotosAs(actor, items: {storageKey,width,height}[])` (çoklu; storageKey `^gallery\/[0-9a-f-]{36}\.(jpg|jpeg|png|webp)$` veya `^landing\/gallery-\d+\.jpg$`), `updateGalleryPhotoAs(actor, id, {caption, tags, sortOrder, isActive})` (tags: 1–6 etiket, her biri 2–20 karakter, trim, tekilleştir), `deleteGalleryPhotoAs(actor, id)` (R2 sil; `landing/` hariç), `moveGalleryPhotoAs(actor, id, "up"|"down")`. Wrapper'lar + `authorization.test.ts`.

**Panel `/panel/galeri`:** çoklu dosya seçimi → her dosya için tarayıcıda `Image` ile width/height okunur, presign PUT (`kind: "gallery"`), sonra tek `addGalleryPhotos` çağrısı; kartlarda küçük önizleme, başlık, etiket girişi (virgülle), yukarı/aşağı, aktif/pasif, Sil (`DeleteButton`).

**Landing galeri:** `getGalleryData()` → aktif fotoğraflar (sortOrder, sonra createdAt desc) + tüm etiketler. `MasonryGrid` (CSS `columns-2 md:columns-3 xl:columns-4`, `break-inside-avoid`, oran korunur, hover'da `scale-[1.02]` ve alt şerit başlık), `GalleryFilters` ("Tümü" + etiketler; seçili etiket URL `?etiket=`), sayfalama 12/12 "Daha fazla göster", `Lightbox` (radix `Dialog` tabanlı; önceki/sonraki, ←/→/Esc, dokunmatik kaydırma (pointer events), "n / N", başlık + etiketler, odak yönetimi, `next/image` büyük boy). DB boşsa mevcut desen yer tutucu.
- `src/lib/gallery-utils.ts`: `filterByTag(photos, tag)`, `paginate(list, page, size)`, `nextIndex/prevIndex` — birim test.
- e2e: filtre tıkla → görünen kart sayısı değişir; kart tıkla → lightbox açılır, → ile sayaç "2 / N", Esc kapatır.
- Commit: "Modern galeri: panel yükleme, masonry, filtre, lightbox".

---

### Task 3: Tipografi ve parallax/scroll animasyonları (ana sayfa)

**Files:** `src/app/layout.tsx` (fontlar), `src/app/globals.css` (tip ölçeği, `--font-*`), `src/components/landing/*` (Hero, WhyUs stats, Services, Gallery, SiteNav), `src/components/motion/{Reveal,Parallax,CountUp,MotionProvider}.tsx`, `src/app/(auth)/layout.tsx` (sol panel), tests (unit: reduced-motion yardımcıları), README (motion notu).

**Kararlar:**
- Fontlar (next/font/google, `latin`+`latin-ext`): başlık `Fraunces` (opsz, italik; zaten var) ana display olur, `Bebas Neue` yalnızca küçük kapital etiketlerde kalır; gövde `Manrope`. `--font-display: Fraunces`, `--font-sans: Manrope`, `--font-label: Bebas`. Tip ölçeği: manşet `clamp(3rem, 8vw, 7rem)`, satır aralığı 0.95, küçük kapital etiketler `tracking-[0.2em] uppercase`.
- `motion` paketi (`motion/react`): `MotionProvider` (`MotionConfig reducedMotion="user"`), `Reveal` (whileInView fade-up, once, stagger), `Parallax` (`useScroll` + `useTransform`, yalnızca `y` translate, aralık ±40px), `CountUp` (whileInView sayaç, `useMotionValue`+`animate`). Yalnızca `/` ve auth sol paneli; panel ve randevu akışı hareketsiz.
- Hero: desen ve fotoğraf farklı hızlarda parallax; manşet satırları stagger; CTA gecikmeli. Navbar: `useScroll` ile 80px sonra `py` küçülür, zemin opaklığı artar. İstatistikler `CountUp`. Hizmet satırları stagger. Galeri kartları `Reveal`. Bölüm başlıkları fade-up.
- Erişilebilirlik/performans: `prefers-reduced-motion` → hareket yok (unit test: `MotionConfig reducedMotion="user"` ayarı ve `Reveal` fallback'i); sadece transform/opacity; CLS yok (rezerve boyutlar); dev'de Lighthouse performans ≥ 85 mobil (rapora yaz).
- Ekran görüntüleri + kısa GIF/video: Playwright ile kaydırma sırasında 4 kare (0, 600, 1200, 1800 px) ve `playwright screenshot` ile navbar küçülmüş hali.
- Commit: "Editoryal tipografi ve parallax animasyonlu ana sayfa".

---

### Task 4: Son kontrol
- README: galeri paneli, motion notu, seed hesapları; `npm run typecheck && lint && test && test:integration && build && test:e2e` sıralı. Commit: "Tur 3 son kontrol ve dokümantasyon".
