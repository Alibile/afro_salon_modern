# Afro Salon Modern: Panelden İçerik Yönetimi (Tur 9)

Tarih: 2026-10-07
Durum: Uygulandı (2026-10-08, `tur9-icerik` dalı)

## 1. Amaç

Ana sayfadaki her metin ve her fotoğraf panelden değiştirilebilsin; kod ya
da çeviri dosyasına dokunmak gerekmesin. Bugün panelden yönetilenler:
randevular, izinler, müşteriler, hizmetler, berberler, yorumlar, galeri,
ayarlar (hakkımızda metni, üç sebep, iletişim, bağlantılar, sayılar).
Yönetilemeyenler bu turda ekleniyor:

| Alan | Bugün nerede | Tur 9 |
|---|---|---|
| Hero manşeti (2 satır), alt metin | `messages/*.json` | Panel |
| Hero fotoğrafı (geniş + telefon), hakkımızda fotoğrafı | `public/landing/*.jpg` | Panel (R2'ye yükleme) |
| "Nasıl çalışır" başlık, not, 3 adım | `messages` | Panel |
| Bölüm başlıkları ve notları (hizmetler, paket notu, neden biz, ekip, galeri, yorumlar, SSS, iletişim, mesaj formu notu) | `messages` | Panel |
| SSS soru ve cevapları | `messages` (sabit 6) | Panel, serbest liste |
| Altbilgi sloganı | `messages` | Panel |
| Sekme başlığı ve arama açıklaması (ana sayfa) | `messages` | Panel |

Kapsam dışı: düğme ve menü etiketleri, hata mesajları, e-posta metinleri,
randevu sihirbazının metinleri (arayüz metni, içerik değil); paneli
yeniden tasarlamak; randevu oluşturma (ayrı tur, bkz. §7).

## 2. Kararlar

### 2.1 Metinler: anahtar/değer, çeviri dosyası yedek

Yeni tablo `ContentBlock { key String @id, textI18n Json }`. Anahtar listesi
kodda (`src/lib/content-keys.ts`): her anahtarın karşılığı bir çeviri
anahtarı ve bir üst sınır. Okuma kuralı (`src/lib/content.ts`,
`siteText(blocks, key, locale, t)`): panelden girilmiş ve ziyaretçinin
dilinde dolu bir değer varsa o; Türkçe doluysa Türkçesi; hiçbiri yoksa
çeviri dosyasındaki metin. Böylece panelde boş bırakılan her alan bugünkü
görünümünü korur, veri taşıma gerekmez.

Anahtarlar (çeviri karşılıkları parantezde):

- `hero.headline1`, `hero.headline2` (`landing.hero.headline1/2`, max 40,
  büyük harf dönüşümü **yapılmaz**: panelden girildiği gibi basılır),
  `hero.subtitle` (max 160)
- `howItWorks.title` (60), `howItWorks.note` (160), `howItWorks.step1Title`…
  `step3Title` (60), `step1Text`…`step3Text` (300), `howItWorks.cancelNote`
  (300, `{minutes}` yer tutucusu korunur)
- `services.title`, `services.note`, `package.sectionNote`, `package.note`
- `whyUs.title`, `whyUs.note`
- `team.title`, `team.note`
- `gallery.title`, `gallery.note`
- `testimonials.title`, `testimonials.note`
- `faq.title`, `faq.note`
- `contact.title`, `contact.note`, `contact.formNote`
- `footer.tagline` (120)
- `meta.homeTitle` (70), `meta.homeDescription` (160)

Yer tutucular: yalnızca `howItWorks.cancelNote` ve SSS cevapları değişken
taşır (`{minutes}`, `{open}`, `{close}`, `{price}`, `{duration}`). ICU
değil düz `{ad}` değişimi (`fillPlaceholders(text, values)`); bilinmeyen ad
olduğu gibi kalır. Çeviri dosyasındaki yedek metinler ICU ile
basılmaya devam eder (bugünkü yol).

### 2.2 SSS: serbest liste

Yeni tablo `FaqItem { id, questionI18n Json, answerI18n Json, sortOrder Int,
isActive Boolean, createdAt }`. Panelden ekle, düzenle, sırala (yukarı/
aşağı), pasife al, sil. Ana sayfa ve `FAQPage` JSON-LD aynı listeyi okur;
aktif soru yoksa bölüm basılmaz. Seed: tablo boşsa çeviri dosyasındaki altı
soru üç dilde `FaqItem` olarak eklenir (idempotent: yalnızca boş tabloya).
Bugünkü "paket yoksa dördüncü soru düşer" kuralı kalkar; cevap yer
tutucuları (`{price}`, `{duration}`) paket yoksa boş dizeyle doldurulur ve
panelde o sorunun yanında bir uyarı görünür.

### 2.3 Görseller: üç yuva

Yeni tablo `SiteImage { slot String @id, storageKey String, width Int,
height Int }`; yuvalar `hero` (3:2, en az 1600 px geniş), `heroMobile`
(4:5, en az 1000 px geniş), `about` (serbest oran, en az 1000 px). Yükleme
galeri gibi presign ile R2'ye (`kind: "site"`, klasör `site/`); boyut ve
oran istemcide okunur, sunucu şemayla doğrular (`photoSchema` benzeri).
Yuva boşsa bugünkü `public/landing/*.jpg` dosyası kullanılır; o da yoksa
desenli yer tutucu. "Varsayılana dön" düğmesi satırı siler (R2 nesnesi de
silinir).

Hero ön yüklemesi (`preloadHero`) artık dosya sisteminden değil `SiteImage`
sorgusundan beslenir: ana sayfa önce bu küçük sorguyu bekler, sonra
`preload()` çağırır, sonra geri kalan veriyi çeker. `<link rel=preload>`
yine `<head>`e girer; LCP Tur 7'de ölçüldüğü gibi yeniden ölçülür (üretim
derlemesi, `/en` doğrudan, hedef puan 85).

### 2.4 Panel: tek "İçerik" sayfası

Yönetim grubuna `İçerik` (`/panel/icerik`, admin) eklenir. Sayfa
`PanelSection` bölümleri:

1. **Hero**: manşet satırı 1, satırı 2, alt metin (üç dilli alanlar).
2. **Görseller**: üç yuva, her biri önizleme + yükle + varsayılana dön;
   yuva altında istenen oran ve en küçük boyut.
3. **Nasıl çalışır**: başlık, not, üç adım (başlık + metin), iptal notu
   (yer tutucu ipucuyla).
4. **Bölüm başlıkları ve notları**: her bölüm için başlık + not çifti.
5. **Sıkça sorulanlar**: liste (soru, cevap, sıra, durum) + "Yeni soru"
   paneli; yer tutucu ipucu.
6. **Altbilgi ve arama**: slogan, sekme başlığı, arama açıklaması.

Her bölümün kendi "Kaydet"i vardır (bölüm başına bir server action çağrısı;
tek dev form yerine). Alanlar boşken yer tutucu olarak çeviri dosyasındaki
Türkçe metin gösterilir: yönetici neyi ezeceğini görür. Ayarlar sayfası
olduğu gibi kalır (hakkımızda, sebepler, sayılar orada).

### 2.5 Yetki ve doğrulama

Yalnızca `ADMIN`. Server action'lar `asAdminActor`; şemalar `i18nText`
ile üst sınırlar; `ContentBlock.key` yalnızca `content-keys.ts`
listesinden kabul edilir (bilinmeyen anahtar `errors.invalidInput`).
SSS soru en az 3, cevap en az 10 karakter (Türkçe zorunlu).

## 3. Veri akışı

- `getLandingData(locale)` `ContentBlock` ve aktif `FaqItem` listesini ve
  `SiteImage` satırlarını da çeker; bölümlere düz metin verir (`siteText`).
  Bölüm bileşenlerinin imzası değişmez; yalnızca `page.tsx` metinleri
  `t()` yerine `siteText`ten geçirir. `generateMetadata` sekme başlığını
  aynı yoldan okur.
- `FaqSection` artık `FAQ_KEYS` değil `items: { id, question, answer }[]`
  alır; JSON-LD aynı diziden üretilir.
- `Hero` ve `AboutSection` fotoğraf kaynağını `heroSources(images)` /
  `publicUrl` ile alır; `ImageSlot` DB anahtarı destekler.

## 4. Test

- Birim: `siteText` yedekleme kuralı (dil → Türkçe → çeviri),
  `fillPlaceholders`, `content-keys` listesinin çeviri anahtarlarıyla
  eşleştiği (her anahtar üç dilde var), SSS şeması sınırları.
- Entegrasyon: içerik action'ları yetki (berber reddedilir), bilinmeyen
  anahtar reddi, SSS ekle/sırala/sil, görsel yuva yaz/sil, seed'in SSS'yi
  yalnızca boş tabloya yazması.
- E2e: admin manşeti değiştirir → ana sayfada görünür → alanı boşaltır →
  çeviri metni döner; SSS'ye soru ekler → ana sayfada ve JSON-LD'de
  görünür; görsel yükleme e2e'de atlanır (R2 yok), yuva boşken dosya
  yedeği doğrulanır.
- Mevcut e2e'ler aynı metinlerle geçer (içerik boş → yedek).

## 5. Riskler

- Hero ön yüklemesi artık bir DB sorgusunu bekler; `<head>` sırası
  değişirse LCP düşebilir. Ölçülür; düşerse `SiteImage` sorgusu
  `unstable_cache` ile kısa süre önbelleğe alınır.
- Manşet panelden küçük harf girilirse hero cümle düzeninde basılır; bu
  bilinçli: büyük harf kararı içeriğin sahibine bırakılır.
- SSS'nin "paket yoksa dördüncü soru düşer" kuralı kalkıyor; yönetici
  soruyu pasife alır.

## 6. Dosya haritası

Yeni: `prisma/migrations/<ts>_site_content/`, `src/lib/content-keys.ts`,
`src/lib/content.ts`, `src/schemas/content.ts`, `src/schemas/faq.ts`,
`src/schemas/site-image.ts`, `src/actions/content.ts` + `impl/content.ts`,
`src/actions/faq.ts` + `impl/faq.ts`, `src/actions/site-images.ts` +
`impl/site-images.ts`, `src/lib/queries/content.ts`,
`src/app/[locale]/panel/icerik/page.tsx`, `src/components/panel/content/*`
(HeroForm, ImagesForm, HowItWorksForm, SectionNotesForm, FaqList/FaqForm,
FooterSeoForm), `tests/unit/content.test.ts`,
`tests/integration/content.test.ts`, `tests/e2e/content.spec.ts`.

Değişen: `prisma/schema.prisma`, `prisma/seed.ts`, `src/lib/storage.ts`
(`site` klasörü), `src/app/api/upload/presign/route.ts`,
`src/lib/hero-image.ts`, `src/lib/queries/landing.ts`,
`src/app/[locale]/(musteri)/page.tsx`, `Hero`, `AboutSection`,
`FaqSection`, `HowItWorksSection`, bölüm bileşenlerinin başlık/not
prop'ları, `PanelNav` (İçerik maddesi), `messages/*.json`
(`panel.content.*`, `panel.nav.content`), README.

## 7. Sonraki tur adayı

"Randevular panelden yönetilsin" isteğinin kalan parçası: personelin
panelden randevu **oluşturması** (telefonla ya da kapıdan gelen müşteri
için berber, hizmet, gün ve saat seçimi; müşteri adı/telefonuyla hesapsız
kayıt) ve saat değiştirmesi. Bu tur değil; ayrı spec.
