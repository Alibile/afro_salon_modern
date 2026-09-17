# Afro Salon Modern: Randevu Sistemi Tasarımı

Tarih: 2026-09-17
Durum: Onaylandı

## 1. Amaç ve kapsam

Tek bir modern afro berber salonu için web tabanlı randevu sistemi. Müşteriler
**sadece bugün için, şu andan sonraki** saatlere randevu alır. Salonda birden
fazla berber çalışır, müşteri berberini seçer. Berberler ve admin aynı
uygulamadaki panelden randevuları, hizmetleri, çalışma saatlerini ve izinleri
yönetir; müşteri profillerine en fazla 4 kesim fotoğrafı ekler.

### Kapsam içi (v1)

- Müşteri kayıt/giriş (e-posta + şifre), randevu alma, iptal, geçmiş görüntüleme
- Hizmet listesi (ad, süre, fiyat), çoklu hizmet seçimi
- Berber seçimi, berber başına çalışma saatleri ve izinler
- Aynı gün slot hesabı, çakışma koruması
- Admin/berber paneli: bugün ekranı, randevular, hizmetler, berberler, izinler,
  müşteriler, ayarlar
- Kesim fotoğrafı geçmişi: müşteri başına en fazla 4, en eski otomatik silinir
- E-posta bildirimleri (onay, iptal, berbere yeni randevu)
- Light/dark mod, mobil öncelikli arayüz

### Kapsam dışı (v1)

Gelecek günlere randevu, WhatsApp/SMS, ödeme/depozito, walk-in kuyruğu,
bekleme listesi, çoklu dükkan, Google girişi, self-servis şifre sıfırlama
(admin elle sıfırlar), hatırlatma e-postası.

## 2. Teknoloji

| Katman | Seçim |
|---|---|
| Framework | Next.js 15, App Router, TypeScript, tek proje (UI + API) |
| Veritabanı | PostgreSQL, Prisma ORM |
| Kimlik | Auth.js v5 (Credentials provider, Prisma adapter), rol session'da |
| UI | Tailwind CSS v4, shadcn/ui, lucide ikonlar |
| Doğrulama | Zod (istemci + sunucu) |
| E-posta | Resend + React Email |
| Dosya | Cloudflare R2 (S3 uyumlu), presigned URL ile doğrudan yükleme |
| Test | Vitest (birim + entegrasyon), Playwright (uçtan uca, az sayıda) |
| Lokal | Docker Compose ile Postgres |
| Deploy | Vercel + Neon Postgres + Cloudflare R2 |

Saat dilimi: tüm hesaplar `Europe/Istanbul`, DB'de UTC saklanır.

## 3. Veri modeli

**User**: id, name, email (unique), passwordHash, phone?, role
(`CUSTOMER` | `BARBER` | `ADMIN`), createdAt.

**Barber**: id, userId (1-1 User), displayName, bio?, avatarUrl?, isActive.

**Service**: id, name, durationMinutes, priceKurus (integer), isActive,
sortOrder. Silme yok, pasife alınır.

**WorkingHours**: id, barberId, dayOfWeek (0=Pazar … 6=Cumartesi), startTime
("09:00"), endTime ("19:00"), isOff. Aynı güne birden fazla satır olabilir
(öğle arası için). Varsayılan seed: Pzt-Cmt 09:00-19:00, Pazar `isOff=true`.

**TimeOff**: id, barberId, startsAt, endsAt (datetime), reason?.

**Appointment**: id, customerId, barberId, startsAt, endsAt, status
(`SCHEDULED` | `COMPLETED` | `CANCELLED` | `NO_SHOW`), cancelledBy?
(`CUSTOMER` | `STAFF`), notes?, createdAt. `endsAt` hizmet sürelerinin
toplamından hesaplanıp saklanır.

**AppointmentService**: id, appointmentId, serviceId, nameSnapshot,
durationSnapshot, priceSnapshot.

**HaircutPhoto**: id, customerId, barberId, appointmentId?, storageKey,
createdAt. Müşteri başına en fazla 4; 5. eklenince en eskisi DB ve R2'den
silinir (uygulama katmanı, transaction içinde).

**Settings** (tek satır): shopName, address, phone, cancellationWindowMinutes
(varsayılan 120), minLeadMinutes (varsayılan 15), slotStepMinutes (varsayılan
15), timezone (`Europe/Istanbul`), notifyBarberOnBooking (varsayılan true).

**Kısıt**: Aynı berber için `status = 'SCHEDULED'` iken `tstzrange(startsAt,
endsAt)` çakışamaz. PostgreSQL `btree_gist` eklentisi ile exclusion constraint,
Prisma migration'ına ham SQL olarak eklenir. Uygulama kontrolü ek olarak yapılır
ama tek güvence bu constraint'tir.

## 4. Müşteri akışı

Ana sayfa (`/`) doğrudan randevu alma ekranıdır. Üstte dükkan adı, adres,
telefon; altında 3 adımlı wizard:

1. **Hizmet seç**: aktif hizmetler, çoklu seçim, toplam süre/fiyat anlık.
2. **Berber seç**: aktif berber kartları (foto, ad, bio, son 3 kesim fotoğrafı).
3. **Saat seç ve onayla**: bugünün uygun başlangıç saatleri buton olarak.
   Giriş yoksa burada giriş/kayıt formu açılır, seçimler korunur (URL query).
   "Randevuyu Onayla" → kayıt → onay e-postası → `/randevularim`.

Pazar veya mesai bittiyse: "Bugün için randevu alınamıyor, yarın {açılış}
itibarıyla tekrar deneyin."

### Slot hesabı (`src/lib/availability.ts`)

Saf fonksiyon, DB bağımsız.

Girdi: bugünün WorkingHours satırları, bugünün TimeOff'ları, bugünün
SCHEDULED randevuları, istenen toplam süre (dk), slotStepMinutes,
minLeadMinutes, `now`.

Çıktı: geçerli başlangıç zamanları listesi.

Kural: her çalışma aralığında `slotStep` adımlarla ilerle; `[start, start +
süre)` aralığı (a) çalışma aralığının içinde kalıyorsa, (b) hiçbir TimeOff ile
kesişmiyorsa, (c) hiçbir randevu ile kesişmiyorsa, (d) `start >= now +
minLead` ise geçerlidir.

### Randevu oluşturma (server action `createAppointment`)

1. Zod doğrulama (serviceIds, barberId, startsAt).
2. Seçilen slot yeniden hesaplanır, hâlâ uygun değilse hata.
3. Transaction: Appointment + AppointmentService (snapshot) yazılır.
4. Exclusion constraint ihlali yakalanır → "Bu saat az önce doldu, başka saat
   seçin", slotlar yenilenir.
5. Resend ile onay e-postası; e-posta hatası randevuyu geri almaz, loglanır.

### Randevularım (`/randevularim`)

Bugünkü randevu üstte büyük; "İptal et" butonu sadece `startsAt -
cancellationWindowMinutes > now` ise görünür, aksi halde "İptal için dükkanı
arayın: {telefon}". Altında geçmiş randevular ve müşterinin kesim fotoğrafları.

## 5. Panel (`/panel/...`)

### Roller

- `ADMIN`: her şey.
- `BARBER`: sadece kendi takvimi, kendi izinleri, kendi müşterilerinin
  fotoğrafları. Hizmet/berber/ayar yönetimi yok.
- Yetki: middleware rota bazlı, her server action başında veri bazlı (berber
  başkasının randevusuna dokunamaz).

### Sayfalar

1. **Bugün** (`/panel`): berber başına sütun, saat ekseni, bugünün
   randevuları. Tıklayınca detay + aksiyonlar: Tamamlandı, Gelmedi, İptal
   (sebep opsiyonel). 60 sn'de bir yenilenir.
2. **Randevular** (`/panel/randevular`): tüm kayıtlar, tarih/berber/durum
   filtresi.
3. **Hizmetler** (`/panel/hizmetler`, admin): CRUD, aktif/pasif, sıra numarası.
4. **Berberler** (`/panel/berberler`, admin): ekle (ad, e-posta, geçici şifre,
   foto), aktif/pasif, 7 günlük çalışma saati grid'i.
5. **İzinler** (`/panel/izinler`): saat aralığı veya tam gün. Mevcut randevuyla
   çakışırsa uyarır, engellemez.
6. **Müşteriler** (`/panel/musteriler`): arama, detayda geçmiş + fotoğraf
   galerisi, fotoğraf yükleme (R2 presign → yükle → `addPhoto` action → 4
   sınırı uygula).
7. **Ayarlar** (`/panel/ayarlar`, admin): Settings alanları.

Giriş `/giris` ortak; rol BARBER/ADMIN ise `/panel`'e yönlenir. İlk admin seed
ile oluşturulur.

## 6. Görsel tasarım

- **Afrika esintili yumuşak palet**: terracotta (birincil), hardal/ochre
  (vurgu), sıcak kum bej (açık zemin), derin kahve (koyu zemin ve metin),
  zeytin yeşili (başarı/ikincil vurgu). Sert siyah yok.
- **Light/dark mod**: sistem tercihine göre otomatik, üstte manuel anahtar.
  Tailwind CSS değişkenleriyle tek yerden tanımlı.
- **Tipografi**: başlıklarda karakterli display font (Google Fonts), gövdede
  Inter. Basit, sade, bol boşluk.
- **Mobil öncelikli**: büyük dokunma alanları, masaüstünde ortalanmış dar
  kolon. Yatay kaydırma yok.
- **Panel**: nötr, shadcn/ui varsayılanları, aynı palet daha soluk.

## 7. E-posta

- Randevu onayı → müşteri (berber, saat, hizmetler, toplam, iptal linki).
- İptal → müşteri (kim iptal etti).
- Yeni randevu → berber (ayarlardan kapatılabilir).
- React Email şablonları, Türkçe.

## 8. Hata yönetimi

- Zod hem istemci hem sunucu, mesajlar Türkçe.
- Server action'lar `{ ok: true, data } | { ok: false, error }` döner.
- Çakışma → "Bu saat az önce doldu", slot listesi yenilenir.
- E-posta / R2 hatası işlemi geri almaz, loglanır.
- Yetkisiz → 403; oturumsuz → `/giris?next=...`.

## 9. Proje yapısı

```
prisma/schema.prisma, migrations/, seed.ts
src/app/
  (musteri)/page.tsx, randevularim/
  (auth)/giris/, kayit/
  panel/ bugun, randevular, hizmetler, berberler, izinler, musteriler, ayarlar
  api/upload/presign/
src/lib/ availability.ts, auth.ts, db.ts, storage.ts, email/
src/actions/ appointments, services, barbers, timeoff, photos, settings
src/components/ ui/, booking/, panel/
tests/ unit/, integration/, e2e/
```

## 10. Test stratejisi

- **Birim (Vitest)**: `availability.ts` senaryoları: normal gün, öğle arası,
  izin çakışması, randevu çakışması, mesai sonu taşması, `now` öncesi slotların
  düşmesi, pazar, slot adımı değişimi, gün dönümü. Ayrıca 4 fotoğraf kuralı,
  iptal penceresi hesabı.
- **Entegrasyon (Vitest + test Postgres)**: randevu oluştur; çakışan ikinci
  randevu constraint'e takılır; berber başkasının randevusunu iptal edemez;
  hizmet snapshot korunur; 5. fotoğraf en eskiyi siler.
- **Uçtan uca (Playwright)**: kayıt → randevu al → panelde gör → tamamla;
  iptal akışı.
- TDD: önce test, sonra kod.

## 11. Ortam

`docker-compose.yml` (Postgres), `.env.example` (DATABASE_URL, AUTH_SECRET,
RESEND_API_KEY, R2_* anahtarları), `npm run dev`. Seed: admin kullanıcı,
örnek 2 berber, 4 hizmet, varsayılan çalışma saatleri.
