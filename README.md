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

Bu sürüme yükselten mevcut bir kurulumda `npm run db:seed` bir kez daha
çalıştırılmalı: galeri setinden çıkarılan fotoğrafların pasifleştirilmesi ve
kalanların yeni başlık/etiketlerine taşınması seed'de yapılır (seed
idempotenttir, panelden düzenlenmiş kayıtlara dokunmaz).

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

Yollar üç dilde de aynıdır, yalnızca önek değişir: Türkçe öneksiz (`/`,
`/randevu`), İngilizce `/en` ve Fransızca `/fr` önekiyle (`/en/randevu`,
`/fr/panel`). Ayrıntı için [Diller (TR/EN/FR)](#diller-trenfr).

## Diller (TR/EN/FR)

Site üç dilde yayınlanır: Türkçe (varsayılan), İngilizce, Fransızca.

**Adresler.** Türkçe öneksizdir (`/`, `/randevu`, `/panel`), İngilizce ve
Fransızca `/en` / `/fr` önekiyle gelir (`localePrefix: "as-needed"`,
`src/i18n/routing.ts`). İlk ziyarette dil `NEXT_LOCALE` çerezinden, çerez
yoksa tarayıcının `Accept-Language` başlığından seçilir; üst çubuktaki (ve
paneldeki) dil anahtarı seçimi aynı çereze yazar, böylece tercih sonraki
ziyaretlerde korunur. Uygulama içi bağlantılar `src/i18n/navigation.ts`
sarmalayıcılarından geçer (`Link`, `redirect`, `useRouter`, `usePathname`);
`next/link` doğrudan kullanılırsa bağlantı dili düşürür.

**Arayüz metinleri.** `messages/tr.json`, `messages/en.json`,
`messages/fr.json`. Üç dosya aynı anahtar ağacını **aynı sırayla** taşır ve
bunu `tests/unit/messages.test.ts` bağlar: eksik, fazla ya da kaymış anahtar,
boş değer ve çeviride düşmüş `{yer_tutucu}` testte yakalanır. Yeni bir metin
eklerken anahtar **üç dosyaya birden**, aynı konuma yazılır; TypeScript tipleri
`messages/tr.json`'dan türetildiği için Türkçe dosya kaynaktır.

**Kullanıcının dili.** `User.locale` (`tr` | `en` | `fr`) `/panel/profil`
formundan seçilir. Panelin gösterdiği dil adresten gelir; kayıtlı tercih
e-postalarda kullanılır — müşteriye giden e-posta müşterinin, berbere giden
berberin dilinde yazılır (`src/lib/email/i18n.ts`).

**Panelden girilen içerik.** Hizmet adı, "Hakkımızda", "Neden biz" maddeleri,
galeri başlıkları, berberin kısa tanıtımı gibi alanlar veritabanında `*I18n`
adlı `Json` sütunlarda `{ tr, en?, fr? }` biçiminde durur. Panel formlarında
her alanın üç sekmesi vardır: **hizmet adında TR zorunludur**, öbürlerinde
üçü de boş bırakılabilir; EN/FR her zaman isteğe bağlıdır. Boş bırakılan çeviri
kaydedilmez; ziyaretçi o dilde sayfayı açtığında Türkçe kaynak metni görür
(`pick`, `src/lib/i18n-content.ts`).

**Galeri etiketleri.** Etiketler veritabanında ve `?etiket=` parametresinde
**anahtar** olarak durur (`braids`, `skin-fade` …; liste
`src/lib/gallery-tags.ts`), görünen adları `messages/*.json` içinde
`gallery.tags.*` altındadır. Panelde "Diğer" alanına serbest yazılan bir
etiket üç dilden birindeki kategori adına eşitse anahtarına indirilir — hem
panel formunda hem şemada (`src/schemas/gallery.ts`), yani eylem doğrudan
çağrılsa bile. Böylece "Braids", "Örgü" ve "Tresses" tek çipe düşer. Listede
olmayan serbest etiketler yazıldıkları gibi yaşar ve çevrilmez.

**SEO.** Her sayfa üç dile `hreflang` bağlantısı ve kendi dilindeki
`canonical` adresini basar; `x-default` Türkçeye (öneksiz adrese) gider.
`/sitemap.xml` herkese açık sayfaları üç dilde listeler (`/`, `/en`, `/fr`,
`/randevu`, `/en/randevu`, `/fr/randevu`) ve her kaydı öbür dillere bağlar;
`/robots.txt` `/api` ile panel, hesap ve giriş/kayıt yollarını üç dilde de
kapatır. Oturum ardındaki sayfalar ayrıca `robots: { index: false }` taşır.
İkisi de `[locale]` ağacının dışında, `src/app/` kökünde durur. Mutlak
adresler `NEXT_PUBLIC_SITE_URL`'den gelir (boşsa `http://localhost:3000`);
canlıya çıkarken gerçek alan adına ayarlanmalı, yoksa arama motorlarına
localhost adresleri bildirilir.

**Mevcut kurulumu güncellerken.** Bu sürüme yükselen mevcut bir kurulumda
EN/FR seed içeriğini almak için `npm run db:seed` yeniden çalıştırılır;
yalnızca hâlâ seed varsayılanına eşit alanlar doldurulur, admin düzenlemeleri
korunur.

## Panel Sayfaları

- `/panel/randevular` — tüm randevular (berber zamanlaması)
- `/panel/izinler` — berber izinleri (barber)
- `/panel/musteriler` — tüm müşteriler (admin)
- `/panel/hizmetler` — hizmet listesi (adı üç dilli), fiyat ve süre (sıralamadan sil/düzenle; hard delete kuralı: geçmiş randevusu olan hizmetler sadece pasifleştirilebilir). Fiyat için satır içi düzenleme: listede fiyata tıklayıp yeni değeri yazıp Enter'a basmak yeterli; Esc vazgeçer, alan boş bırakılırsa kayıt yapılmaz
- `/panel/berberler` — berber listesi (kısa tanıtım üç dilli; sıralamadan sil/düzenle; hard delete kuralı: geçmiş randevusu olan berberler sadece pasifleştirilebilir)
- `/panel/galeri` — galeri fotoğrafları (admin): çoklu dosya yükleme, başlık (üç dilli) ve etiket yönetimi, sıralama (yukarı/aşağı), aktif/pasif geçişi, silme
- `/panel/profil` — kendi profil bilgileri (berberin kısa tanıtımı üç dilli) ve şifre değişimi (tüm personel)
- `/panel/yorumlar` — müşteri yorumları yönetimi: ekle/düzenle/aktif-pasif geçişi (admin)
- `/panel/ayarlar` — salon ve site içeriği ayarları (admin)

## İçerik yönetimi (Site ayarları)

Panelden `/panel/ayarlar` sayfasında aşağıdaki bilgiler düzenlenebilir.
Ziyaretçiye görünen metin alanları (aşağıda **üç dilli** işaretli olanlar)
TR/EN/FR sekmeleriyle girilir: Türkçesi zorunlu, çeviriler isteğe bağlı, boş
bırakılan çeviri yerine Türkçesi gösterilir (bkz. [Diller](#diller-trenfr)).

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
- "Hakkımızda" başlığı ve metni (wysiwyg-style textarea) — **üç dilli**
- "Neden biz" — 3 madde (başlık + metin) — **üç dilli**
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
| NEXT_PUBLIC_SITE_URL | Sitenin mutlak kök adresi; `hreflang`, `canonical`, `sitemap.xml` ve `robots.txt` bunu kullanır. Tarayıcıya giden kodda da gömüldüğü için NEXT_PUBLIC_ önekli. Boşsa `http://localhost:3000` varsayılır — canlıda mutlaka gerçek alan adı |
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

Üç yüz, üç iş (`src/app/[locale]/layout.tsx`, ölçek `src/app/globals.css`):

| Değişken | Yüz | Nerede |
|---|---|---|
| `--font-display` | Fraunces (değişken, `opsz`; italiği `--font-serif`) | Manşet, bölüm başlıkları, isimler, editoryal notlar |
| `--font-sans` | Manrope | Gövde metni, form, fiyatlar (`tabular-nums`) |
| `--font-label` | Bebas Neue | Yalnızca küçük kapital etiketler (`.label`) |

Ölçek sınıfları: `.display-hero` (manşet), `.display-lg` (bölüm başlığı),
`.display-md`, `.display-sm`, `.label`, `.editorial-note`, `.measure`.

Hareket `motion` (v13, `motion/react`) ile yapılır ve **yalnızca ana sayfa
ağacını** (`src/app/[locale]/(musteri)/page.tsx`) ve giriş/kayıt sayfalarının sol marka
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
| `public/landing/gallery-1.jpg`, `gallery-2.jpg`, `gallery-9.jpg` … `gallery-28.jpg` | Galeri yer tutucusu (seed) | Karışık oran (1:1, 3:2, 2:3), uzun kenar ≥ 1600 px; 22 fotoğraf, kategori etiketli, ≤400 KB |
| `public/landing/team-1.jpg`, `team-2.jpg` | Ekip portreleri (yedek) | Kare (1:1), portre |

**Galeri:** Landing page'deki galeri bölümü (`#galeri`) panelden yüklenen
fotoğrafları gösterir (R2 altında `gallery/` anahtarı). Sabit kategori listesi
(Low Taper Fade, Taper Fade, Skin Fade, Buzz Cut, Line-up, Kıvırcık, Düz Saç,
Kısa Saç, Textured Fringe, Afro, Örgü, Twist, Sakal) — çiplerde etiket adı ve
fotoğraf sayısı. Panelde (`/panel/galeri`) etiket seçimi sabit listeden
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

Ana sayfanın Lighthouse mobil performans puanı **85** (varsayılan simülasyon,
5 koşunun medyanı); DevTools ölçümü yaklaşık **96**. Hero görseli LCP kritik
kaynağı; LCP 4.4 sn'den **4.3 sn**'ye indi. CSS satır içi optimizasyonu
(`next.config.ts`'de `experimental.inlineCss: true`) etkindir. Devre dışı
bırakmak için `false` yapıp rebuild edin; Lighthouse puanı 2–3 puan düşebilir.

Üç dilli yayın bu puanı düşürmedi: Türkçe tarayıcıyla `/` ölçümü yine **85**
(3 koşunun medyanı — 85 / 86 / 85; FCP 1.5 sn, LCP 4.1–4.4 sn). Tarayıcısı
Türkçe olmayan bir ziyaretçi `/` adresinde bir kez 307 ile kendi diline
yönlenir (dil algılama, bkz. [Diller (TR/EN/FR)](#diller-trenfr)); o fazladan
gidiş dönüş ölçümde **83**e denk geliyor (81 / 83 / 83). Aynı sayfa doğrudan
açıldığında (`/en`) puan **86**. Yani kayıp sayfanın kendisinde değil, tek
seferlik dil yönlendirmesinde — doğru dili göstermenin bedeli olarak kabul
edildi. `hreflang`/`canonical` etiketleri ve `sitemap.xml` ölçülebilir bir yük
getirmiyor (birkaç yüz bayt `<link>`).

LCP için üç ayar:

- `images.formats` listesinde **AVIF** WebP'nin önünde: hero'nun mobil kırpımı
  29 KB yerine 22 KB iniyor (destekleyen tarayıcılarda).
- Duyuru `preloadHero()` ile ana sayfada, veri beklenmeden yapılır
  (`src/lib/hero-image.ts`): `ReactDOM.preload()` `<link>`i satır içi stil
  bloğundan **önce**, `<head>`in en başına koyar. `media` ile cihaz başına tek
  dosya indirilir.
- Yazı tiplerinde ön yükleme **açık** kalır. Bebas'ta `preload: false` denendi
  ve geri alındı: dosya ilk turda değil, düzen onu isteyince "VeryHigh"
  önceliğiyle çekiliyor, yani ilk boyamanın zincirine giriyor — FCP 1.5 → 1.8
  sn, puan 85 → 82. Ölçmeden kapatmayın.
