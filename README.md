# Afro Salon Modern

Tek bir afro berber salonu için aynı gün randevu sistemi. Next.js 16 + Prisma 7 + PostgreSQL.

## Başlangıç / Geliştirme

```bash
cp .env.example .env        # AUTH_SECRET'ı openssl rand -base64 32 ile üret
docker compose up -d
npm install
npm run db:migrate
npm run db:seed             # admin@afrosalon.local / SEED_PASSWORD (varsayılan: Sifre123!)
npm run dev
```

http://localhost:3000 adresinde açılır.

## Rotalar

- `/` — landing page (salon tanıtımı, hizmetler, ekip, galeri, iletişim)
- `/randevu` — 3 adımlı randevu akışı (hizmet → berber → saat)
- `/randevularim` — müşterinin bugünkü ve geçmiş randevuları
- `/panel` — berber ve admin paneli

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
| R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET | Cloudflare R2; bucket public erişim açık ve CORS'ta PUT izinli olmalı |
| NEXT_PUBLIC_R2_PUBLIC_URL | R2 public alan adı; tarayıcıda da okunduğu için NEXT_PUBLIC_ önekli. `next.config.ts` içindeki `remotePatterns` ile uyumlu olmalı |
| SEED_PASSWORD | Seed kullanıcılarının şifresi; boşsa geliştirmede `Sifre123!` kullanılır, `NODE_ENV=production` ise seed hata verir |

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

## Fotoğraflar

Landing page'deki görsel alanlar `public/landing/` altındaki dosyalardan
okunur. Dosya yoksa yerine afrika geometrik desenli zarif bir yer tutucu
render edilir; kırık görsel çıkmaz. Fotoğrafları eklemek için dosyaları
aşağıdaki adlarla bu klasöre koy:

| Dosya | Yer | Öneri |
|---|---|---|
| `public/landing/hero.jpg` | Hero görseli | Dikey, 4:5, en az 1200px genişlik |
| `public/landing/gallery-1.jpg` … `gallery-8.jpg` | Galeri ızgarası | Kare (1:1), en az 800×800 |

Galeri önce veritabanındaki kesim fotoğraflarını (en yeni 8 `HaircutPhoto`)
gösterir; kayıt yoksa `public/landing/gallery-N.jpg` dosyalarına, onlar da
yoksa desenli yer tutuculara düşer.

Berber profil fotoğrafları bu klasörden değil, R2'den (`Barber.photoKey`)
gelir; seed verisi `public/seed/` altındaki yer tutucuları kullanır.
