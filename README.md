# Afro Salon Modern

Tek bir afro berber salonu için aynı gün randevu sistemi. Next.js App Router,
Prisma + PostgreSQL, Auth.js, Tailwind CSS v4.

## Başlangıç

```bash
docker compose up -d        # Postgres
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

http://localhost:3000 adresinde açılır.

- `/` — landing page (salon tanıtımı, hizmetler, ekip, galeri, iletişim)
- `/randevu` — 3 adımlı randevu akışı (hizmet → berber → saat)
- `/randevularim` — müşterinin bugünkü ve geçmiş randevuları
- `/panel` — berber ve admin paneli

## Test

```bash
npm test                 # birim testleri (Vitest)
npm run test:integration # entegrasyon testleri (test veritabanı gerekir)
npm run typecheck
npm run lint
```

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
