# Afro Salon Modern

Tek bir afro berber salonu için aynı gün randevu sistemi. Next.js 16 + Prisma 7 + PostgreSQL.

## Başlangıç / Geliştirme

```bash
cp .env.example .env        # AUTH_SECRET'ı openssl rand -base64 32 ile üret
docker compose up -d
npm install
npm run db:migrate
npm run db:seed             # Seed hesapları: admin@afrosalon.local, kwame@afrosalon.local, yusuf@afrosalon.local; şifre SEED_PASSWORD (varsayılan: Sifre123!)
npm run dev
```

http://localhost:3000 adresinde açılır.

## Rotalar

- `/` — landing page
  - `#hakkimizda` — Hakkımızda bölümü
  - `#hizmetler` — Hizmetler bölümü
  - `#ekip` — Ekip bölümü
  - `#galeri` — Galeri bölümü
  - `#yorumlar` — Müşteri yorumları bölümü
  - `#iletisim` — İletişim formu bölümü
- `/randevu` — 3 adımlı randevu akışı (hizmet → berber → saat)
- `/randevularim` — müşterinin bugünkü ve geçmiş randevuları
- `/panel` — berber ve admin paneli

## Panel Sayfaları

- `/panel/randevular` — tüm randevular (berber zamanlaması)
- `/panel/izinler` — berber izinleri (barber)
- `/panel/musteriler` — tüm müşteriler (admin)
- `/panel/hizmetler` — hizmet listesi, fiyat ve süre (sıralamadan sil/düzenle; hard delete kuralı: geçmiş randevusu olan hizmetler sadece pasifleştirilebilir). Fiyat için satır içi düzenleme: listede fiyata tıklayıp yeni değeri yazıp Enter'a basmak yeterli; Esc vazgeçer, alan boş bırakılırsa kayıt yapılmaz
- `/panel/berberler` — berber listesi (sıralamadan sil/düzenle; hard delete kuralı: geçmiş randevusu olan berberler sadece pasifleştirilebilir)
- `/panel/galeri` — galeri fotoğrafları (admin): çoklu dosya yükleme, başlık/etiket yönetimi, sıralama (yukarı/aşağı), aktif/pasif geçişi, silme
- `/panel/profil` — kendi profil bilgileri ve şifre değişimi (tüm personel)
- `/panel/yorumlar` — müşteri yorumları yönetimi: ekle/düzenle/aktif-pasif geçişi (admin)
- `/panel/ayarlar` — salon ve site içeriği ayarları (admin)

## İçerik yönetimi (Site ayarları)

Panelden `/panel/ayarlar` sayfasında aşağıdaki bilgiler düzenlenebilir:

**Salon bilgileri:**
- Salon adı, adres, telefon
- Randevu iptali için gerekli ön bildirim (dakika)
- Minimum önceden randevu alma süresi (dakika)
- Saat aralığı adımı (dakika)
- Zaman dilimi
- Berber bilgisi hakkında bildirim

**Site içeriği:**
- E-posta (iletişim formu gönderimler için; boşsa `EMAIL_FROM` kullanılır)
- İnstagram, Facebook, WhatsApp (sosyal medya bağlantıları; boşsa gösterilmez)
- "Hakkımızda" başlığı ve metni (wysiwyg-style textarea)
- "Neden biz" — 3 madde (başlık + metin)
- Müşteri memnuniyet yüzdesi (istatistik)
- İşletme deneyim yılı (istatistik)
- Google Harita URL'si

## İletişim Formu

Landing page'deki iletişim formundan (`#iletisim`) gelen mesajlar:
- Doğrulama: ad (2-60 karakter), telefon (opsiyonel), mesaj (10-1000 karakter), honeypot alan (`website`)
- Rate limit: IP başına dakikada 3 istek, ek olarak tüm form için saatte 60 istek (hafıza içi)
- IP anahtarı sırayla `x-vercel-forwarded-for`, `x-real-ip` ve `x-forwarded-for`'un **son** hop'undan okunur (istemcinin uydurabildiği ilk hop kullanılmaz); hiçbiri yoksa `local`
- E-posta gönderimi: `settings.email` hedefine (boşsa `EMAIL_FROM`); test/env yoksa `[email:skipped]` loglanır
- Bu endpoint anonim erişime açık (yetki kontrolü yok)
- Sayaçlar hafıza içidir ve tek sunucu örneği varsayar; birden fazla örnekle (ya da her isteği yeni bir sunucusuz örnekte çalıştıran ortamlarda) çalıştırılacaksa ortak bir depoya (Redis vb.) taşınmalıdır. Süreç yeniden başladığında sayaç sıfırlanır

## Testler

- `npm test` — birim testler (Vitest)
- `npm run test:integration` — gerçek Postgres (afro_salon_test) üzerinde; önce `npm run db:migrate:test`
- `npm run test:e2e` — Playwright (mesai saatleri içinde çalıştır; system Chrome kullanır, test veritabanında tüm berberleri gün boyu açık tutar)

## Ortam değişkenleri

| Değişken | Açıklama |
|---|---|
| DATABASE_URL | Postgres bağlantısı |
| AUTH_SECRET, AUTH_URL | Auth.js |
| RESEND_API_KEY, EMAIL_FROM | E-posta; boşsa gönderim atlanır ve loglanır |
| SEED_PASSWORD | Seed kullanıcılarının şifresi (admin, berber); boşsa `Sifre123!` kullanılır. `NODE_ENV=production` iken boşsa seed hata verir |
| R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET | Cloudflare R2; bucket public erişim açık ve CORS'ta PUT izinli olmalı |
| NEXT_PUBLIC_R2_PUBLIC_URL | R2 public alan adı; tarayıcıda da okunduğu için NEXT_PUBLIC_ önekli. `next.config.ts` içindeki `remotePatterns` ile uyumlu olmalı. Boşsa yalnızca `landing/` ve `seed/` anahtarları yerelden servis edilir; panelden yüklenen fotoğraflar için R2 gerekir |

## R2 CORS

Cloudflare R2 bucket ayarlarında CORS örneği:
- **AllowedOrigins:** `["http://localhost:3000","https://<alan-adı>"]`
- **AllowedMethods:** `["PUT"]`
- **AllowedHeaders:** `["content-type"]`

## Deploy (Vercel + Neon + R2)

1. Neon'da Postgres oluştur, `DATABASE_URL`'i Vercel env'e ekle.
2. Vercel'de tüm env değişkenlerini gir, `AUTH_URL` canlı alan adı olsun.
3. Build komutu `npm run build` (prisma generate içerir). İlk deploy sonrası `npx prisma migrate deploy` ve `npx prisma db seed` lokal makineden canlı `DATABASE_URL` ile çalıştır.
4. Seed'deki admin şifresini panelden değiştir (berber şifresi gibi admin için de "Şifreyi sıfırla" yoksa, DB'den bcrypt hash güncelle).

## Roller

- **CUSTOMER:** randevu alır, iptal eder, fotoğraflarını görür
- **BARBER:** kendi takvimi, izinleri, müşteri fotoğrafları
- **ADMIN:** her şey + hizmet/berber/ayar yönetimi

## Tipografi ve hareket

Üç yüz, üç iş (`src/app/layout.tsx`, ölçek `src/app/globals.css`):

| Değişken | Yüz | Nerede |
|---|---|---|
| `--font-display` | Fraunces (değişken, `opsz`; italiği `--font-serif`) | Manşet, bölüm başlıkları, isimler, editoryal notlar |
| `--font-sans` | Manrope | Gövde metni, form, fiyatlar (`tabular-nums`) |
| `--font-label` | Bebas Neue | Yalnızca küçük kapital etiketler (`.label`) |

Ölçek sınıfları: `.display-hero` (manşet), `.display-lg` (bölüm başlığı),
`.display-md`, `.display-sm`, `.label`, `.editorial-note`, `.measure`.

Hareket `motion` (v13, `motion/react`) ile yapılır ve **yalnızca ana sayfa
ağacını** (`src/app/(musteri)/page.tsx`) ve giriş/kayıt sayfalarının sol marka
panelini sarar — panel ve `/randevu` akışı hareketsizdir. Bileşenler
`src/components/motion/` altında:

- `MotionProvider` — `MotionConfig reducedMotion="user"`; hareket kapsamını belirler.
- `Reveal` — görüş alanına girince bir kez çalışan fade-up (`delay` ile sıralı giriş).
- `Parallax` — kaydırmaya bağlı dikey kayma; yalnızca `transform`, ±`range` piksel.
- `CountUp` — görüş alanına girince 0'dan sayan rakam; gerçek değer HTML'de durur.

Saf yardımcılar (`src/lib/motion-utils.ts`: `staggerDelay`, `clampParallax`,
`parallaxRange`, `formatCount`) birim testlidir (`tests/unit/motion-utils.test.ts`).

Erişilebilirlik: `prefers-reduced-motion: reduce` açıkken Motion animasyonları
kapatır; ayrıca `globals.css` içindeki `[data-reveal]` / `[data-parallax]`
kuralları sunucudan gelen başlangıç stilini ilk boyamada geçersiz kılar.
JavaScript hiç çalışmadığında aynı iki kural `layout.tsx` içindeki `<noscript>`
bloğundan gelir: animasyon olmaz, ama içerik görünür ve yerindedir. `CountUp`
gerçek değeri sunucuda basar, sıfırdan sayma yalnızca hidrasyondan sonra
başlar. Hero'nun açılış sırası bilinçli olarak CSS'tir (`.rise`): sayfanın en
büyük boyaması hidrasyonu beklemez.

Ölçüm: ana sayfanın Lighthouse mobil performans puanı **96** (`--preset=perf`,
üretim derlemesi; ham çıktı
`.superpowers/sdd/2026-09-17-afro-salon-tur3/lighthouse.json`).

## Fotoğraflar

Afro Salon erkek müşterilere özel hizmetler sunmaktadır.

Landing page'deki görsel alanlar `public/landing/` altındaki dosyalardan
okunur. Dosya yoksa yerine afrika geometrik desenli zarif bir yer tutucu
render edilir; kırık görsel çıkmaz. Depoda şu an duran fotoğraflar,
ücretsiz ve ticari kullanıma açık lisanslı (Unsplash License / Pexels
License) stok fotoğraflardır — her dosyanın fotoğrafçısı ve kaynak URL'si
`public/landing/CREDITS.md` içinde listelenir. Salonun kendi fotoğrafları
hazır olduğunda, aynı dosya adlarıyla üzerine yazmak yeterli (ör.
`public/landing/hero.jpg`'yi değiştir); kod tarafında başka bir şey
değişmez.

| Dosya | Yer | Öneri |
|---|---|---|
| `public/landing/hero.jpg` | Hero görseli (masaüstü) | Yatay, 2000px geniş, 3:2 veya 16:9 |
| `public/landing/hero-mobile.jpg` | Hero görseli (mobil) | Dikey, 4:5, 1200×1500 |
| `public/landing/about.jpg` | Hakkımızda görseli | Yatay, 3:2 |
| `public/landing/gallery-1.jpg` … `gallery-22.jpg` | Galeri yer tutucusu (seed) | Kare (1:1), en az 800×800; 22 fotoğraf, kategori etiketli, ≤400 KB |
| `public/landing/team-1.jpg`, `team-2.jpg` | Ekip portreleri (yedek) | Kare (1:1), portre |

**Galeri:** Landing page'deki galeri bölümü (`#galeri`) panelden yüklenen
fotoğrafları gösterir (R2 altında `gallery/` anahtarı). Sabit kategori listesi
(Low Taper Fade, Taper Fade, Skin Fade, Buzz Cut, Line-up, Kıvırcık, Düz Saç,
Kısa Saç, Textured Fringe, Afro, Örgü, Twist, Sakal) — çiplerde sayı ve ilk
fotoğraf görseli. Panelde (`/panel/galeri`) etiket seçimi sabit listeden
çoklu seçim + "Diğer" serbest metin alanı. Etiketlere göre filtreleme
(`?etiket=`), masonry ızgara, lightbox ve "Daha fazla göster" sayfalama.
Seed: 22 lisanslı fotoğraf (`public/landing/gallery-N.jpg`). Yönetim:
`/panel/galeri` (admin). Kayıt yoksa yer tutucu fotoğraflar gösterilir.

Berber profil fotoğrafları bu klasörden değil, R2'den (`Barber.photoKey`)
gelir; seed verisindeki berberler `landing/team-1.jpg` / `landing/team-2.jpg`
anahtarlarını kullanır (yani `public/landing/` altındaki aynı dosyalara
işaret eder). Bu iki anahtar, panelden fotoğraf değiştirilse bile R2'den
silinmeye çalışılmaz (`landing/` ve `seed/` önekleri korunur).

## Landing Page

**Hero:** Tam ekran sinematik hero, arka planda `hero.jpg` (masaüstü) ve
`hero-mobile.jpg` (mobil), üstünde koyu kahve→şeffaf gradyan ve manşet
(Fraunces, açık kum rengi). "Bugün randevu al" ve "Hizmetler" bağlantıları.

**Navbar:** Sayfanın başında şeffaf (hero üzerinde açık metin), kaydırıldığında
kum zeminli bilinen stil alır. Sosyal medya ikonları navbar'dan kaldırılmış —
yalnızca iletişim bölümü ve footer'da görülür.

## Performans

Ana sayfanın Lighthouse mobil performans puanı **85** (varsayılan simülasyon);
DevTools ölçümü yaklaşık **96**. Hero görseli LCP kritik kaynağı. CSS satır
içi optimizasyonu (`next.config.ts`'de `experimental.inlineCss: true`) etkindir.
Devre dışı bırakmak için `false` yapıp rebuild edin; Lighthouse puanı 2–3
puan düşebilir.
