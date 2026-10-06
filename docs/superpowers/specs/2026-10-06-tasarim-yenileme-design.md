# Afro Salon Modern: Tasarım Yenileme (Tur 8)

Tarih: 2026-10-06
Durum: Taslak, kullanıcı incelemesinde

## 1. Amaç

Site, randevu akışı ve panel renk olarak beğeniliyor; hizalama, arayüz
tutarlılığı ve genel his beğenilmiyor. Üç yüzey de "şablondan üretilmiş"
izlenimi veriyor. Bu tur görünümü, davranışı değil, yeniden kurar: veri
modeli, server action'lar, API uçları ve çeviri altyapısı aynen kalır.

**Birincil cihaz telefon.** Her karar önce 390 px için verilir, sonra
geniş ekrana açılır. Masaüstü düzeni telefondakinin genişletilmiş hâlidir,
ayrı bir tasarım değildir.

### Kapsam içi

- Ana sayfa (`/`), randevu sihirbazı (`/randevu`), müşteri randevuları
  (`/randevularim`), giriş/kayıt (`/giris`, `/kayit`), panelin tüm sayfaları.
- Ortak bileşenler: üst çubuk, düğme, giriş kutusu, rozet, alan sarmalayıcı,
  panel kabuğu.
- Yazı tipi seti ve CSS değişkenleri (`globals.css`).
- Etkilenen e2e ve birim testlerinin güncellenmesi.

### Kapsam dışı

Yeni özellik, veri modeli değişikliği, çeviri anahtarı dışında metin
yazarlığı, e-posta şablonları, SEO yapısı. Renk paleti **değişmez**.

## 2. Teşhis: neden "AI yapmış" gibi duruyor

Ekran görüntüleri (1440 px ve 390 px, açık/koyu) ve kod incelemesiyle:

1. **Tek bölüm kalıbı.** Ana sayfada sekiz bölümün sekizi aynı başlık
   düzenini kullanıyor: solda `display-lg` BÜYÜK HARF başlık, sağda
   `editorial-note` italik not, altında `border-b`. Üçüncü tekrardan sonra
   kalıp okunuyor.
2. **Üretilmiş sayfa işaretleri bir arada.** Bebas Neue ile aralıklı büyük
   harf etiketler (`.label`: "FİYATA DAHİL", yorumcu adları, altbilgi sütun
   başlıkları, hero durum satırı), `A · B · C` orta noktalı meta satırları
   (hero, randevu kartı, panel listeleri), `01 / 02 / 03` soluk dev numaralar,
   kaydırılmış kartlar (`lg:mt-16`, `md:mt-12`), "büyük sayı + küçük etiket"
   sayaç bandı, her bölüm ve her liste öğesinde ayrı fade-up.
3. **Hizalama tutarsız.** Bölüm notları kimi yerde 8., kimi yerde 9. sütunda
   bitiyor; SSS notu sağ üstte tek başına. İç sayfa üst çubuğu ana
   sayfadakinden farklı marka yazısı ve `max-w-lg` kap kullanıyor, 1440 px'te
   iki satıra kırılıyor.
4. **Köşe ve yoğunluk kuralı yok.** Ana sayfa düğmeleri köşesiz, panel ve
   rozetler `rounded-xl`/hap. Panel giriş kutuları 32 px, etiketle kutu
   arasında boşluk yok, native `select` farklı yükseklik ve köşede, "Ekle"
   düğmeleri tam genişlikte.
5. **Panel düz shadcn varsayılanı.** Hap aktif menü, her şey aynı kartta,
   yeni kayıt formu listenin üstünde, filtrelerin etiketi yok, dolu
   terracotta durum rozeti.
6. **Sihirbaz yığılıyor.** Adımlar alt alta açılıyor, tamamlanan adım
   kapanmıyor, ilerleme göstergesi yok, özet çubuğu en altta.

## 3. Tasarım kararları

### 3.1 Ortak

| Konu | Karar |
|---|---|
| Renk | Palet aynen kalır (`--primary` terracotta, `--accent` hardal, kum zemin, kahve metin). Panelde kart zemini `bg-card` yerine düz `bg-background` + ince kenarlık; derinlik için gölge kullanılmaz. |
| Yazı tipi | **Bebas Neue kalkar.** Müşteri yüzü: Fraunces (başlık) + Manrope (gövde). Panel: yalnızca Inter. `--font-label`, `.label` sınıfı ve `.panel-typography`'nin Bebas eşlemesi silinir. |
| Başlık düzeni | Cümle düzeni ("Nasıl çalışır", "Randevu al"). BÜYÜK HARF yalnızca hero manşetinde ve altbilgideki yığılmış marka adında kalır. Çeviri dosyalarındaki büyük harf değerler üç dilde de cümle düzenine çevrilir. |
| Köşe | Tek kural: müşteri yüzünde `--radius: 2px`, panelde `--radius: 6px` (panel kabuğunda yeniden tanımlanır). Hap rozet yok; durum = renkli nokta + metin. |
| Ayırıcılar | Orta nokta (`·`) meta ayırıcı olarak kullanılmaz. Bilgi ya ayrı satıra iner ya iki sütuna bölünür ya da cümle olur. Aralıklı büyük harf etiket (`tracking-[0.2em] uppercase`) hiçbir yerde kullanılmaz. |
| Hareket | Hero açılış sırası (`.rise`, `.hero-zoom`) ve galeri lightbox geçişleri kalır. Bölüm bölüm `Reveal`, öğe başına `staggerDelay`, `Parallax` desen kaydırmaları ve `CountUp` kalkar. Kullanıcı eylemine cevap veren hareket (SSS açılması, menü) kalır. |
| Üst çubuk | Tek bileşen (`SiteNav`): ana sayfada hero üstünde şeffaf başlar, iç sayfalarda düz zemin. Aynı `BrandLogo` (işaret + ad), aynı `max-w-6xl` kap. `SiteHeader` silinir. Telefonda tek satır: logo solda, sağda "Randevu al" düğmesi ve menü düğmesi; dil ve tema anahtarı menünün içinde. |
| Boşluk ritmi | Bölüm dikey boşluğu telefonda 56 px, masaüstünde 96 px; yatay oluk telefonda 20 px, masaüstünde 40 px, kap 72 rem. Her bölüm aynı 12 sütunlu ızgaraya oturur; sol kenarlar hizalıdır. |
| Erişilebilirlik | Görünür klavye odağı (2 px `--ring`), `prefers-reduced-motion` korunur, dokunma hedefi en az 44 px. |

### 3.2 Ana sayfa

Bölüm sırası değişmez (hero, nasıl çalışır, hakkımızda, hizmetler, neden
biz, ekip, galeri, yorumlar, SSS, iletişim, altbilgi). Değişen, her bölümün
kendi biçimini almasıdır:

- **Hero.** Fotoğraf, iki satırlık BÜYÜK HARF manşet ve iki düğme kalır.
  Dikey "Kaydır" etiketi, çizgi ve nokta + Bebas durum satırı kalkar. Durum
  ve boş randevu sayısı manşetin altında tek düz cümle ("Bugün açığız,
  11:00–22:30. 14 boş saat var.") olarak Manrope ile yazılır. Telefonda
  manşet `clamp(2.5rem, 11vw, 8rem)`.
- **Nasıl çalışır.** Başlık ve bir cümlelik açıklama üst üste, solda. Üç
  adım telefonda alt alta, masaüstünde yan yana; her adım küçük bir rakam
  (gövde boyutu, terracotta) + başlık + metin. Dev soluk numaralar kalkar.
- **Hakkımızda.** Fotoğraf + metin iki sütun kalır. Sayaç bandı (`%99`,
  `10+ yıl`) kalkar; iki rakam metnin altında iki kısa satır olur ("%99
  müşteri memnuniyeti", "10 yıl deneyim"), `CountUp` yok. Yerleşim kuralı
  `WhyUsSection`'dan `AboutSection`'a taşınır.
- **Hizmetler.** Paket kartı kalır: ad, dahil olanlar, fiyat, süre, düğme.
  "FİYATA DAHİL" etiketi "Fiyata dahil:" cümle düzeni alt başlık olur.
- **Neden biz.** Başlık + açıklama üst üste; üç madde düz üç sütun,
  dönmüş kare işaret kalkar, her madde ince üst çizgiyle ayrılır.
- **Ekip.** Kartlar hizalı (kaydırma yok). Fotoğraf 3:4, altında ad,
  biyografi ve "X ile randevu al" bağlantısı.
- **Galeri.** Çipler ve masonry aynı; yalnızca köşe kuralı ve çip
  yüksekliği (44 px) uygulanır.
- **Yorumlar.** Üç sütun hizalı; yıldızlar, alıntı, ad. Ad Manrope
  normal ağırlık, büyük harf değil.
- **SSS.** Başlık + açıklama üst üste; liste tam genişlik (`max-w-3xl`),
  not sağda asılı kalmaz.
- **İletişim.** Telefonda sıra: adres ve telefon, bağlantılar, çalışma
  saatleri, harita, form. Masaüstünde iki sütun. Form alan stili (alt
  çizgili) kalır.
- **Altbilgi.** Sütun başlıkları Manrope orta ağırlık, cümle düzeni.

### 3.3 Randevu sihirbazı ve müşteri sayfaları

- **İlerleme.** Sayfanın üstünde üç adımlık gösterge: "Hizmet", "Berber",
  "Gün ve saat". Tamamlanan adım onay işareti, etkin adım dolu, sıradaki
  soluk.
- **Kapanan adımlar.** Tamamlanan adım tek satıra iner: seçimin özeti sol,
  "Değiştir" bağlantısı sağ. Etkin adım açık, sonraki adımlar hiç çizilmez.
  Durum makinesi aynıdır (`step = 1 | 2 | 3`); yalnızca görünüm değişir.
- **Özet.** Telefonda alt yapışkan çubuk kalır (seçim özeti + onay düğmesi).
  `md` ve üstünde iki sütun: solda adımlar (`col-span-7`), sağda yapışkan
  özet kartı (`col-span-5`): seçilen hizmet(ler), berber, gün ve saat,
  toplam süre ve tutar, onay düğmesi.
- **Hizmet kartı.** Ad ve süre solda, fiyat sağda, seçim durumu sol kenar
  çizgisi + onay işaretiyle. Yükseklik en az 56 px.
- **Berber kartı.** Fotoğraf 72 px kare, ad ve biyografi; son kesim
  küçük resimleri altta tek satır.
- **Gün çipleri.** İki satır: üstte "Bugün"/"Yarın"/gün adı, altta kısa
  tarih ya da "Kapalı"/"Dolu". Yükseklik 56 px, telefonda yatay kayar.
- **Saatler.** Telefonda 4, `sm` 5, `md` 6 sütun. Seçili saat dolu
  terracotta.
- **Başlık.** "Randevu al" cümle düzeni, altında tek satır durum ve adres.
- **Randevularım.** En yakın randevu büyük kart (terracotta sol çizgi).
  Diğerleri liste: solda tarih bloğu (gün adı, gün numarası), sağda saat,
  berber, hizmet, tutar, durum noktası. Başlıklar "Yaklaşan randevularım",
  "Geçmiş".
- **Giriş/kayıt.** Yapı aynı; sol panelde deseni kaydıran `Parallax` kalkar,
  form alanları 44 px.

### 3.4 Panel

- **Kabuk.** Kenar çubuğu 240 px (`lg` ve üstü), telefonda üstte yatay
  kayan sekme şeridi (mevcut davranış). Üstte işaret + salon adı. Menü iki
  grup: "Günlük iş" (Bugün, Randevular, İzinler, Müşteriler) ve "Yönetim"
  (Hizmetler, Berberler, Yorumlar, Galeri, Ayarlar; yalnızca admin). Altta
  Profilim, kullanıcı adı, dil, tema, çıkış. Aktif madde: sol 2 px
  terracotta çizgi + `bg-primary/8` zemin, dolu hap değil.
- **Sayfa başlığı** (`PanelPage` bileşeni): başlık (Inter 600, 24 px),
  isteğe bağlı açıklama, sağda tek birincil eylem. Sayfa içeriği
  `max-w-5xl`, ayarlar ve profil `max-w-3xl`.
- **Alan bileşeni** (`Field`): etiket, 40 px giriş kutusu, isteğe bağlı
  ipucu ve hata; aralık 6 px. `select`, `date`, `time` kutuları `Input` ile
  aynı yükseklik, köşe ve kenarlıkta (`Select` sarmalayıcı). Onay kutuları
  etiketle aynı satırda 16 px.
- **Form altlığı.** Düğmeler sağa hizalı; birincil düğme `h-9`, tam
  genişlik yok. Uzun formlarda (Ayarlar) yapışkan altlık.
- **Listeler önce.** Hizmetler, berberler, izinler, yorumlar: liste üstte,
  "Yeni …" eylemi sayfa başlığında; forma basınca sayfanın üstünde açılan
  panel (`details` değil, durumlu bileşen) ya da satır içi düzenleme.
- **Tablolar.** Hizmetler (ad, süre, fiyat, sıra, durum, eylemler),
  berberler (fotoğraf + ad, e-posta, durum), randevular (mevcut sütunlar).
  Telefonda tablo kart listesine düşer (`md` altında `display:block`
  satırlar). Durum sütunu nokta + metin.
- **Randevu filtreleri.** Etiketli araç çubuğu: Başlangıç, Bitiş, Berber,
  Durum, "Uygula" düğmesi. Telefonda iki sütun.
- **Bugün panosu.** Berber başına sütun; her randevu satırında solda saat
  bloğu (başlangıç üstte, bitiş altta), sağda müşteri, hizmet, tutar ve
  üç küçük eylem düğmesi (`size="sm"`, `variant="outline"`).
- **Ayarlar.** Her bölüm iki sütun (`md`): solda bölüm başlığı + açıklama
  (`col-span-4`), sağda alanlar (`col-span-8`). Kısa alanlar (telefon,
  e-posta, sayılar) iki sütun. Bölümler: Dükkan, Randevu kuralları,
  Bağlantılar, Site metinleri.
- **Galeri.** Kart ızgarası aynı; kart içi düğmeler tek satır ikon
  düğmeler (yukarı, aşağı, pasif, sil), başlık ve etiket alanları `Field`.

## 4. Bileşen ve dosya haritası

Yeni:

- `src/components/layout/SiteNav.tsx` (mevcut `landing/SiteNav` taşınır ve
  `variant: "hero" | "plain"` alır; `SiteHeader.tsx` silinir).
- `src/components/ui/field.tsx` (`Field`, `FieldLabel`, `FieldHint`,
  `FieldError`), `src/components/ui/select.tsx` (native select sarmalayıcı),
  `src/components/ui/status-dot.tsx`.
- `src/components/panel/PanelPage.tsx` (başlık + eylem), `PanelShell` içinde
  gruplanmış `PanelNav`.
- `src/components/booking/StepIndicator.tsx`, `StepSummary.tsx`,
  `BookingSummary.tsx`.
- `src/components/landing/SectionHeader.tsx` **yazılmaz**: bölümler kendi
  başlığını kendisi kurar, ortak kalıp bilinçli olarak yok.

Silinen: `BrandLogo` içindeki Bebas bağımlılığı, `motion/CountUp.tsx`,
`motion/Parallax.tsx` kullanımları (dosya kalabilir, çağrı kalmaz),
`.label` sınıfı, `--font-label`.

Değişen çeviri anahtarları: büyük harf başlık değerleri (`landing.*.title`,
`booking.title`, `account.*Title`, `auth.*.title`, `footer.*`,
`landing.contact.*Title`, `landing.package.includesTitle`) üç dilde cümle
düzenine; `booking.step1/2/3` numarasız ("Hizmet", "Berber", "Gün ve saat");
`panel.today.heading` orta noktasız ("Bugün, {date}"); yeni anahtarlar
`booking.change`, `booking.summaryTitle`, `panel.nav.groupDaily`,
`panel.nav.groupManage`, `panel.common.new`. Parite testi üç dosyayı
aynı anahtar kümesinde tutar.

## 5. Test ve doğrulama

- **E2e** (Pixel 7 profili, yani telefon): `landing.spec` ve `booking.spec`
  yeni metin ve yapıya uyarlanır: başlık adları cümle düzeni, adım bölümü
  seçicisi `data-step="3"` özniteliğiyle, saat ızgarası `data-slots`
  ile, "Bugün ·" yerine "Bugün" metni. Harita düğmesi ada göre bulunur
  (`.label` kalkınca büyük harf sorunu da kalkar).
- **Birim:** `messages.test` paritesi, `icon-svg.test`, `motion-utils.test`
  (yalnızca hero için kalır) geçer.
- **Lint ve typecheck** temiz.
- **Görsel kontrol:** her yüzey için 390 px ve 1440 px, açık ve koyu
  ekran görüntüsü alınır; kenar hizası, kırılma ve kontrast gözle
  doğrulanır. Hero kontrastı yeniden ölçülür (en düşük 4.5:1).
- **Lighthouse:** ana sayfa performans puanı düşmez (Bebas ve CountUp
  kalkınca yük azalır).

## 6. Riskler

- Çeviri değerlerinin değişmesi e2e metin eşleşmelerini kırar; testler
  aynı commit'te güncellenir.
- `SiteHeader`'ın kalkması `(musteri)` yerleşimini değiştirir; ana sayfa
  kendi `SiteNav`'ını çizdiği için yerleşimde `pathname === "/"` denetimi
  kalır, yalnızca bileşen tekleşir.
- Panel köşe kuralı için `--radius` kabukta yeniden tanımlanır; shadcn
  `radius-*` türevleri bundan beslendiği için ek sınıf gerekmez.
