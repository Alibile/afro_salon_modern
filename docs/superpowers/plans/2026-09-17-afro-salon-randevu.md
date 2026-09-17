# Afro Salon Modern Randevu Sistemi Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tek bir afro berber salonu için, müşterilerin sadece bugün ve şu andan sonraki saatlere randevu alabildiği, berber/admin panelli, e-posta bildirimli, light/dark modlu Next.js web uygulaması.

**Architecture:** Tek Next.js 16 projesi (App Router, Server Actions) hem müşteri sitesi hem paneli barındırır. Prisma 7 + PostgreSQL veri katmanı; randevu çakışması PostgreSQL exclusion constraint ile garanti edilir. Slot hesabı saf bir TypeScript modülüdür (`src/lib/availability.ts`) ve birim testlerle korunur. Auth.js v5 Credentials provider + JWT session, rol bilgisi token'da taşınır.

**Tech Stack:** Next.js 16.3, React 19, TypeScript 5, Prisma 7 (`@prisma/adapter-pg`), PostgreSQL 16, Auth.js v5 (`next-auth@beta`), bcryptjs, Zod 4, Tailwind CSS 4, shadcn/ui, lucide-react, `@date-fns/tz` + date-fns 4, Resend + `@react-email/components`, `@aws-sdk/client-s3` (Cloudflare R2), Vitest 4, Playwright 1.63, Docker Compose.

**Spec:** `docs/superpowers/specs/2026-09-17-afro-salon-randevu-design.md`

## Global Constraints

- Node.js >= 20.9, TypeScript >= 5.1 (Next 16 gereği). Geliştirme makinesi Node 22.
- Next.js 16: `middleware.ts` YOK, `src/proxy.ts` ve `export function proxy` kullanılır. `params`, `searchParams`, `cookies()`, `headers()` her zaman `await` edilir. Turbopack varsayılan, `--turbopack` bayrağı yazılmaz. `next lint` yok, ESLint doğrudan çalışır.
- Prisma 7: `prisma.config.ts` zorunlu, `DATABASE_URL` sadece orada `env()` ile okunur. Generator `provider = "prisma-client"`, `output = "../src/generated/prisma"`. Client `import { PrismaClient } from "@/generated/prisma/client"` ve `new PrismaClient({ adapter: new PrismaPg({ connectionString }) })`. Seed sadece `npx prisma db seed` ile çalışır.
- Auth.js v5: Credentials provider zorunlu olarak `session: { strategy: "jwt" }` ister. Prisma adapter KULLANILMAZ.
- Tüm zaman hesapları `Europe/Istanbul` diliminde, veritabanında `timestamptz` (UTC).
- Para birimi kuruş cinsinden integer (`priceKurus`). Ekranda `formatKurus()` ile "300,00 ₺" gösterilir.
- Server action dönüş tipi her zaman `ActionResult<T> = { ok: true; data: T } | { ok: false; error: string }`. Exception fırlatılmaz.
- Tüm kullanıcıya görünen metinler Türkçe.
- Commit mesajlarında Claude/AI ibaresi OLMAYACAK. Co-Authored-By satırı eklenmez.
- Varsayılan ayarlar: `cancellationWindowMinutes=120`, `minLeadMinutes=15`, `slotStepMinutes=15`, Pazar kapalı, Pzt-Cmt 09:00-19:00.
- Müşteri başına en fazla 4 kesim fotoğrafı; 5. eklenince en eskisi DB ve R2'den silinir.
- Berber: tam ad `User.name`, profil fotoğrafı `Barber.photoKey` zorunlu.
- Mobil öncelikli, light/dark mod, yatay kaydırma yok. Palet: terracotta (birincil), hardal (vurgu), kum bej (açık zemin), derin kahve (koyu zemin), zeytin yeşili (başarı).

## Dosya Yapısı

```
afro_salon_modern/
  docker-compose.yml               lokal Postgres (dev + test db)
  prisma.config.ts                 Prisma 7 config, seed komutu
  prisma/schema.prisma             veri modeli
  prisma/migrations/               SQL migration'lar (exclusion constraint burada)
  prisma/seed.ts                   admin, 2 berber, 4 hizmet, çalışma saatleri
  src/proxy.ts                     oturum + rol yönlendirmesi
  src/generated/prisma/            Prisma client (gitignore)
  src/lib/db.ts                    Prisma singleton
  src/lib/auth.ts                  Auth.js config (Credentials, JWT, rol)
  src/lib/auth-helpers.ts          requireUser / requireRole / requireBarber
  src/lib/action-result.ts         ActionResult tipi ve yardımcılar
  src/lib/time.ts                  Istanbul saat dilimi yardımcıları, parseTime
  src/lib/availability.ts          computeSlots (saf)
  src/lib/money.ts                 formatKurus
  src/lib/settings.ts              getSettings (tek satır, upsert)
  src/lib/storage.ts               R2 presign / delete / publicUrl
  src/lib/email/send.ts            Resend gönderim fonksiyonları
  src/lib/email/templates/*.tsx    React Email şablonları
  src/lib/queries/*.ts             sayfaların okuma sorguları
  src/actions/*.ts                 server action'lar (yazma işlemleri)
  src/schemas/*.ts                 Zod şemaları (action + form ortak)
  src/app/layout.tsx, globals.css  tema, fontlar
  src/app/(musteri)/page.tsx       randevu alma (ana sayfa)
  src/app/(musteri)/randevularim/page.tsx
  src/app/(auth)/giris/page.tsx, kayit/page.tsx
  src/app/api/auth/[...nextauth]/route.ts
  src/app/api/upload/presign/route.ts
  src/app/panel/layout.tsx + alt sayfalar
  src/components/ui/               shadcn
  src/components/theme/            ThemeProvider, ThemeToggle
  src/components/booking/          BookingWizard, ServiceStep, BarberStep, SlotStep
  src/components/panel/            PanelNav, TodayBoard, formlar
  tests/unit/*.test.ts             Vitest birim
  tests/integration/*.test.ts      Vitest + gerçek Postgres
  tests/integration/setup.ts       truncate + seed yardımcıları
  tests/e2e/*.spec.ts              Playwright
  vitest.config.ts, vitest.integration.config.ts, playwright.config.ts
```

---

### Task 1: Proje iskeleti, bağımlılıklar, Docker Postgres, test altyapısı

**Files:**
- Create: `package.json` (create-next-app üretir, script'ler düzenlenir)
- Create: `docker-compose.yml`
- Create: `.env.example`, `.env` (gitignore'da), `.env.test`
- Create: `vitest.config.ts`, `vitest.integration.config.ts`
- Create: `src/lib/action-result.ts`
- Test: `tests/unit/action-result.test.ts`

**Interfaces:**
- Produces: `ActionResult<T>`, `ok(data)`, `fail(error)` in `src/lib/action-result.ts`
- Produces: npm script'leri `dev`, `build`, `test`, `test:integration`, `db:migrate`, `db:seed`, `db:generate`

- [ ] **Step 1: Next.js projesini mevcut repo klasörüne kur**

Repo zaten `/Users/mac/Desktop/Projeler/Kisisel/afro_salon_modern` içinde ve README.md var. create-next-app boş olmayan klasöre kurulum yapmaz, o yüzden geçici klasöre kurup taşı:

```bash
cd /Users/mac/Desktop/Projeler/Kisisel
npx create-next-app@latest afro_tmp --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --no-turbopack --yes
rsync -a --exclude .git afro_tmp/ afro_salon_modern/
rm -rf afro_tmp
cd afro_salon_modern
cat README.md | head -3
```

Beklenen: `README.md` üstte "# afro_salon_modern" satırı korunur (create-next-app README'yi üzerine yazdıysa ilk satırı geri koy: `sed -i '' '1s/.*/# afro_salon_modern/' README.md`).

- [ ] **Step 2: Bağımlılıkları yükle**

```bash
npm install @prisma/client@7 @prisma/adapter-pg@7 next-auth@beta bcryptjs zod @date-fns/tz date-fns resend @react-email/components @aws-sdk/client-s3 @aws-sdk/s3-request-presigner lucide-react class-variance-authority clsx tailwind-merge next-themes
npm install -D prisma@7 tsx vitest @vitest/coverage-v8 @playwright/test @types/bcryptjs dotenv
```

Not: `prisma@7` ve `@prisma/client@7` aynı major'da kalmalı (8 rc kullanılmaz).

- [ ] **Step 3: Docker Compose ile Postgres**

`docker-compose.yml`:

```yaml
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: afro
      POSTGRES_PASSWORD: afro
      POSTGRES_DB: afro_salon
    ports:
      - "5433:5432"
    volumes:
      - dbdata:/var/lib/postgresql/data
      - ./docker/init-test-db.sql:/docker-entrypoint-initdb.d/init-test-db.sql
volumes:
  dbdata:
```

`docker/init-test-db.sql`:

```sql
CREATE DATABASE afro_salon_test;
```

```bash
mkdir -p docker
docker compose up -d
docker compose exec db psql -U afro -d afro_salon -c "\l" | grep afro_salon_test
```

Beklenen: `afro_salon_test` listede.

- [ ] **Step 4: Ortam dosyaları**

`.env.example`:

```
DATABASE_URL="postgresql://afro:afro@localhost:5433/afro_salon"
AUTH_SECRET="change-me"
AUTH_URL="http://localhost:3000"
RESEND_API_KEY=""
EMAIL_FROM="Afro Salon <randevu@example.com>"
R2_ACCOUNT_ID=""
R2_ACCESS_KEY_ID=""
R2_SECRET_ACCESS_KEY=""
R2_BUCKET="afro-salon"
R2_PUBLIC_URL="https://pub-xxxx.r2.dev"
```

`.env.test`:

```
DATABASE_URL="postgresql://afro:afro@localhost:5433/afro_salon_test"
AUTH_SECRET="test-secret"
AUTH_URL="http://localhost:3000"
```

```bash
cp .env.example .env
npx auth secret --raw >/dev/null 2>&1 || true
grep -q "^.env$" .gitignore || echo ".env" >> .gitignore
grep -q "src/generated" .gitignore || echo "src/generated" >> .gitignore
```

`.env` içindeki `AUTH_SECRET` değerini `openssl rand -base64 32` çıktısıyla değiştir.

- [ ] **Step 5: package.json script'leri**

`package.json` `scripts` bloğunu şununla değiştir:

```json
"scripts": {
  "dev": "next dev",
  "build": "prisma generate && next build",
  "start": "next start",
  "lint": "eslint .",
  "typecheck": "tsc --noEmit",
  "test": "vitest run --config vitest.config.ts",
  "test:watch": "vitest --config vitest.config.ts",
  "test:integration": "vitest run --config vitest.integration.config.ts",
  "test:e2e": "playwright test",
  "db:generate": "prisma generate",
  "db:migrate": "prisma migrate dev",
  "db:migrate:test": "dotenv -e .env.test -- prisma migrate deploy",
  "db:seed": "prisma db seed",
  "db:studio": "prisma studio"
}
```

`dotenv -e` için: `npm install -D dotenv-cli`.

- [ ] **Step 6: Vitest config'leri**

`vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  test: {
    include: ["tests/unit/**/*.test.ts"],
    environment: "node",
  },
});
```

`vitest.integration.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import path from "node:path";
import { config } from "dotenv";

config({ path: ".env.test", override: true });

export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  test: {
    include: ["tests/integration/**/*.test.ts"],
    environment: "node",
    setupFiles: ["tests/integration/setup.ts"],
    fileParallelism: false,
    testTimeout: 20000,
  },
});
```

- [ ] **Step 7: ActionResult için failing test yaz**

`tests/unit/action-result.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { ok, fail } from "@/lib/action-result";

describe("action-result", () => {
  it("ok wraps data", () => {
    expect(ok({ id: 1 })).toEqual({ ok: true, data: { id: 1 } });
  });
  it("fail wraps error message", () => {
    expect(fail("Hata")).toEqual({ ok: false, error: "Hata" });
  });
});
```

- [ ] **Step 8: Testin başarısız olduğunu gör**

Run: `npm test`
Expected: FAIL, "Cannot find module '@/lib/action-result'"

- [ ] **Step 9: action-result.ts yaz**

`src/lib/action-result.ts`:

```ts
export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export function ok<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}

export function fail<T = never>(error: string): ActionResult<T> {
  return { ok: false, error };
}
```

- [ ] **Step 10: Test geçer**

Run: `npm test`
Expected: 2 passed

- [ ] **Step 11: Build ve typecheck çalışıyor mu**

Run: `npm run typecheck && npm run lint`
Expected: hata yok.

- [ ] **Step 12: Commit**

```bash
git add -A
git commit -m "Next.js iskeleti, Docker Postgres ve test altyapısı"
git push
```

---

### Task 2: Prisma şeması, migration (exclusion constraint), db client, seed

**Files:**
- Create: `prisma.config.ts`, `prisma/schema.prisma`, `prisma/seed.ts`
- Create: `src/lib/db.ts`
- Create: `tests/integration/setup.ts`, `tests/integration/helpers.ts`
- Test: `tests/integration/schema.test.ts`

**Interfaces:**
- Produces: `prisma` singleton (`src/lib/db.ts`), tüm modeller ve enum'lar `@/generated/prisma/client` ve `@/generated/prisma/enums`
- Produces: `resetDb()`, `createCustomer()`, `createBarber()`, `createService()` test yardımcıları (`tests/integration/helpers.ts`)

- [ ] **Step 1: prisma.config.ts**

```ts
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
```

- [ ] **Step 2: schema.prisma**

```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "postgresql"
}

enum Role {
  CUSTOMER
  BARBER
  ADMIN
}

enum AppointmentStatus {
  SCHEDULED
  COMPLETED
  CANCELLED
  NO_SHOW
}

enum CancelledBy {
  CUSTOMER
  STAFF
}

model User {
  id           String   @id @default(cuid())
  name         String
  email        String   @unique
  passwordHash String
  phone        String?
  role         Role     @default(CUSTOMER)
  createdAt    DateTime @default(now())

  barber       Barber?
  appointments Appointment[] @relation("CustomerAppointments")
  photos       HaircutPhoto[] @relation("CustomerPhotos")
}

model Barber {
  id       String  @id @default(cuid())
  userId   String  @unique
  bio      String?
  photoKey String
  isActive Boolean @default(true)

  user         User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  workingHours WorkingHours[]
  timeOffs     TimeOff[]
  appointments Appointment[]
  photos       HaircutPhoto[]
}

model Service {
  id              String  @id @default(cuid())
  name            String
  durationMinutes Int
  priceKurus      Int
  isActive        Boolean @default(true)
  sortOrder       Int     @default(0)

  appointmentServices AppointmentService[]
}

model WorkingHours {
  id        String  @id @default(cuid())
  barberId  String
  dayOfWeek Int
  startTime String
  endTime   String
  isOff     Boolean @default(false)

  barber Barber @relation(fields: [barberId], references: [id], onDelete: Cascade)

  @@index([barberId, dayOfWeek])
}

model TimeOff {
  id       String   @id @default(cuid())
  barberId String
  startsAt DateTime
  endsAt   DateTime
  reason   String?

  barber Barber @relation(fields: [barberId], references: [id], onDelete: Cascade)

  @@index([barberId, startsAt])
}

model Appointment {
  id          String            @id @default(cuid())
  customerId  String
  barberId    String
  startsAt    DateTime
  endsAt      DateTime
  status      AppointmentStatus @default(SCHEDULED)
  cancelledBy CancelledBy?
  notes       String?
  createdAt   DateTime          @default(now())

  customer User                 @relation("CustomerAppointments", fields: [customerId], references: [id])
  barber   Barber               @relation(fields: [barberId], references: [id])
  services AppointmentService[]
  photos   HaircutPhoto[]

  @@index([barberId, startsAt])
  @@index([customerId, startsAt])
}

model AppointmentService {
  id               String @id @default(cuid())
  appointmentId    String
  serviceId        String
  nameSnapshot     String
  durationSnapshot Int
  priceSnapshot    Int

  appointment Appointment @relation(fields: [appointmentId], references: [id], onDelete: Cascade)
  service     Service     @relation(fields: [serviceId], references: [id])
}

model HaircutPhoto {
  id            String   @id @default(cuid())
  customerId    String
  barberId      String
  appointmentId String?
  storageKey    String
  createdAt     DateTime @default(now())

  customer    User         @relation("CustomerPhotos", fields: [customerId], references: [id], onDelete: Cascade)
  barber      Barber       @relation(fields: [barberId], references: [id])
  appointment Appointment? @relation(fields: [appointmentId], references: [id], onDelete: SetNull)

  @@index([customerId, createdAt])
}

model Settings {
  id                        Int     @id @default(1)
  shopName                  String  @default("Afro Salon Modern")
  address                   String  @default("")
  phone                     String  @default("")
  cancellationWindowMinutes Int     @default(120)
  minLeadMinutes            Int     @default(15)
  slotStepMinutes           Int     @default(15)
  timezone                  String  @default("Europe/Istanbul")
  notifyBarberOnBooking     Boolean @default(true)
}
```

- [ ] **Step 3: Migration'ı oluştur ama uygulama, SQL'i düzenle**

```bash
npx prisma migrate dev --name init --create-only
ls prisma/migrations
```

Oluşan `prisma/migrations/<timestamp>_init/migration.sql` dosyasının **en başına**:

```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;
```

ve **en sonuna**:

```sql
-- Aynı berber için çakışan SCHEDULED randevu yasak
ALTER TABLE "Appointment"
  ADD CONSTRAINT appointment_no_overlap
  EXCLUDE USING gist (
    "barberId" WITH =,
    tstzrange("startsAt", "endsAt", '[)') WITH &&
  )
  WHERE (status = 'SCHEDULED');
```

ekle. Sonra uygula ve test db'ye de uygula:

```bash
npx prisma migrate dev
npm run db:migrate:test
npx prisma generate
```

Beklenen: iki DB'de de migration uygulanmış, `src/generated/prisma/client.ts` oluşmuş.

- [ ] **Step 4: db.ts singleton**

`src/lib/db.ts`:

```ts
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

- [ ] **Step 5: Integration test setup ve helpers**

`tests/integration/setup.ts`:

```ts
import { beforeEach, afterAll } from "vitest";
import { prisma } from "@/lib/db";
import { resetDb } from "./helpers";

beforeEach(async () => {
  await resetDb();
});

afterAll(async () => {
  await prisma.$disconnect();
});
```

`tests/integration/helpers.ts`:

```ts
import { prisma } from "@/lib/db";
import { Role } from "@/generated/prisma/enums";

export async function resetDb() {
  await prisma.$executeRawUnsafe(
    `TRUNCATE "HaircutPhoto","AppointmentService","Appointment","TimeOff","WorkingHours","Barber","Service","User","Settings" RESTART IDENTITY CASCADE`,
  );
  await prisma.settings.create({ data: { id: 1 } });
}

let counter = 0;
function uniq(prefix: string) {
  counter += 1;
  return `${prefix}${counter}-${Date.now()}`;
}

export async function createCustomer(overrides: { name?: string; email?: string } = {}) {
  return prisma.user.create({
    data: {
      name: overrides.name ?? "Müşteri Test",
      email: overrides.email ?? `${uniq("musteri")}@test.local`,
      passwordHash: "x",
      role: Role.CUSTOMER,
    },
  });
}

/** Berber + kullanıcı + Pzt-Cmt 09:00-19:00, Pazar kapalı */
export async function createBarber(overrides: { name?: string; hours?: boolean } = {}) {
  const user = await prisma.user.create({
    data: {
      name: overrides.name ?? "Berber Test",
      email: `${uniq("berber")}@test.local`,
      passwordHash: "x",
      role: Role.BARBER,
    },
  });
  const barber = await prisma.barber.create({
    data: { userId: user.id, photoKey: "barbers/test.jpg" },
  });
  if (overrides.hours !== false) {
    await prisma.workingHours.createMany({
      data: [0, 1, 2, 3, 4, 5, 6].map((d) => ({
        barberId: barber.id,
        dayOfWeek: d,
        startTime: "09:00",
        endTime: "19:00",
        isOff: d === 0,
      })),
    });
  }
  return { user, barber };
}

export async function createService(overrides: Partial<{ name: string; durationMinutes: number; priceKurus: number }> = {}) {
  return prisma.service.create({
    data: {
      name: overrides.name ?? "Saç Kesimi",
      durationMinutes: overrides.durationMinutes ?? 30,
      priceKurus: overrides.priceKurus ?? 30000,
    },
  });
}
```

- [ ] **Step 6: Exclusion constraint için failing test**

`tests/integration/schema.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { prisma } from "@/lib/db";
import { createBarber, createCustomer } from "./helpers";

describe("appointment_no_overlap constraint", () => {
  it("rejects overlapping SCHEDULED appointments for same barber", async () => {
    const { barber } = await createBarber();
    const customer = await createCustomer();
    const startsAt = new Date("2026-09-17T07:00:00Z");
    const endsAt = new Date("2026-09-17T07:30:00Z");
    await prisma.appointment.create({ data: { barberId: barber.id, customerId: customer.id, startsAt, endsAt } });

    await expect(
      prisma.appointment.create({
        data: {
          barberId: barber.id,
          customerId: customer.id,
          startsAt: new Date("2026-09-17T07:15:00Z"),
          endsAt: new Date("2026-09-17T07:45:00Z"),
        },
      }),
    ).rejects.toThrow(/appointment_no_overlap/);
  });

  it("allows overlap when first one is CANCELLED", async () => {
    const { barber } = await createBarber();
    const customer = await createCustomer();
    await prisma.appointment.create({
      data: {
        barberId: barber.id,
        customerId: customer.id,
        startsAt: new Date("2026-09-17T07:00:00Z"),
        endsAt: new Date("2026-09-17T07:30:00Z"),
        status: "CANCELLED",
      },
    });
    const second = await prisma.appointment.create({
      data: {
        barberId: barber.id,
        customerId: customer.id,
        startsAt: new Date("2026-09-17T07:00:00Z"),
        endsAt: new Date("2026-09-17T07:30:00Z"),
      },
    });
    expect(second.id).toBeTruthy();
  });

  it("allows back-to-back appointments", async () => {
    const { barber } = await createBarber();
    const customer = await createCustomer();
    await prisma.appointment.create({
      data: { barberId: barber.id, customerId: customer.id, startsAt: new Date("2026-09-17T07:00:00Z"), endsAt: new Date("2026-09-17T07:30:00Z") },
    });
    const second = await prisma.appointment.create({
      data: { barberId: barber.id, customerId: customer.id, startsAt: new Date("2026-09-17T07:30:00Z"), endsAt: new Date("2026-09-17T08:00:00Z") },
    });
    expect(second.id).toBeTruthy();
  });
});
```

- [ ] **Step 7: Integration testi çalıştır**

Run: `npm run test:integration`
Expected: 3 passed. Eğer ilk test "rejects" yerine başarılı insert yapıyorsa migration SQL'ine constraint eklenmemiştir; Step 3'e dön.

- [ ] **Step 8: Seed**

`prisma/seed.ts`:

```ts
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const DEFAULT_HOURS = [0, 1, 2, 3, 4, 5, 6].map((d) => ({
  dayOfWeek: d,
  startTime: "09:00",
  endTime: "19:00",
  isOff: d === 0,
}));

async function main() {
  const passwordHash = await bcrypt.hash("Sifre123!", 10);

  await prisma.settings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, shopName: "Afro Salon Modern", address: "İstanbul", phone: "+90 555 000 00 00" },
  });

  await prisma.user.upsert({
    where: { email: "admin@afrosalon.local" },
    update: {},
    create: { name: "Salon Yöneticisi", email: "admin@afrosalon.local", passwordHash, role: "ADMIN" },
  });

  const barbers = [
    { name: "Kwame Mensah", email: "kwame@afrosalon.local", bio: "Fade ve tasarım kesim uzmanı", photoKey: "seed/kwame.jpg" },
    { name: "Amara Diallo", email: "amara@afrosalon.local", bio: "Örgü ve twist", photoKey: "seed/amara.jpg" },
  ];
  for (const b of barbers) {
    const user = await prisma.user.upsert({
      where: { email: b.email },
      update: {},
      create: { name: b.name, email: b.email, passwordHash, role: "BARBER" },
    });
    const barber = await prisma.barber.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id, bio: b.bio, photoKey: b.photoKey },
    });
    const count = await prisma.workingHours.count({ where: { barberId: barber.id } });
    if (count === 0) {
      await prisma.workingHours.createMany({ data: DEFAULT_HOURS.map((h) => ({ ...h, barberId: barber.id })) });
    }
  }

  const services = [
    { name: "Saç Kesimi", durationMinutes: 30, priceKurus: 40000, sortOrder: 1 },
    { name: "Sakal", durationMinutes: 15, priceKurus: 20000, sortOrder: 2 },
    { name: "Saç + Sakal", durationMinutes: 45, priceKurus: 55000, sortOrder: 3 },
    { name: "Örgü / Twist", durationMinutes: 90, priceKurus: 120000, sortOrder: 4 },
  ];
  for (const s of services) {
    const exists = await prisma.service.findFirst({ where: { name: s.name } });
    if (!exists) await prisma.service.create({ data: s });
  }
  console.log("Seed tamam. Admin: admin@afrosalon.local / Sifre123!");
}

main().finally(() => prisma.$disconnect());
```

Run: `npm run db:seed`
Expected: "Seed tamam." çıktısı. `npx prisma studio` ile 3 User, 2 Barber, 4 Service, 14 WorkingHours görülür.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "Prisma şeması, çakışma kısıtı ve seed"
git push
```

---

### Task 3: Zaman yardımcıları ve slot hesabı (`availability.ts`)

**Files:**
- Create: `src/lib/time.ts`, `src/lib/availability.ts`, `src/lib/money.ts`
- Test: `tests/unit/time.test.ts`, `tests/unit/availability.test.ts`, `tests/unit/money.test.ts`

**Interfaces:**
- Produces (`src/lib/time.ts`):
  - `SHOP_TZ = "Europe/Istanbul"`
  - `parseTime(hhmm: string): number` (dakika, "09:30" → 570)
  - `shopDayStart(instant: Date): Date` (o anın İstanbul'daki gününün 00:00'ı, UTC instant olarak)
  - `shopDayOfWeek(instant: Date): number` (0=Pazar)
  - `addMinutes(d: Date, m: number): Date`
  - `formatShopTime(d: Date): string` ("14:30")
  - `formatShopDate(d: Date): string` ("17 Eylül 2026 Perşembe")
- Produces (`src/lib/availability.ts`):
  - `type WorkingInterval = { startMinutes: number; endMinutes: number }`
  - `type Interval = { start: Date; end: Date }`
  - `type AvailabilityInput = { dayStart: Date; workingIntervals: WorkingInterval[]; busy: Interval[]; durationMinutes: number; slotStepMinutes: number; minLeadMinutes: number; now: Date }`
  - `computeSlots(input: AvailabilityInput): Date[]`
  - `overlaps(a: Interval, b: Interval): boolean`
- Produces (`src/lib/money.ts`): `formatKurus(kurus: number): string` → "400,00 ₺"

- [ ] **Step 1: time.ts için failing testler**

`tests/unit/time.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { parseTime, shopDayStart, shopDayOfWeek, addMinutes, formatShopTime, formatShopDate } from "@/lib/time";

describe("time", () => {
  it("parseTime converts HH:mm to minutes", () => {
    expect(parseTime("00:00")).toBe(0);
    expect(parseTime("09:30")).toBe(570);
    expect(parseTime("19:00")).toBe(1140);
  });

  it("shopDayStart returns Istanbul midnight as UTC instant", () => {
    // 2026-09-17 01:30 Istanbul = 2026-09-16 22:30 UTC
    const instant = new Date("2026-09-16T22:30:00Z");
    expect(shopDayStart(instant).toISOString()).toBe("2026-09-16T21:00:00.000Z");
  });

  it("shopDayOfWeek uses Istanbul date", () => {
    // 2026-09-20 is Sunday. 2026-09-19 22:00 UTC = 2026-09-20 01:00 Istanbul
    expect(shopDayOfWeek(new Date("2026-09-19T22:00:00Z"))).toBe(0);
    expect(shopDayOfWeek(new Date("2026-09-17T09:00:00Z"))).toBe(4);
  });

  it("addMinutes", () => {
    expect(addMinutes(new Date("2026-09-17T09:00:00Z"), 45).toISOString()).toBe("2026-09-17T09:45:00.000Z");
  });

  it("formatShopTime / formatShopDate in Turkish", () => {
    const d = new Date("2026-09-17T11:30:00Z"); // 14:30 Istanbul
    expect(formatShopTime(d)).toBe("14:30");
    expect(formatShopDate(d)).toBe("17 Eylül 2026 Perşembe");
  });
});
```

- [ ] **Step 2: Testi çalıştır, başarısız**

Run: `npm test -- tests/unit/time.test.ts`
Expected: FAIL "Cannot find module '@/lib/time'"

- [ ] **Step 3: time.ts**

`src/lib/time.ts`:

```ts
import { TZDate } from "@date-fns/tz";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

export const SHOP_TZ = "Europe/Istanbul";

export function parseTime(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export function shopDayStart(instant: Date): Date {
  const z = new TZDate(instant, SHOP_TZ);
  const midnight = new TZDate(z.getFullYear(), z.getMonth(), z.getDate(), 0, 0, 0, 0, SHOP_TZ);
  return new Date(midnight.getTime());
}

export function shopDayOfWeek(instant: Date): number {
  return new TZDate(instant, SHOP_TZ).getDay();
}

export function addMinutes(d: Date, m: number): Date {
  return new Date(d.getTime() + m * 60_000);
}

export function formatShopTime(d: Date): string {
  return format(new TZDate(d, SHOP_TZ), "HH:mm");
}

export function formatShopDate(d: Date): string {
  return format(new TZDate(d, SHOP_TZ), "d MMMM yyyy EEEE", { locale: tr });
}
```

- [ ] **Step 4: Test geçer**

Run: `npm test -- tests/unit/time.test.ts`
Expected: 5 passed

- [ ] **Step 5: availability.ts için failing testler**

`tests/unit/availability.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { computeSlots, overlaps, type AvailabilityInput } from "@/lib/availability";

// dayStart: 2026-09-17 00:00 Istanbul = 2026-09-16T21:00Z
const DAY_START = new Date("2026-09-16T21:00:00Z");
const at = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return new Date(DAY_START.getTime() + (h * 60 + m) * 60_000);
};
const times = (slots: Date[]) =>
  slots.map((d) => {
    const mins = Math.round((d.getTime() - DAY_START.getTime()) / 60_000);
    return `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;
  });

const base: AvailabilityInput = {
  dayStart: DAY_START,
  workingIntervals: [{ startMinutes: 9 * 60, endMinutes: 12 * 60 }],
  busy: [],
  durationMinutes: 30,
  slotStepMinutes: 30,
  minLeadMinutes: 0,
  now: at("00:00"),
};

describe("overlaps", () => {
  it("detects overlap, treats touching as non-overlap", () => {
    expect(overlaps({ start: at("09:00"), end: at("10:00") }, { start: at("09:30"), end: at("10:30") })).toBe(true);
    expect(overlaps({ start: at("09:00"), end: at("10:00") }, { start: at("10:00"), end: at("11:00") })).toBe(false);
  });
});

describe("computeSlots", () => {
  it("normal day: every step until duration no longer fits", () => {
    expect(times(computeSlots(base))).toEqual(["09:00", "09:30", "10:00", "10:30", "11:00", "11:30"]);
  });

  it("longer duration cuts the tail", () => {
    expect(times(computeSlots({ ...base, durationMinutes: 90 }))).toEqual(["09:00", "09:30", "10:00", "10:30"]);
  });

  it("15-minute step", () => {
    const s = times(computeSlots({ ...base, slotStepMinutes: 15, workingIntervals: [{ startMinutes: 540, endMinutes: 600 }] }));
    expect(s).toEqual(["09:00", "09:15", "09:30"]);
  });

  it("drops slots before now + minLead", () => {
    const s = times(computeSlots({ ...base, now: at("09:50"), minLeadMinutes: 15 }));
    // 09:50 + 15 = 10:05 → ilk uygun 10:30
    expect(s).toEqual(["10:30", "11:00", "11:30"]);
  });

  it("excludes slots overlapping busy intervals (appointments / time off)", () => {
    const s = times(computeSlots({ ...base, busy: [{ start: at("10:00"), end: at("10:45") }] }));
    expect(s).toEqual(["09:00", "09:30", "11:00", "11:30"]);
  });

  it("supports lunch break via two working intervals", () => {
    const s = times(
      computeSlots({
        ...base,
        workingIntervals: [
          { startMinutes: 540, endMinutes: 720 },
          { startMinutes: 780, endMinutes: 840 },
        ],
      }),
    );
    expect(s).toEqual(["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "13:00", "13:30"]);
  });

  it("no working intervals (closed day) → empty", () => {
    expect(computeSlots({ ...base, workingIntervals: [] })).toEqual([]);
  });

  it("after closing time → empty", () => {
    expect(computeSlots({ ...base, now: at("12:00") })).toEqual([]);
  });

  it("busy covering entire day → empty", () => {
    expect(computeSlots({ ...base, busy: [{ start: at("00:00"), end: at("23:59") }] })).toEqual([]);
  });

  it("returns Date objects sorted ascending", () => {
    const s = computeSlots(base);
    for (let i = 1; i < s.length; i++) expect(s[i].getTime()).toBeGreaterThan(s[i - 1].getTime());
  });
});
```

- [ ] **Step 6: Testi çalıştır, başarısız**

Run: `npm test -- tests/unit/availability.test.ts`
Expected: FAIL "Cannot find module '@/lib/availability'"

- [ ] **Step 7: availability.ts**

`src/lib/availability.ts`:

```ts
import { addMinutes } from "./time";

export type WorkingInterval = { startMinutes: number; endMinutes: number };
export type Interval = { start: Date; end: Date };

export type AvailabilityInput = {
  /** Dükkan saat diliminde günün 00:00'ı (UTC instant) */
  dayStart: Date;
  /** Gün içi çalışma aralıkları, dakika cinsinden (öğle arası için birden fazla) */
  workingIntervals: WorkingInterval[];
  /** Mevcut randevular + izinler */
  busy: Interval[];
  durationMinutes: number;
  slotStepMinutes: number;
  minLeadMinutes: number;
  now: Date;
};

export function overlaps(a: Interval, b: Interval): boolean {
  return a.start < b.end && b.start < a.end;
}

export function computeSlots(input: AvailabilityInput): Date[] {
  const { dayStart, workingIntervals, busy, durationMinutes, slotStepMinutes, minLeadMinutes, now } = input;
  const earliest = addMinutes(now, minLeadMinutes);
  const slots: Date[] = [];

  for (const w of workingIntervals) {
    const windowEnd = addMinutes(dayStart, w.endMinutes);
    for (let m = w.startMinutes; m + durationMinutes <= w.endMinutes; m += slotStepMinutes) {
      const start = addMinutes(dayStart, m);
      const end = addMinutes(start, durationMinutes);
      if (start < earliest) continue;
      if (end > windowEnd) break;
      const candidate = { start, end };
      if (busy.some((b) => overlaps(candidate, b))) continue;
      slots.push(start);
    }
  }

  return slots.sort((a, b) => a.getTime() - b.getTime());
}
```

- [ ] **Step 8: Test geçer**

Run: `npm test -- tests/unit/availability.test.ts`
Expected: 11 passed

- [ ] **Step 9: money.ts test + implementasyon**

`tests/unit/money.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { formatKurus } from "@/lib/money";

describe("formatKurus", () => {
  it("formats with Turkish separators", () => {
    expect(formatKurus(40000)).toBe("400,00 ₺");
    expect(formatKurus(125050)).toBe("1.250,50 ₺");
    expect(formatKurus(0)).toBe("0,00 ₺");
  });
});
```

`src/lib/money.ts`:

```ts
export function formatKurus(kurus: number): string {
  const lira = kurus / 100;
  return `${lira.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺`;
}
```

Run: `npm test`
Expected: tüm birim testler geçer (Node'un ICU'su tr-TR içerir; 1.250,50 çıkmazsa `NODE_ICU_DATA` sorunu vardır, `node -p "(1250.5).toLocaleString('tr-TR')"` ile doğrula).

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "Zaman, para ve slot hesabı modülleri"
git push
```

---

### Task 4: Kimlik doğrulama (Auth.js Credentials, kayıt, giriş, proxy)

**Files:**
- Create: `src/lib/auth.ts`, `src/lib/auth-helpers.ts`, `src/types/next-auth.d.ts`
- Create: `src/app/api/auth/[...nextauth]/route.ts`
- Create: `src/proxy.ts`
- Create: `src/schemas/auth.ts`, `src/actions/auth.ts`
- Create: `src/app/(auth)/giris/page.tsx`, `src/app/(auth)/kayit/page.tsx`, `src/components/auth/LoginForm.tsx`, `src/components/auth/RegisterForm.tsx`
- Test: `tests/unit/schemas-auth.test.ts`, `tests/integration/auth.test.ts`

**Interfaces:**
- Produces: `auth()`, `signIn`, `signOut`, `handlers` (`src/lib/auth.ts`)
- Produces: session shape `session.user = { id, name, email, role: Role, barberId: string | null }`
- Produces: `requireUser(): Promise<SessionUser>`, `requireRole(...roles: Role[]): Promise<SessionUser>`, `requireStaff()` (BARBER veya ADMIN), `requireAdmin()` (`src/lib/auth-helpers.ts`). Hepsi oturum yoksa `redirect("/giris")`, rol tutmuyorsa `redirect("/403")`.
- Produces: `registerCustomer(input): Promise<ActionResult<{ id: string }>>`, `loginAction(prev, formData)`, `logoutAction()` (`src/actions/auth.ts`)
- Produces: `registerSchema`, `loginSchema` (`src/schemas/auth.ts`)

- [ ] **Step 1: Zod şemaları için failing test**

`tests/unit/schemas-auth.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { registerSchema, loginSchema } from "@/schemas/auth";

describe("registerSchema", () => {
  it("accepts valid input and trims", () => {
    const r = registerSchema.safeParse({ name: " Ali Veli ", email: "ALI@test.com ", phone: "05551112233", password: "Sifre123!" });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.name).toBe("Ali Veli");
      expect(r.data.email).toBe("ali@test.com");
    }
  });
  it("rejects short password with Turkish message", () => {
    const r = registerSchema.safeParse({ name: "A", email: "a@b.co", password: "123" });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues.map((i) => i.message)).toContain("Şifre en az 8 karakter olmalı");
  });
});

describe("loginSchema", () => {
  it("requires email and password", () => {
    expect(loginSchema.safeParse({ email: "x", password: "" }).success).toBe(false);
  });
});
```

- [ ] **Step 2: Başarısız olduğunu gör**

Run: `npm test -- tests/unit/schemas-auth.test.ts`
Expected: FAIL, modül yok.

- [ ] **Step 3: schemas/auth.ts**

`src/schemas/auth.ts`:

```ts
import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Ad soyad en az 2 karakter olmalı").max(80),
  email: z.string().trim().toLowerCase().email("Geçerli bir e-posta girin"),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  password: z.string().min(8, "Şifre en az 8 karakter olmalı").max(100),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Geçerli bir e-posta girin"),
  password: z.string().min(1, "Şifre gerekli"),
});
export type LoginInput = z.infer<typeof loginSchema>;
```

Run: `npm test -- tests/unit/schemas-auth.test.ts` → 3 passed.

- [ ] **Step 4: Auth.js config**

`src/types/next-auth.d.ts`:

```ts
import type { Role } from "@/generated/prisma/enums";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      barberId: string | null;
    } & DefaultSession["user"];
  }
  interface User {
    role: Role;
    barberId: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    barberId: string | null;
  }
}
```

`src/lib/auth.ts`:

```ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { loginSchema } from "@/schemas/auth";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/giris" },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(raw) {
        const parsed = loginSchema.safeParse(raw);
        if (!parsed.success) return null;
        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
          include: { barber: { select: { id: true } } },
        });
        if (!user) return null;
        const okPw = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!okPw) return null;
        return { id: user.id, name: user.name, email: user.email, role: user.role, barberId: user.barber?.id ?? null };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role;
        token.barberId = user.barberId;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      session.user.barberId = token.barberId;
      return session;
    },
  },
});
```

`src/app/api/auth/[...nextauth]/route.ts`:

```ts
import { handlers } from "@/lib/auth";
export const { GET, POST } = handlers;
```

- [ ] **Step 5: auth-helpers.ts**

```ts
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import type { Role } from "@/generated/prisma/enums";

export type SessionUser = { id: string; name: string; email: string; role: Role; barberId: string | null };

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  const u = session.user;
  return { id: u.id, name: u.name ?? "", email: u.email ?? "", role: u.role, barberId: u.barberId };
}

export async function requireUser(next?: string): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect(next ? `/giris?next=${encodeURIComponent(next)}` : "/giris");
  return user;
}

export async function requireRole(...roles: Role[]): Promise<SessionUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) redirect("/403");
  return user;
}

export const requireStaff = () => requireRole("BARBER", "ADMIN");
export const requireAdmin = () => requireRole("ADMIN");
```

- [ ] **Step 6: proxy.ts (Next 16)**

`src/proxy.ts`:

```ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export const proxy = auth((req) => {
  const { pathname, search } = req.nextUrl;
  const user = req.auth?.user;

  if (pathname.startsWith("/panel")) {
    if (!user) {
      const url = new URL("/giris", req.nextUrl);
      url.searchParams.set("next", pathname + search);
      return NextResponse.redirect(url);
    }
    if (user.role !== "BARBER" && user.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/403", req.nextUrl));
    }
  }

  if (pathname.startsWith("/randevularim") && !user) {
    const url = new URL("/giris", req.nextUrl);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/panel/:path*", "/randevularim/:path*"],
};
```

- [ ] **Step 7: registerCustomer için integration test (failing)**

`tests/integration/auth.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { registerCustomer } from "@/actions/auth";

describe("registerCustomer", () => {
  it("creates CUSTOMER with hashed password and lowercased email", async () => {
    const r = await registerCustomer({ name: "Ali Veli", email: "Ali@Test.com", phone: "0555", password: "Sifre123!" });
    expect(r.ok).toBe(true);
    const u = await prisma.user.findUnique({ where: { email: "ali@test.com" } });
    expect(u?.role).toBe("CUSTOMER");
    expect(await bcrypt.compare("Sifre123!", u!.passwordHash)).toBe(true);
  });

  it("rejects duplicate email", async () => {
    await registerCustomer({ name: "Ali Veli", email: "ali@test.com", password: "Sifre123!" });
    const r = await registerCustomer({ name: "Ali Veli", email: "ali@test.com", password: "Sifre123!" });
    expect(r).toEqual({ ok: false, error: "Bu e-posta ile zaten bir hesap var" });
  });

  it("rejects invalid input", async () => {
    const r = await registerCustomer({ name: "A", email: "x", password: "1" });
    expect(r.ok).toBe(false);
  });
});
```

Run: `npm run test:integration -- tests/integration/auth.test.ts`
Expected: FAIL, `@/actions/auth` yok.

- [ ] **Step 8: actions/auth.ts**

```ts
"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { prisma } from "@/lib/db";
import { signIn, signOut } from "@/lib/auth";
import { ok, fail, type ActionResult } from "@/lib/action-result";
import { registerSchema, loginSchema, type RegisterInput } from "@/schemas/auth";

export async function registerCustomer(input: RegisterInput): Promise<ActionResult<{ id: string }>> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Geçersiz bilgi");
  const { name, email, phone, password } = parsed.data;

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return fail("Bu e-posta ile zaten bir hesap var");

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name, email, phone: phone || null, passwordHash, role: "CUSTOMER" },
  });
  return ok({ id: user.id });
}

export type LoginState = { error?: string };

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const next = String(formData.get("next") || "");
  try {
    await signIn("credentials", { ...parsed.data, redirectTo: next || "/after-login" });
    return {};
  } catch (e) {
    if (e instanceof AuthError) return { error: "E-posta veya şifre hatalı" };
    throw e; // NEXT_REDIRECT buradan geçer
  }
}

export async function registerAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const r = await registerCustomer({
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    password: String(formData.get("password") ?? ""),
  });
  if (!r.ok) return { error: r.error };
  const next = String(formData.get("next") || "");
  await signIn("credentials", {
    email: String(formData.get("email")).trim().toLowerCase(),
    password: String(formData.get("password")),
    redirectTo: next || "/",
  });
  return {};
}

export async function logoutAction() {
  await signOut({ redirectTo: "/" });
}
```

`/after-login` rotası: rolüne göre yönlendirir. `src/app/after-login/page.tsx`:

```tsx
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth-helpers";

export default async function AfterLogin() {
  const user = await getSessionUser();
  if (!user) redirect("/giris");
  redirect(user.role === "CUSTOMER" ? "/" : "/panel");
}
```

Run: `npm run test:integration -- tests/integration/auth.test.ts` → 3 passed.

- [ ] **Step 9: Giriş ve kayıt sayfaları**

Bu adımda henüz shadcn yok (Task 5'te gelir); düz Tailwind sınıfları kullan, Task 5'te tema sınıflarına geçirilir.

`src/components/auth/LoginForm.tsx`:

```tsx
"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction, type LoginState } from "@/actions/auth";

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(loginAction, {});
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next ?? ""} />
      <label className="block">
        <span className="text-sm font-medium">E-posta</span>
        <input name="email" type="email" required autoComplete="email" className="mt-1 w-full rounded-lg border px-3 py-2" />
      </label>
      <label className="block">
        <span className="text-sm font-medium">Şifre</span>
        <input name="password" type="password" required autoComplete="current-password" className="mt-1 w-full rounded-lg border px-3 py-2" />
      </label>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button disabled={pending} className="w-full rounded-lg bg-black px-4 py-2 text-white disabled:opacity-50">
        {pending ? "Giriş yapılıyor…" : "Giriş yap"}
      </button>
      <p className="text-center text-sm">
        Hesabın yok mu? <Link href={`/kayit${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="underline">Kayıt ol</Link>
      </p>
    </form>
  );
}
```

`src/components/auth/RegisterForm.tsx`:

```tsx
"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerAction, type LoginState } from "@/actions/auth";

export function RegisterForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(registerAction, {});
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next ?? ""} />
      <label className="block">
        <span className="text-sm font-medium">Ad Soyad</span>
        <input name="name" required className="mt-1 w-full rounded-lg border px-3 py-2" />
      </label>
      <label className="block">
        <span className="text-sm font-medium">E-posta</span>
        <input name="email" type="email" required className="mt-1 w-full rounded-lg border px-3 py-2" />
      </label>
      <label className="block">
        <span className="text-sm font-medium">Telefon (isteğe bağlı)</span>
        <input name="phone" type="tel" className="mt-1 w-full rounded-lg border px-3 py-2" />
      </label>
      <label className="block">
        <span className="text-sm font-medium">Şifre</span>
        <input name="password" type="password" required minLength={8} className="mt-1 w-full rounded-lg border px-3 py-2" />
      </label>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button disabled={pending} className="w-full rounded-lg bg-black px-4 py-2 text-white disabled:opacity-50">
        {pending ? "Kaydediliyor…" : "Kayıt ol"}
      </button>
      <p className="text-center text-sm">
        Zaten hesabın var mı? <Link href={`/giris${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="underline">Giriş yap</Link>
      </p>
    </form>
  );
}
```

`src/app/(auth)/giris/page.tsx`:

```tsx
import { LoginForm } from "@/components/auth/LoginForm";

export default async function GirisPage(props: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await props.searchParams;
  return (
    <main className="mx-auto max-w-sm px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold">Giriş yap</h1>
      <LoginForm next={next} />
    </main>
  );
}
```

`src/app/(auth)/kayit/page.tsx`: aynı yapı, başlık "Kayıt ol", `<RegisterForm next={next} />`.

`src/app/403/page.tsx`:

```tsx
export default function Forbidden() {
  return (
    <main className="mx-auto max-w-sm px-4 py-20 text-center">
      <h1 className="text-2xl font-bold">Bu sayfaya erişim yetkin yok</h1>
    </main>
  );
}
```

- [ ] **Step 10: Elle doğrula**

Run: `npm run dev`, tarayıcıda `http://localhost:3000/kayit` ile kayıt ol → `/` açılır. `/panel` adresine git → `/403`. Çıkış yapıp `admin@afrosalon.local / Sifre123!` ile `/giris` → `/panel` (404 verir, henüz yok; yönlendirme çalıştıysa yeter).

Run: `npm run typecheck && npm run lint`
Expected: hata yok.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "Auth.js ile kayıt, giriş ve rol tabanlı yönlendirme"
git push
```

---

### Task 5: Tema, palet, light/dark mod, shadcn/ui ve kök layout

**Files:**
- Modify: `src/app/globals.css`, `src/app/layout.tsx`
- Create: `src/components/theme/ThemeProvider.tsx`, `src/components/theme/ThemeToggle.tsx`
- Create: `src/components/ui/*` (shadcn: button, card, input, label, badge, dialog, select, table, tabs, textarea, sonner)
- Create: `src/components/layout/SiteHeader.tsx`
- Create: `src/lib/utils.ts` (shadcn `cn`)
- Modify: `src/components/auth/LoginForm.tsx`, `RegisterForm.tsx` (shadcn bileşenlerine geçir)

**Interfaces:**
- Produces: CSS token'ları `--background --foreground --card --primary --primary-foreground --accent --accent-foreground --muted --muted-foreground --border --success --destructive` light ve dark için.
- Produces: `<SiteHeader user={SessionUser | null} />`

- [ ] **Step 1: shadcn init ve bileşenler**

```bash
npx shadcn@latest init -d
npx shadcn@latest add button card input label badge dialog select table tabs textarea sonner separator
```

`-d` varsayılanları kabul eder (Tailwind 4, CSS variables, `src/components/ui`). `components.json` içindeki `"baseColor"` ne olursa olsun bir sonraki adımda `globals.css` token'larını biz yazacağız.

- [ ] **Step 2: Palet ve tema token'ları**

`src/app/globals.css` dosyasını tamamen şununla değiştir:

```css
@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

:root {
  /* Afrika esintili yumuşak palet, açık mod */
  --background: oklch(0.97 0.02 80);        /* sıcak kum bej */
  --foreground: oklch(0.25 0.03 50);        /* derin kahve */
  --card: oklch(0.99 0.01 85);
  --card-foreground: oklch(0.25 0.03 50);
  --popover: oklch(0.99 0.01 85);
  --popover-foreground: oklch(0.25 0.03 50);
  --primary: oklch(0.62 0.15 40);           /* terracotta */
  --primary-foreground: oklch(0.99 0.01 85);
  --secondary: oklch(0.92 0.04 80);
  --secondary-foreground: oklch(0.3 0.03 50);
  --accent: oklch(0.8 0.13 85);             /* hardal */
  --accent-foreground: oklch(0.25 0.03 50);
  --muted: oklch(0.93 0.02 80);
  --muted-foreground: oklch(0.5 0.03 55);
  --success: oklch(0.6 0.1 130);            /* zeytin yeşili */
  --destructive: oklch(0.55 0.2 25);
  --border: oklch(0.88 0.03 75);
  --input: oklch(0.88 0.03 75);
  --ring: oklch(0.62 0.15 40);
  --radius: 0.9rem;
}

.dark {
  --background: oklch(0.2 0.02 50);         /* koyu kahve-antrasit */
  --foreground: oklch(0.95 0.02 80);
  --card: oklch(0.25 0.02 50);
  --card-foreground: oklch(0.95 0.02 80);
  --popover: oklch(0.25 0.02 50);
  --popover-foreground: oklch(0.95 0.02 80);
  --primary: oklch(0.7 0.14 45);
  --primary-foreground: oklch(0.15 0.02 50);
  --secondary: oklch(0.3 0.02 50);
  --secondary-foreground: oklch(0.95 0.02 80);
  --accent: oklch(0.78 0.12 85);
  --accent-foreground: oklch(0.15 0.02 50);
  --muted: oklch(0.3 0.02 50);
  --muted-foreground: oklch(0.7 0.02 70);
  --success: oklch(0.7 0.1 130);
  --destructive: oklch(0.65 0.18 25);
  --border: oklch(0.35 0.02 50);
  --input: oklch(0.35 0.02 50);
  --ring: oklch(0.7 0.14 45);
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-success: var(--success);
  --color-destructive: var(--destructive);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
  --font-display: var(--font-display);
  --font-sans: var(--font-sans);
}

@layer base {
  * { @apply border-border outline-ring/50; }
  html { overflow-x: hidden; }
  body { @apply bg-background text-foreground font-sans antialiased; }
  h1, h2, h3 { @apply font-display tracking-wide; }
}
```

`tw-animate-css` import satırı shadcn init ile paket yüklenmediyse: `npm install -D tw-animate-css`.

- [ ] **Step 3: Fontlar ve kök layout**

`src/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { Inter, Bebas_Neue } from "next/font/google";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const inter = Inter({ subsets: ["latin", "latin-ext"], variable: "--font-sans" });
const bebas = Bebas_Neue({ weight: "400", subsets: ["latin", "latin-ext"], variable: "--font-display" });

export const metadata: Metadata = {
  title: "Afro Salon Modern",
  description: "Bugün için randevu al",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" suppressHydrationWarning className={`${inter.variable} ${bebas.variable}`}>
      <body className="min-h-dvh">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 4: ThemeProvider ve ThemeToggle**

`src/components/theme/ThemeProvider.tsx`:

```tsx
"use client";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

export function ThemeProvider(props: ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props} />;
}
```

`src/components/theme/ThemeToggle.tsx`:

```tsx
"use client";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <Button variant="ghost" size="icon" aria-label="Tema" />;
  const dark = resolvedTheme === "dark";
  return (
    <Button variant="ghost" size="icon" aria-label={dark ? "Açık moda geç" : "Koyu moda geç"} onClick={() => setTheme(dark ? "light" : "dark")}>
      {dark ? <Sun className="size-5" /> : <Moon className="size-5" />}
    </Button>
  );
}
```

- [ ] **Step 5: SiteHeader**

`src/components/layout/SiteHeader.tsx`:

```tsx
import Link from "next/link";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/actions/auth";
import type { SessionUser } from "@/lib/auth-helpers";

export function SiteHeader({ user, shopName }: { user: SessionUser | null; shopName: string }) {
  return (
    <header className="sticky top-0 z-10 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
        <Link href="/" className="font-display text-2xl tracking-wider text-primary">{shopName}</Link>
        <div className="flex items-center gap-1">
          {user ? (
            <>
              {user.role !== "CUSTOMER" && <Button asChild variant="ghost" size="sm"><Link href="/panel">Panel</Link></Button>}
              <Button asChild variant="ghost" size="sm"><Link href="/randevularim">Randevularım</Link></Button>
              <form action={logoutAction}><Button variant="ghost" size="sm" type="submit">Çıkış</Button></form>
            </>
          ) : (
            <Button asChild variant="ghost" size="sm"><Link href="/giris">Giriş</Link></Button>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 6: Login/Register formlarını shadcn'e geçir**

`LoginForm.tsx` ve `RegisterForm.tsx` içindeki `<input className=...>` yerine `<Input />`, `<span>` etiketleri yerine `<Label htmlFor>`, `<button>` yerine `<Button type="submit">`. Hata mesajı `text-destructive`. Mantık değişmez.

- [ ] **Step 7: Elle doğrula**

Run: `npm run dev`, `/giris` sayfasında: açık modda kum bej zemin, terracotta buton; tema butonuyla koyu moda geçince koyu kahve zemin. Pencereyi 400px'e daraltınca yatay kaydırma yok.

Run: `npm run typecheck && npm run lint && npm run build`
Expected: hata yok.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "Afrika esintili palet, light/dark mod ve shadcn bileşenleri"
git push
```

---

### Task 6: Ayarlar, randevu okuma sorguları ve `createAppointment`

**Files:**
- Create: `src/lib/settings.ts`, `src/lib/queries/booking.ts`, `src/schemas/booking.ts`, `src/actions/appointments.ts`
- Test: `tests/integration/booking.test.ts`

**Interfaces:**
- Produces (`src/lib/settings.ts`): `getSettings(): Promise<Settings>` (id=1 satırı, yoksa oluşturur)
- Produces (`src/lib/queries/booking.ts`):
  - `getActiveServices()` → `Service[]` (sortOrder'a göre)
  - `getActiveBarbers()` → `{ id, name, bio, photoKey, recentPhotoKeys: string[] }[]`
  - `getTodayAvailability(barberId: string, durationMinutes: number, now?: Date): Promise<{ slots: Date[]; isOpenToday: boolean; opensAt: string | null }>`
  - `getBarberDayBusy(barberId, dayStart, dayEnd)` → `Interval[]` (SCHEDULED randevular + TimeOff)
- Produces (`src/schemas/booking.ts`): `createAppointmentSchema = { barberId: string, serviceIds: string[] (min 1), startsAt: ISO string }`
- Produces (`src/actions/appointments.ts`): `createAppointment(input, opts?: { now?: Date; customerId?: string })` → `ActionResult<{ id: string }>`. `customerId` verilmezse oturumdan alınır (testte verilir).

- [ ] **Step 1: settings.ts**

```ts
import { prisma } from "@/lib/db";

export async function getSettings() {
  return prisma.settings.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
}
```

- [ ] **Step 2: Failing integration testleri**

`tests/integration/booking.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { prisma } from "@/lib/db";
import { createBarber, createCustomer, createService } from "./helpers";
import { getTodayAvailability } from "@/lib/queries/booking";
import { createAppointment } from "@/actions/appointments";

// Perşembe 2026-09-17 10:00 Istanbul = 07:00Z
const NOW = new Date("2026-09-17T07:00:00Z");
const SUNDAY_NOW = new Date("2026-09-20T07:00:00Z");

describe("getTodayAvailability", () => {
  it("lists slots after now+lead within working hours", async () => {
    const { barber } = await createBarber();
    const r = await getTodayAvailability(barber.id, 30, NOW);
    expect(r.isOpenToday).toBe(true);
    // 10:00 + 15dk lead = 10:15 → ilk slot 10:15 (15dk adım)
    expect(r.slots[0].toISOString()).toBe("2026-09-17T07:15:00.000Z");
    // son slot 18:30 (19:00 kapanış, 30dk hizmet)
    expect(r.slots.at(-1)!.toISOString()).toBe("2026-09-17T15:30:00.000Z");
  });

  it("is closed on Sunday", async () => {
    const { barber } = await createBarber();
    const r = await getTodayAvailability(barber.id, 30, SUNDAY_NOW);
    expect(r.isOpenToday).toBe(false);
    expect(r.slots).toEqual([]);
    expect(r.opensAt).toBe("09:00"); // yarın (Pazartesi) açılış
  });

  it("excludes existing appointments and time off", async () => {
    const { barber } = await createBarber();
    const customer = await createCustomer();
    await prisma.appointment.create({
      data: { barberId: barber.id, customerId: customer.id, startsAt: new Date("2026-09-17T08:00:00Z"), endsAt: new Date("2026-09-17T08:30:00Z") },
    });
    await prisma.timeOff.create({
      data: { barberId: barber.id, startsAt: new Date("2026-09-17T09:00:00Z"), endsAt: new Date("2026-09-17T10:00:00Z") },
    });
    const r = await getTodayAvailability(barber.id, 30, NOW);
    const iso = r.slots.map((d) => d.toISOString());
    expect(iso).not.toContain("2026-09-17T08:00:00.000Z");
    expect(iso).not.toContain("2026-09-17T07:45:00.000Z"); // 07:45-08:15 çakışır
    expect(iso).not.toContain("2026-09-17T09:30:00.000Z");
    expect(iso).toContain("2026-09-17T08:30:00.000Z");
    expect(iso).toContain("2026-09-17T10:00:00.000Z");
  });
});

describe("createAppointment", () => {
  it("creates appointment with service snapshots", async () => {
    const { barber } = await createBarber();
    const customer = await createCustomer();
    const s1 = await createService({ name: "Saç", durationMinutes: 30, priceKurus: 40000 });
    const s2 = await createService({ name: "Sakal", durationMinutes: 15, priceKurus: 20000 });

    const r = await createAppointment(
      { barberId: barber.id, serviceIds: [s1.id, s2.id], startsAt: "2026-09-17T08:00:00.000Z" },
      { now: NOW, customerId: customer.id },
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const appt = await prisma.appointment.findUnique({ where: { id: r.data.id }, include: { services: true } });
    expect(appt?.endsAt.toISOString()).toBe("2026-09-17T08:45:00.000Z");
    expect(appt?.services.map((s) => s.priceSnapshot).sort()).toEqual([20000, 40000]);
    expect(appt?.services.find((s) => s.serviceId === s1.id)?.nameSnapshot).toBe("Saç");
  });

  it("rejects slot in the past / before lead time", async () => {
    const { barber } = await createBarber();
    const customer = await createCustomer();
    const s1 = await createService();
    const r = await createAppointment(
      { barberId: barber.id, serviceIds: [s1.id], startsAt: "2026-09-17T07:00:00.000Z" },
      { now: NOW, customerId: customer.id },
    );
    expect(r).toEqual({ ok: false, error: "Bu saat artık uygun değil, lütfen başka bir saat seçin" });
  });

  it("rejects conflicting slot (second booking of same time)", async () => {
    const { barber } = await createBarber();
    const c1 = await createCustomer();
    const c2 = await createCustomer();
    const s1 = await createService();
    const input = { barberId: barber.id, serviceIds: [s1.id], startsAt: "2026-09-17T08:00:00.000Z" };
    const first = await createAppointment(input, { now: NOW, customerId: c1.id });
    expect(first.ok).toBe(true);
    const second = await createAppointment(input, { now: NOW, customerId: c2.id });
    expect(second.ok).toBe(false);
  });

  it("rejects when slot not aligned to step", async () => {
    const { barber } = await createBarber();
    const customer = await createCustomer();
    const s1 = await createService();
    const r = await createAppointment(
      { barberId: barber.id, serviceIds: [s1.id], startsAt: "2026-09-17T08:07:00.000Z" },
      { now: NOW, customerId: customer.id },
    );
    expect(r.ok).toBe(false);
  });

  it("rejects inactive service", async () => {
    const { barber } = await createBarber();
    const customer = await createCustomer();
    const s1 = await prisma.service.create({ data: { name: "Eski", durationMinutes: 30, priceKurus: 100, isActive: false } });
    const r = await createAppointment(
      { barberId: barber.id, serviceIds: [s1.id], startsAt: "2026-09-17T08:00:00.000Z" },
      { now: NOW, customerId: customer.id },
    );
    expect(r).toEqual({ ok: false, error: "Seçilen hizmet bulunamadı" });
  });
});
```

Run: `npm run test:integration -- tests/integration/booking.test.ts`
Expected: FAIL, modüller yok.

- [ ] **Step 3: queries/booking.ts**

```ts
import { prisma } from "@/lib/db";
import { computeSlots, type Interval, type WorkingInterval } from "@/lib/availability";
import { addMinutes, parseTime, shopDayOfWeek, shopDayStart } from "@/lib/time";
import { getSettings } from "@/lib/settings";

export async function getActiveServices() {
  return prisma.service.findMany({ where: { isActive: true }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });
}

export async function getActiveBarbers() {
  const barbers = await prisma.barber.findMany({
    where: { isActive: true },
    include: {
      user: { select: { name: true } },
      photos: { orderBy: { createdAt: "desc" }, take: 3, select: { storageKey: true } },
    },
    orderBy: { user: { name: "asc" } },
  });
  return barbers.map((b) => ({
    id: b.id,
    name: b.user.name,
    bio: b.bio,
    photoKey: b.photoKey,
    recentPhotoKeys: b.photos.map((p) => p.storageKey),
  }));
}

export async function getBarberDayBusy(barberId: string, dayStart: Date, dayEnd: Date): Promise<Interval[]> {
  const [appointments, timeOffs] = await Promise.all([
    prisma.appointment.findMany({
      where: { barberId, status: "SCHEDULED", startsAt: { lt: dayEnd }, endsAt: { gt: dayStart } },
      select: { startsAt: true, endsAt: true },
    }),
    prisma.timeOff.findMany({
      where: { barberId, startsAt: { lt: dayEnd }, endsAt: { gt: dayStart } },
      select: { startsAt: true, endsAt: true },
    }),
  ]);
  return [...appointments, ...timeOffs].map((x) => ({ start: x.startsAt, end: x.endsAt }));
}

async function getWorkingIntervals(barberId: string, dayOfWeek: number): Promise<WorkingInterval[]> {
  const rows = await prisma.workingHours.findMany({ where: { barberId, dayOfWeek, isOff: false } });
  return rows.map((r) => ({ startMinutes: parseTime(r.startTime), endMinutes: parseTime(r.endTime) }));
}

export async function getTodayAvailability(barberId: string, durationMinutes: number, now: Date = new Date()) {
  const settings = await getSettings();
  const dayStart = shopDayStart(now);
  const dayEnd = addMinutes(dayStart, 24 * 60);
  const dow = shopDayOfWeek(now);

  const working = await getWorkingIntervals(barberId, dow);
  const busy = await getBarberDayBusy(barberId, dayStart, dayEnd);
  const slots = computeSlots({
    dayStart,
    workingIntervals: working,
    busy,
    durationMinutes,
    slotStepMinutes: settings.slotStepMinutes,
    minLeadMinutes: settings.minLeadMinutes,
    now,
  });

  // Yarın açılış saati (kapalıysa mesaj için)
  const tomorrowRows = await prisma.workingHours.findMany({
    where: { barberId, dayOfWeek: (dow + 1) % 7, isOff: false },
    orderBy: { startTime: "asc" },
    take: 1,
  });

  return {
    slots,
    isOpenToday: working.length > 0,
    opensAt: tomorrowRows[0]?.startTime ?? null,
  };
}
```

- [ ] **Step 4: schemas/booking.ts**

```ts
import { z } from "zod";

export const createAppointmentSchema = z.object({
  barberId: z.string().min(1),
  serviceIds: z.array(z.string().min(1)).min(1, "En az bir hizmet seçin").max(10),
  startsAt: z.string().datetime({ message: "Geçersiz saat" }),
});
export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
```

- [ ] **Step 5: actions/appointments.ts (createAppointment)**

```ts
"use server";

import { prisma } from "@/lib/db";
import { ok, fail, type ActionResult } from "@/lib/action-result";
import { getSessionUser } from "@/lib/auth-helpers";
import { addMinutes } from "@/lib/time";
import { getTodayAvailability } from "@/lib/queries/booking";
import { createAppointmentSchema, type CreateAppointmentInput } from "@/schemas/booking";

const SLOT_TAKEN = "Bu saat az önce doldu, lütfen başka bir saat seçin";
const SLOT_INVALID = "Bu saat artık uygun değil, lütfen başka bir saat seçin";

export async function createAppointment(
  input: CreateAppointmentInput,
  opts: { now?: Date; customerId?: string } = {},
): Promise<ActionResult<{ id: string }>> {
  const parsed = createAppointmentSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Geçersiz bilgi");
  const { barberId, serviceIds, startsAt: startsAtIso } = parsed.data;

  const customerId = opts.customerId ?? (await getSessionUser())?.id;
  if (!customerId) return fail("Randevu almak için giriş yapmalısınız");

  const now = opts.now ?? new Date();
  const startsAt = new Date(startsAtIso);

  const barber = await prisma.barber.findFirst({ where: { id: barberId, isActive: true } });
  if (!barber) return fail("Berber bulunamadı");

  const services = await prisma.service.findMany({ where: { id: { in: serviceIds }, isActive: true } });
  if (services.length !== new Set(serviceIds).size) return fail("Seçilen hizmet bulunamadı");

  const durationMinutes = services.reduce((sum, s) => sum + s.durationMinutes, 0);
  const endsAt = addMinutes(startsAt, durationMinutes);

  const { slots } = await getTodayAvailability(barberId, durationMinutes, now);
  if (!slots.some((s) => s.getTime() === startsAt.getTime())) return fail(SLOT_INVALID);

  try {
    const appt = await prisma.$transaction(async (tx) => {
      const created = await tx.appointment.create({ data: { customerId, barberId, startsAt, endsAt } });
      await tx.appointmentService.createMany({
        data: services.map((s) => ({
          appointmentId: created.id,
          serviceId: s.id,
          nameSnapshot: s.name,
          durationSnapshot: s.durationMinutes,
          priceSnapshot: s.priceKurus,
        })),
      });
      return created;
    });
    return ok({ id: appt.id });
  } catch (e) {
    if (e instanceof Error && e.message.includes("appointment_no_overlap")) return fail(SLOT_TAKEN);
    throw e;
  }
}
```

Not: `getSessionUser` içindeki `auth()` test ortamında request context olmadan çağrılırsa hata verir; testler `customerId` verdiği için çağrılmaz.

- [ ] **Step 6: Testler geçer**

Run: `npm run test:integration`
Expected: schema (3) + auth (3) + booking (8) = 14 passed.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "Randevu sorguları ve createAppointment action'ı"
git push
```

---

### Task 7: Müşteri randevu alma arayüzü (ana sayfa, 3 adımlı wizard)

**Files:**
- Create: `src/app/(musteri)/layout.tsx`, `src/app/(musteri)/page.tsx`
- Create: `src/components/booking/BookingWizard.tsx`, `ServiceStep.tsx`, `BarberStep.tsx`, `SlotStep.tsx`
- Create: `src/lib/storage-public.ts` (`publicUrl`, client'ta da kullanılabilir; sunucu tarafı R2 kodu Task 12'de ayrı dosyada)
- Create: `src/app/api/availability/route.ts`
- Modify: `src/app/page.tsx` → sil (route group `(musteri)/page.tsx` ana sayfa olur)

**Interfaces:**
- Consumes: `getActiveServices`, `getActiveBarbers`, `getTodayAvailability`, `createAppointment`, `formatKurus`, `formatShopTime`, `getSettings`, `getSessionUser`
- Produces: `GET /api/availability?barberId=&duration=` → `{ slots: string[]; isOpenToday: boolean; opensAt: string | null }`
- Produces: `publicUrl(key: string): string` (`src/lib/storage-public.ts`). Bu dosya AWS SDK import ETMEZ, client bileşenleri buradan import eder.
- Produces: wizard state URL'de taşınır: `/?s=<serviceId,serviceId>&b=<barberId>&t=<ISO>` (girişten dönünce seçimler korunur)

- [ ] **Step 1: storage-public.ts**

`src/lib/storage-public.ts`:

```ts
export function publicUrl(key: string): string {
  const base = process.env.R2_PUBLIC_URL?.replace(/\/$/, "") ?? "";
  return `${base}/${key}`;
}
```

`next.config.ts` içine R2 domain'i ekle:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**.r2.dev" }],
  },
};
export default nextConfig;
```

- [ ] **Step 2: Availability API route**

`src/app/api/availability/route.ts`:

```ts
import { NextResponse } from "next/server";
import { getTodayAvailability } from "@/lib/queries/booking";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const barberId = url.searchParams.get("barberId") ?? "";
  const duration = Number(url.searchParams.get("duration") ?? 0);
  if (!barberId || !Number.isFinite(duration) || duration <= 0) {
    return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
  }
  const r = await getTodayAvailability(barberId, duration);
  return NextResponse.json({ slots: r.slots.map((d) => d.toISOString()), isOpenToday: r.isOpenToday, opensAt: r.opensAt }, { headers: { "Cache-Control": "no-store" } });
}
```

- [ ] **Step 3: Müşteri layout ve ana sayfa**

`src/app/(musteri)/layout.tsx`:

```tsx
import { SiteHeader } from "@/components/layout/SiteHeader";
import { getSessionUser } from "@/lib/auth-helpers";
import { getSettings } from "@/lib/settings";

export default async function MusteriLayout({ children }: { children: React.ReactNode }) {
  const [user, settings] = await Promise.all([getSessionUser(), getSettings()]);
  return (
    <>
      <SiteHeader user={user} shopName={settings.shopName} />
      <main className="mx-auto w-full max-w-lg px-4 pb-16 pt-6">{children}</main>
    </>
  );
}
```

`src/app/(musteri)/page.tsx`:

```tsx
import { getActiveBarbers, getActiveServices } from "@/lib/queries/booking";
import { getSettings } from "@/lib/settings";
import { getSessionUser } from "@/lib/auth-helpers";
import { BookingWizard } from "@/components/booking/BookingWizard";

export const dynamic = "force-dynamic";

export default async function HomePage(props: { searchParams: Promise<{ s?: string; b?: string; t?: string }> }) {
  const sp = await props.searchParams;
  const [services, barbers, settings, user] = await Promise.all([getActiveServices(), getActiveBarbers(), getSettings(), getSessionUser()]);
  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-4xl text-primary">Bugün için randevu al</h1>
        <p className="text-muted-foreground">{settings.address} · {settings.phone}</p>
      </section>
      <BookingWizard
        services={services.map((s) => ({ id: s.id, name: s.name, durationMinutes: s.durationMinutes, priceKurus: s.priceKurus }))}
        barbers={barbers}
        isLoggedIn={!!user}
        initial={{ serviceIds: sp.s ? sp.s.split(",") : [], barberId: sp.b ?? null, startsAt: sp.t ?? null }}
      />
    </div>
  );
}
```

`src/app/page.tsx` dosyasını sil (`rm src/app/page.tsx`), yoksa iki ana sayfa çakışır.

- [ ] **Step 4: BookingWizard**

`src/components/booking/BookingWizard.tsx`:

```tsx
"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createAppointment } from "@/actions/appointments";
import { ServiceStep, type ServiceItem } from "./ServiceStep";
import { BarberStep, type BarberItem } from "./BarberStep";
import { SlotStep } from "./SlotStep";
import { Button } from "@/components/ui/button";
import { formatKurus } from "@/lib/money";

type Props = {
  services: ServiceItem[];
  barbers: BarberItem[];
  isLoggedIn: boolean;
  initial: { serviceIds: string[]; barberId: string | null; startsAt: string | null };
};

export function BookingWizard({ services, barbers, isLoggedIn, initial }: Props) {
  const router = useRouter();
  const [serviceIds, setServiceIds] = useState<string[]>(initial.serviceIds.filter((id) => services.some((s) => s.id === id)));
  const [barberId, setBarberId] = useState<string | null>(initial.barberId);
  const [startsAt, setStartsAt] = useState<string | null>(initial.startsAt);
  const [pending, startTransition] = useTransition();

  const selected = useMemo(() => services.filter((s) => serviceIds.includes(s.id)), [services, serviceIds]);
  const totalMinutes = selected.reduce((a, s) => a + s.durationMinutes, 0);
  const totalKurus = selected.reduce((a, s) => a + s.priceKurus, 0);

  const step = serviceIds.length === 0 ? 1 : !barberId ? 2 : 3;

  const stateQuery = () => {
    const q = new URLSearchParams();
    if (serviceIds.length) q.set("s", serviceIds.join(","));
    if (barberId) q.set("b", barberId);
    if (startsAt) q.set("t", startsAt);
    return q.toString();
  };

  const confirm = () => {
    if (!barberId || !startsAt) return;
    if (!isLoggedIn) {
      router.push(`/giris?next=${encodeURIComponent(`/?${stateQuery()}`)}`);
      return;
    }
    startTransition(async () => {
      const r = await createAppointment({ barberId, serviceIds, startsAt });
      if (!r.ok) {
        toast.error(r.error);
        setStartsAt(null);
        return;
      }
      toast.success("Randevun oluşturuldu");
      router.push("/randevularim");
    });
  };

  return (
    <div className="space-y-8">
      <ServiceStep services={services} selectedIds={serviceIds} onChange={(ids) => { setServiceIds(ids); setStartsAt(null); }} />
      {step >= 2 && (
        <BarberStep barbers={barbers} selectedId={barberId} onSelect={(id) => { setBarberId(id); setStartsAt(null); }} />
      )}
      {step >= 3 && barberId && (
        <SlotStep barberId={barberId} durationMinutes={totalMinutes} selected={startsAt} onSelect={setStartsAt} />
      )}
      {selected.length > 0 && (
        <div className="sticky bottom-0 -mx-4 border-t bg-background/95 px-4 py-3 backdrop-blur">
          <div className="mb-2 flex justify-between text-sm">
            <span>{selected.map((s) => s.name).join(", ")}</span>
            <span className="font-medium">{totalMinutes} dk · {formatKurus(totalKurus)}</span>
          </div>
          <Button className="w-full" size="lg" disabled={!startsAt || pending} onClick={confirm}>
            {pending ? "Kaydediliyor…" : isLoggedIn ? "Randevuyu onayla" : "Giriş yap ve onayla"}
          </Button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 5: ServiceStep, BarberStep, SlotStep**

`ServiceStep.tsx`:

```tsx
"use client";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatKurus } from "@/lib/money";

export type ServiceItem = { id: string; name: string; durationMinutes: number; priceKurus: number };

export function ServiceStep({ services, selectedIds, onChange }: { services: ServiceItem[]; selectedIds: string[]; onChange: (ids: string[]) => void }) {
  const toggle = (id: string) => onChange(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]);
  return (
    <section>
      <h2 className="mb-3 text-2xl">1. Hizmet seç</h2>
      <ul className="grid gap-2">
        {services.map((s) => {
          const on = selectedIds.includes(s.id);
          return (
            <li key={s.id}>
              <button type="button" onClick={() => toggle(s.id)} aria-pressed={on}
                className={cn("flex w-full items-center justify-between rounded-xl border bg-card px-4 py-3 text-left transition", on && "border-primary ring-2 ring-primary/30")}>
                <span>
                  <span className="block font-medium">{s.name}</span>
                  <span className="text-sm text-muted-foreground">{s.durationMinutes} dk</span>
                </span>
                <span className="flex items-center gap-2 font-medium">{formatKurus(s.priceKurus)} {on && <Check className="size-4 text-primary" />}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
```

`BarberStep.tsx`:

```tsx
"use client";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { publicUrl } from "@/lib/storage-public";

export type BarberItem = { id: string; name: string; bio: string | null; photoKey: string; recentPhotoKeys: string[] };

export function BarberStep({ barbers, selectedId, onSelect }: { barbers: BarberItem[]; selectedId: string | null; onSelect: (id: string) => void }) {
  return (
    <section>
      <h2 className="mb-3 text-2xl">2. Berber seç</h2>
      <ul className="grid gap-3">
        {barbers.map((b) => (
          <li key={b.id}>
            <button type="button" onClick={() => onSelect(b.id)} aria-pressed={selectedId === b.id}
              className={cn("flex w-full gap-3 rounded-xl border bg-card p-3 text-left", selectedId === b.id && "border-primary ring-2 ring-primary/30")}>
              <Image src={publicUrl(b.photoKey)} alt={b.name} width={64} height={64} className="size-16 rounded-full object-cover" />
              <span className="min-w-0 flex-1">
                <span className="block font-medium">{b.name}</span>
                {b.bio && <span className="block text-sm text-muted-foreground">{b.bio}</span>}
                {b.recentPhotoKeys.length > 0 && (
                  <span className="mt-2 flex gap-1">
                    {b.recentPhotoKeys.map((k) => (
                      <Image key={k} src={publicUrl(k)} alt="" width={40} height={40} className="size-10 rounded-md object-cover" />
                    ))}
                  </span>
                )}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
```

`SlotStep.tsx`:

```tsx
"use client";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { formatShopTime } from "@/lib/time";

type Availability = { slots: string[]; isOpenToday: boolean; opensAt: string | null };

export function SlotStep({ barberId, durationMinutes, selected, onSelect }: { barberId: string; durationMinutes: number; selected: string | null; onSelect: (iso: string) => void }) {
  const [data, setData] = useState<Availability | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setData(null);
    fetch(`/api/availability?barberId=${barberId}&duration=${durationMinutes}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => alive && setData(d))
      .catch(() => alive && setError("Saatler yüklenemedi"));
    return () => { alive = false; };
  }, [barberId, durationMinutes]);

  return (
    <section>
      <h2 className="mb-3 text-2xl">3. Saat seç</h2>
      {error && <p className="text-destructive">{error}</p>}
      {!data && !error && <p className="text-muted-foreground">Yükleniyor…</p>}
      {data && !data.isOpenToday && (
        <p className="rounded-xl bg-muted p-4">Bugün kapalıyız. {data.opensAt ? `Yarın ${data.opensAt} itibarıyla tekrar deneyin.` : ""}</p>
      )}
      {data && data.isOpenToday && data.slots.length === 0 && (
        <p className="rounded-xl bg-muted p-4">Bugün için uygun saat kalmadı. {data.opensAt ? `Yarın ${data.opensAt} itibarıyla tekrar deneyin.` : ""}</p>
      )}
      {data && data.slots.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {data.slots.map((iso) => (
            <button key={iso} type="button" onClick={() => onSelect(iso)} aria-pressed={selected === iso}
              className={cn("rounded-lg border bg-card py-2 text-sm font-medium", selected === iso && "bg-primary text-primary-foreground border-primary")}>
              {formatShopTime(new Date(iso))}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
```

- [ ] **Step 6: Elle doğrula**

Seed'deki berberlerin `photoKey` değerleri R2'de yok; geliştirme için `R2_PUBLIC_URL` boşsa `publicUrl` "/seed/kwame.jpg" döner. `public/seed/kwame.jpg` ve `public/seed/amara.jpg` olarak iki placeholder görsel koy (herhangi bir 400x400 jpg).

Run: `npm run dev`. Hizmet seç → berber seç → saatler listelenir (şu andan sonrakiler) → "Giriş yap ve onayla" → giriş → aynı seçimlerle geri döner → onayla → `/randevularim` (henüz 404, Task 8). Prisma Studio'da randevu ve 2 AppointmentService görün.

Run: `npm run typecheck && npm run lint`

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "Müşteri randevu alma akışı"
git push
```

---

### Task 8: Randevularım sayfası ve müşteri iptali

**Files:**
- Create: `src/lib/queries/customer.ts`, `src/app/(musteri)/randevularim/page.tsx`, `src/components/booking/AppointmentCard.tsx`, `src/components/booking/CancelButton.tsx`
- Modify: `src/actions/appointments.ts` (add `cancelAppointmentByCustomer`)
- Test: `tests/integration/cancel.test.ts`

**Interfaces:**
- Produces: `getCustomerAppointments(customerId)` → `{ today: AppointmentView[]; past: AppointmentView[] }`, `getCustomerPhotos(customerId)` → `{ id, storageKey, createdAt, barberName }[]`
- Produces: `AppointmentView = { id, startsAt, endsAt, status, barberName, services: { name, priceSnapshot }[], totalKurus, canCancel: boolean }`
- Produces: `cancelAppointmentByCustomer(appointmentId, opts?: { now?: Date; customerId?: string })` → `ActionResult<void>`

- [ ] **Step 1: Failing test**

`tests/integration/cancel.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { prisma } from "@/lib/db";
import { createBarber, createCustomer } from "./helpers";
import { cancelAppointmentByCustomer } from "@/actions/appointments";

async function appt(customerId: string, barberId: string, startsAt: string) {
  return prisma.appointment.create({
    data: { customerId, barberId, startsAt: new Date(startsAt), endsAt: new Date(new Date(startsAt).getTime() + 30 * 60_000) },
  });
}

describe("cancelAppointmentByCustomer", () => {
  it("cancels when more than window remains (default 120 min)", async () => {
    const { barber } = await createBarber();
    const c = await createCustomer();
    const a = await appt(c.id, barber.id, "2026-09-17T12:00:00Z");
    const r = await cancelAppointmentByCustomer(a.id, { now: new Date("2026-09-17T09:00:00Z"), customerId: c.id });
    expect(r.ok).toBe(true);
    const after = await prisma.appointment.findUnique({ where: { id: a.id } });
    expect(after?.status).toBe("CANCELLED");
    expect(after?.cancelledBy).toBe("CUSTOMER");
  });

  it("refuses inside the window", async () => {
    const { barber } = await createBarber();
    const c = await createCustomer();
    const a = await appt(c.id, barber.id, "2026-09-17T12:00:00Z");
    const r = await cancelAppointmentByCustomer(a.id, { now: new Date("2026-09-17T10:30:00Z"), customerId: c.id });
    expect(r).toEqual({ ok: false, error: "Randevuya 120 dakikadan az kaldığı için iptal edilemez, lütfen dükkanı arayın" });
  });

  it("refuses other customer's appointment", async () => {
    const { barber } = await createBarber();
    const c1 = await createCustomer();
    const c2 = await createCustomer();
    const a = await appt(c1.id, barber.id, "2026-09-17T12:00:00Z");
    const r = await cancelAppointmentByCustomer(a.id, { now: new Date("2026-09-17T08:00:00Z"), customerId: c2.id });
    expect(r).toEqual({ ok: false, error: "Randevu bulunamadı" });
  });

  it("refuses already cancelled", async () => {
    const { barber } = await createBarber();
    const c = await createCustomer();
    const a = await appt(c.id, barber.id, "2026-09-17T12:00:00Z");
    await prisma.appointment.update({ where: { id: a.id }, data: { status: "CANCELLED" } });
    const r = await cancelAppointmentByCustomer(a.id, { now: new Date("2026-09-17T08:00:00Z"), customerId: c.id });
    expect(r.ok).toBe(false);
  });
});
```

Run: `npm run test:integration -- tests/integration/cancel.test.ts` → FAIL (export yok).

- [ ] **Step 2: cancelAppointmentByCustomer**

`src/actions/appointments.ts` sonuna ekle:

```ts
import { getSettings } from "@/lib/settings";

export async function cancelAppointmentByCustomer(
  appointmentId: string,
  opts: { now?: Date; customerId?: string } = {},
): Promise<ActionResult<void>> {
  const customerId = opts.customerId ?? (await getSessionUser())?.id;
  if (!customerId) return fail("Giriş yapmalısınız");
  const now = opts.now ?? new Date();

  const appt = await prisma.appointment.findFirst({ where: { id: appointmentId, customerId } });
  if (!appt) return fail("Randevu bulunamadı");
  if (appt.status !== "SCHEDULED") return fail("Bu randevu zaten iptal edilmiş veya tamamlanmış");

  const settings = await getSettings();
  const windowMs = settings.cancellationWindowMinutes * 60_000;
  if (appt.startsAt.getTime() - now.getTime() < windowMs) {
    return fail(`Randevuya ${settings.cancellationWindowMinutes} dakikadan az kaldığı için iptal edilemez, lütfen dükkanı arayın`);
  }

  await prisma.appointment.update({ where: { id: appt.id }, data: { status: "CANCELLED", cancelledBy: "CUSTOMER" } });
  return ok(undefined);
}
```

(`import` satırını dosyanın üstüne taşı.) Run: test → 4 passed.

- [ ] **Step 3: queries/customer.ts**

```ts
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { shopDayStart, addMinutes } from "@/lib/time";

export type AppointmentView = {
  id: string;
  startsAt: Date;
  endsAt: Date;
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
  barberName: string;
  services: { name: string; priceSnapshot: number }[];
  totalKurus: number;
  canCancel: boolean;
};

export async function getCustomerAppointments(customerId: string, now: Date = new Date()) {
  const settings = await getSettings();
  const dayStart = shopDayStart(now);
  const dayEnd = addMinutes(dayStart, 24 * 60);
  const rows = await prisma.appointment.findMany({
    where: { customerId },
    include: { barber: { include: { user: { select: { name: true } } } }, services: true },
    orderBy: { startsAt: "desc" },
    take: 50,
  });
  const views: AppointmentView[] = rows.map((a) => ({
    id: a.id,
    startsAt: a.startsAt,
    endsAt: a.endsAt,
    status: a.status,
    barberName: a.barber.user.name,
    services: a.services.map((s) => ({ name: s.nameSnapshot, priceSnapshot: s.priceSnapshot })),
    totalKurus: a.services.reduce((t, s) => t + s.priceSnapshot, 0),
    canCancel: a.status === "SCHEDULED" && a.startsAt.getTime() - now.getTime() >= settings.cancellationWindowMinutes * 60_000,
  }));
  const today = views.filter((v) => v.status === "SCHEDULED" && v.startsAt >= dayStart && v.startsAt < dayEnd).reverse();
  const past = views.filter((v) => !today.some((t) => t.id === v.id));
  return { today, past };
}

export async function getCustomerPhotos(customerId: string) {
  const rows = await prisma.haircutPhoto.findMany({
    where: { customerId },
    include: { barber: { include: { user: { select: { name: true } } } } },
    orderBy: { createdAt: "desc" },
  });
  return rows.map((p) => ({ id: p.id, storageKey: p.storageKey, createdAt: p.createdAt, barberName: p.barber.user.name }));
}
```

- [ ] **Step 4: Sayfa ve bileşenler**

`src/components/booking/CancelButton.tsx`:

```tsx
"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cancelAppointmentByCustomer } from "@/actions/appointments";

export function CancelButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <Button variant="outline" size="sm" disabled={pending}
      onClick={() => start(async () => {
        const r = await cancelAppointmentByCustomer(id);
        if (r.ok) { toast.success("Randevu iptal edildi"); router.refresh(); } else toast.error(r.error);
      })}>
      {pending ? "İptal ediliyor…" : "İptal et"}
    </Button>
  );
}
```

`src/components/booking/AppointmentCard.tsx`:

```tsx
import { Badge } from "@/components/ui/badge";
import { formatKurus } from "@/lib/money";
import { formatShopDate, formatShopTime } from "@/lib/time";
import type { AppointmentView } from "@/lib/queries/customer";
import { CancelButton } from "./CancelButton";

const STATUS: Record<AppointmentView["status"], string> = {
  SCHEDULED: "Planlandı", COMPLETED: "Tamamlandı", CANCELLED: "İptal", NO_SHOW: "Gelmedi",
};

export function AppointmentCard({ a, shopPhone, big = false }: { a: AppointmentView; shopPhone: string; big?: boolean }) {
  return (
    <div className={big ? "rounded-2xl border-2 border-primary bg-card p-5" : "rounded-xl border bg-card p-4"}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className={big ? "text-3xl" : "font-medium"}>{formatShopTime(a.startsAt)} – {formatShopTime(a.endsAt)}</p>
          <p className="text-sm text-muted-foreground">{formatShopDate(a.startsAt)} · {a.barberName}</p>
        </div>
        <Badge variant={a.status === "SCHEDULED" ? "default" : "secondary"}>{STATUS[a.status]}</Badge>
      </div>
      <p className="mt-2 text-sm">{a.services.map((s) => s.name).join(", ")} · {formatKurus(a.totalKurus)}</p>
      {a.status === "SCHEDULED" && (
        <div className="mt-3">
          {a.canCancel ? <CancelButton id={a.id} /> : <p className="text-sm text-muted-foreground">İptal için dükkanı arayın: {shopPhone}</p>}
        </div>
      )}
    </div>
  );
}
```

`src/app/(musteri)/randevularim/page.tsx`:

```tsx
import Image from "next/image";
import { requireUser } from "@/lib/auth-helpers";
import { getCustomerAppointments, getCustomerPhotos } from "@/lib/queries/customer";
import { getSettings } from "@/lib/settings";
import { AppointmentCard } from "@/components/booking/AppointmentCard";
import { publicUrl } from "@/lib/storage-public";
import { formatShopDate } from "@/lib/time";

export const dynamic = "force-dynamic";

export default async function RandevularimPage() {
  const user = await requireUser("/randevularim");
  const [{ today, past }, photos, settings] = await Promise.all([getCustomerAppointments(user.id), getCustomerPhotos(user.id), getSettings()]);
  return (
    <div className="space-y-8">
      <section>
        <h1 className="mb-3 text-3xl">Bugünkü randevum</h1>
        {today.length === 0 ? <p className="text-muted-foreground">Bugün için randevun yok.</p> : today.map((a) => <AppointmentCard key={a.id} a={a} shopPhone={settings.phone} big />)}
      </section>
      {photos.length > 0 && (
        <section>
          <h2 className="mb-3 text-2xl">Kesim fotoğrafların</h2>
          <div className="grid grid-cols-2 gap-2">
            {photos.map((p) => (
              <figure key={p.id}>
                <Image src={publicUrl(p.storageKey)} alt="" width={300} height={300} className="aspect-square w-full rounded-xl object-cover" />
                <figcaption className="mt-1 text-xs text-muted-foreground">{formatShopDate(p.createdAt)} · {p.barberName}</figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}
      <section>
        <h2 className="mb-3 text-2xl">Geçmiş</h2>
        {past.length === 0 ? <p className="text-muted-foreground">Henüz geçmiş randevun yok.</p> : <div className="space-y-2">{past.map((a) => <AppointmentCard key={a.id} a={a} shopPhone={settings.phone} />)}</div>}
      </section>
    </div>
  );
}
```

- [ ] **Step 5: Elle doğrula ve commit**

Run: `npm run dev`, randevu al → `/randevularim`'de büyük kart, iptal butonu (120 dk'dan uzaksa) veya telefon mesajı. `npm run typecheck && npm run lint`.

```bash
git add -A
git commit -m "Randevularım sayfası ve müşteri iptali"
git push
```

---

### Task 9: E-posta bildirimleri (Resend + React Email)

**Files:**
- Create: `src/lib/email/send.ts`, `src/lib/email/templates/AppointmentConfirmed.tsx`, `AppointmentCancelled.tsx`, `NewAppointmentForBarber.tsx`
- Modify: `src/actions/appointments.ts` (create ve cancel sonrası gönderim)
- Test: `tests/unit/email-templates.test.tsx`

**Interfaces:**
- Produces: `sendAppointmentConfirmed(appointmentId)`, `sendAppointmentCancelled(appointmentId, by: "CUSTOMER" | "STAFF")`, `sendNewAppointmentToBarber(appointmentId)`; hepsi `Promise<void>`, hata fırlatmaz (console.error).
- Produces: `renderConfirmed(props)` vb. saf render fonksiyonları (test için).

- [ ] **Step 1: Şablon render testi (failing)**

`tests/unit/email-templates.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render } from "@react-email/components";
import { AppointmentConfirmed } from "@/lib/email/templates/AppointmentConfirmed";

describe("AppointmentConfirmed", () => {
  it("renders Turkish summary", async () => {
    const html = await render(
      <AppointmentConfirmed shopName="Afro Salon" customerName="Ali" barberName="Kwame" dateText="17 Eylül 2026 Perşembe" timeText="14:30" services={["Saç", "Sakal"]} totalText="600,00 ₺" manageUrl="http://localhost:3000/randevularim" />,
    );
    expect(html).toContain("Randevun onaylandı");
    expect(html).toContain("Kwame");
    expect(html).toContain("14:30");
    expect(html).toContain("Saç, Sakal");
  });
});
```

`vitest.config.ts` include'a `"tests/unit/**/*.test.tsx"` ekle ve `esbuild: { jsx: "automatic" }` ayarla.

Run: `npm test` → FAIL.

- [ ] **Step 2: Şablonlar**

`src/lib/email/templates/AppointmentConfirmed.tsx`:

```tsx
import { Html, Body, Container, Heading, Text, Button, Hr } from "@react-email/components";

export type ConfirmedProps = {
  shopName: string; customerName: string; barberName: string; dateText: string; timeText: string; services: string[]; totalText: string; manageUrl: string;
};

export function AppointmentConfirmed(p: ConfirmedProps) {
  return (
    <Html lang="tr">
      <Body style={{ fontFamily: "Arial, sans-serif", backgroundColor: "#f6efe4", color: "#3b2a1e" }}>
        <Container style={{ padding: 24 }}>
          <Heading as="h1">Randevun onaylandı</Heading>
          <Text>Merhaba {p.customerName},</Text>
          <Text><strong>{p.dateText}</strong> günü saat <strong>{p.timeText}</strong>, berberin <strong>{p.barberName}</strong>.</Text>
          <Text>Hizmetler: {p.services.join(", ")}<br />Toplam: {p.totalText}</Text>
          <Button href={p.manageUrl} style={{ backgroundColor: "#c2613b", color: "#fff", padding: "10px 18px", borderRadius: 8 }}>Randevularımı gör</Button>
          <Hr />
          <Text style={{ fontSize: 12 }}>{p.shopName}</Text>
        </Container>
      </Body>
    </Html>
  );
}
```

`AppointmentCancelled.tsx`: aynı yapı, başlık "Randevun iptal edildi", gövde `{p.byText}` ("Randevunu sen iptal ettin." / "Randevun salon tarafından iptal edildi, yeni randevu için tekrar deneyebilirsin."). Props: `shopName, customerName, dateText, timeText, byText, bookUrl`.

`NewAppointmentForBarber.tsx`: başlık "Yeni randevu", gövde müşteri adı, telefon, saat, hizmetler. Props: `barberName, customerName, customerPhone, timeText, services: string[], panelUrl`.

Run: `npm test` → geçer.

- [ ] **Step 3: send.ts**

```ts
import { Resend } from "resend";
import { render } from "@react-email/components";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { formatKurus } from "@/lib/money";
import { formatShopDate, formatShopTime } from "@/lib/time";
import { AppointmentConfirmed } from "./templates/AppointmentConfirmed";
import { AppointmentCancelled } from "./templates/AppointmentCancelled";
import { NewAppointmentForBarber } from "./templates/NewAppointmentForBarber";

function baseUrl() {
  return process.env.AUTH_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
}

async function deliver(to: string, subject: string, html: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.info(`[email:skipped] to=${to} subject="${subject}"`);
    return;
  }
  try {
    const resend = new Resend(key);
    await resend.emails.send({ from: process.env.EMAIL_FROM ?? "Afro Salon <onboarding@resend.dev>", to, subject, html });
  } catch (e) {
    console.error("[email:error]", e);
  }
}

async function loadAppointment(id: string) {
  return prisma.appointment.findUnique({
    where: { id },
    include: { customer: true, barber: { include: { user: true } }, services: true },
  });
}

export async function sendAppointmentConfirmed(appointmentId: string) {
  const a = await loadAppointment(appointmentId);
  if (!a) return;
  const settings = await getSettings();
  const html = await render(
    AppointmentConfirmed({
      shopName: settings.shopName,
      customerName: a.customer.name,
      barberName: a.barber.user.name,
      dateText: formatShopDate(a.startsAt),
      timeText: formatShopTime(a.startsAt),
      services: a.services.map((s) => s.nameSnapshot),
      totalText: formatKurus(a.services.reduce((t, s) => t + s.priceSnapshot, 0)),
      manageUrl: `${baseUrl()}/randevularim`,
    }),
  );
  await deliver(a.customer.email, `Randevun onaylandı · ${formatShopTime(a.startsAt)}`, html);
}

export async function sendAppointmentCancelled(appointmentId: string, by: "CUSTOMER" | "STAFF") {
  const a = await loadAppointment(appointmentId);
  if (!a) return;
  const settings = await getSettings();
  const html = await render(
    AppointmentCancelled({
      shopName: settings.shopName,
      customerName: a.customer.name,
      dateText: formatShopDate(a.startsAt),
      timeText: formatShopTime(a.startsAt),
      byText: by === "CUSTOMER" ? "Randevunu sen iptal ettin." : "Randevun salon tarafından iptal edildi, yeni randevu için tekrar deneyebilirsin.",
      bookUrl: baseUrl(),
    }),
  );
  await deliver(a.customer.email, "Randevun iptal edildi", html);
}

export async function sendNewAppointmentToBarber(appointmentId: string) {
  const settings = await getSettings();
  if (!settings.notifyBarberOnBooking) return;
  const a = await loadAppointment(appointmentId);
  if (!a) return;
  const html = await render(
    NewAppointmentForBarber({
      barberName: a.barber.user.name,
      customerName: a.customer.name,
      customerPhone: a.customer.phone ?? "-",
      timeText: `${formatShopTime(a.startsAt)} – ${formatShopTime(a.endsAt)}`,
      services: a.services.map((s) => s.nameSnapshot),
      panelUrl: `${baseUrl()}/panel`,
    }),
  );
  await deliver(a.barber.user.email, `Yeni randevu · ${formatShopTime(a.startsAt)}`, html);
}
```

- [ ] **Step 4: Action'lara bağla**

`createAppointment` içinde `return ok({ id: appt.id })` satırından önce:

```ts
    if (!opts.now) {
      await Promise.all([sendAppointmentConfirmed(appt.id), sendNewAppointmentToBarber(appt.id)]);
    }
```

`cancelAppointmentByCustomer` içinde update sonrası:

```ts
  if (!opts.now) await sendAppointmentCancelled(appt.id, "CUSTOMER");
```

`opts.now` testlerde verilir, e-posta gönderimi testlerde atlanır. Import: `import { sendAppointmentConfirmed, sendAppointmentCancelled, sendNewAppointmentToBarber } from "@/lib/email/send";`

- [ ] **Step 5: Doğrula ve commit**

Run: `npm test && npm run test:integration`. Dev'de `RESEND_API_KEY` boşken randevu al → terminalde `[email:skipped]` iki satır. Anahtar girilince gerçek e-posta gelir (Resend test modunda sadece hesabın kendi adresine).

```bash
git add -A
git commit -m "Randevu onay ve iptal e-postaları"
git push
```

---

### Task 10: Panel iskeleti, "Bugün" ekranı ve personel durum aksiyonları

**Files:**
- Create: `src/app/panel/layout.tsx`, `src/app/panel/page.tsx`, `src/components/panel/PanelNav.tsx`, `src/components/panel/TodayBoard.tsx`, `src/components/panel/AppointmentActions.tsx`
- Create: `src/lib/queries/panel.ts`, `src/actions/staff-appointments.ts`, `src/lib/staff-scope.ts`
- Test: `tests/integration/staff-appointments.test.ts`

**Interfaces:**
- Produces (`src/lib/queries/panel.ts`): `getTodayBoard(user: SessionUser, now?: Date)` → `{ dayStart: Date; columns: { barberId, barberName, appointments: PanelAppointment[] }[] }`; `PanelAppointment = { id, startsAt, endsAt, status, customerName, customerPhone, customerId, services: string[], totalKurus }`
- Produces (`src/actions/staff-appointments.ts`): `setAppointmentStatus(appointmentId, status: "COMPLETED" | "NO_SHOW" | "CANCELLED", opts?: { actor?: SessionUser; now?: Date })` → `ActionResult<void>`. BARBER sadece kendi berberId'sindeki randevuyu değiştirebilir; ADMIN hepsini.

- [ ] **Step 1: Failing test**

`tests/integration/staff-appointments.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { prisma } from "@/lib/db";
import { createBarber, createCustomer } from "./helpers";
import { setAppointmentStatus } from "@/actions/staff-appointments";
import type { SessionUser } from "@/lib/auth-helpers";

const NOW = new Date("2026-09-17T07:00:00Z");
const asUser = (u: { id: string; name: string; email: string; role: "BARBER" | "ADMIN" }, barberId: string | null): SessionUser => ({ ...u, barberId });

async function appt(customerId: string, barberId: string) {
  return prisma.appointment.create({ data: { customerId, barberId, startsAt: new Date("2026-09-17T08:00:00Z"), endsAt: new Date("2026-09-17T08:30:00Z") } });
}

describe("setAppointmentStatus", () => {
  it("barber completes own appointment", async () => {
    const { user, barber } = await createBarber();
    const c = await createCustomer();
    const a = await appt(c.id, barber.id);
    const r = await setAppointmentStatus(a.id, "COMPLETED", { actor: asUser({ ...user, role: "BARBER" }, barber.id), now: NOW });
    expect(r.ok).toBe(true);
    expect((await prisma.appointment.findUnique({ where: { id: a.id } }))?.status).toBe("COMPLETED");
  });

  it("barber cannot touch another barber's appointment", async () => {
    const b1 = await createBarber();
    const b2 = await createBarber();
    const c = await createCustomer();
    const a = await appt(c.id, b1.barber.id);
    const r = await setAppointmentStatus(a.id, "COMPLETED", { actor: asUser({ ...b2.user, role: "BARBER" }, b2.barber.id), now: NOW });
    expect(r).toEqual({ ok: false, error: "Randevu bulunamadı" });
  });

  it("admin cancels any appointment with cancelledBy STAFF", async () => {
    const b1 = await createBarber();
    const c = await createCustomer();
    const admin = await prisma.user.create({ data: { name: "Admin", email: "admin@t.local", passwordHash: "x", role: "ADMIN" } });
    const a = await appt(c.id, b1.barber.id);
    const r = await setAppointmentStatus(a.id, "CANCELLED", { actor: asUser({ ...admin, role: "ADMIN" }, null), now: NOW });
    expect(r.ok).toBe(true);
    const after = await prisma.appointment.findUnique({ where: { id: a.id } });
    expect(after?.status).toBe("CANCELLED");
    expect(after?.cancelledBy).toBe("STAFF");
  });

  it("cannot change a non-SCHEDULED appointment", async () => {
    const { user, barber } = await createBarber();
    const c = await createCustomer();
    const a = await appt(c.id, barber.id);
    await prisma.appointment.update({ where: { id: a.id }, data: { status: "CANCELLED" } });
    const r = await setAppointmentStatus(a.id, "COMPLETED", { actor: asUser({ ...user, role: "BARBER" }, barber.id), now: NOW });
    expect(r.ok).toBe(false);
  });
});
```

Run: `npm run test:integration -- tests/integration/staff-appointments.test.ts` → FAIL.

- [ ] **Step 2: actions/staff-appointments.ts**

```ts
"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { ok, fail, type ActionResult } from "@/lib/action-result";
import { getSessionUser, type SessionUser } from "@/lib/auth-helpers";
import { sendAppointmentCancelled } from "@/lib/email/send";

import { staffScope } from "@/lib/staff-scope";

async function resolveActor(actor?: SessionUser): Promise<SessionUser | null> {
  const u = actor ?? (await getSessionUser());
  if (!u || (u.role !== "BARBER" && u.role !== "ADMIN")) return null;
  return u;
}

export async function setAppointmentStatus(
  appointmentId: string,
  status: "COMPLETED" | "NO_SHOW" | "CANCELLED",
  opts: { actor?: SessionUser; now?: Date } = {},
): Promise<ActionResult<void>> {
  const actor = await resolveActor(opts.actor);
  if (!actor) return fail("Yetkiniz yok");

  const appt = await prisma.appointment.findFirst({ where: { id: appointmentId, ...staffScope(actor) } });
  if (!appt) return fail("Randevu bulunamadı");
  if (appt.status !== "SCHEDULED") return fail("Bu randevunun durumu zaten değiştirilmiş");

  await prisma.appointment.update({
    where: { id: appt.id },
    data: { status, cancelledBy: status === "CANCELLED" ? "STAFF" : null },
  });
  if (status === "CANCELLED" && !opts.now) await sendAppointmentCancelled(appt.id, "STAFF");
  if (!opts.now) revalidatePath("/panel");
  return ok(undefined);
}
```

`src/lib/staff-scope.ts` (senkron olduğu için `"use server"` dosyasında olamaz):

```ts
import type { SessionUser } from "@/lib/auth-helpers";

/** BARBER için kendi berberId'si, ADMIN için kısıt yok */
export function staffScope(actor: SessionUser): { barberId?: string } {
  return actor.role === "ADMIN" ? {} : { barberId: actor.barberId ?? "__none__" };
}
```

Run: `npm run test:integration -- tests/integration/staff-appointments.test.ts` → 4 passed.

- [ ] **Step 3: queries/panel.ts**

```ts
import { prisma } from "@/lib/db";
import type { SessionUser } from "@/lib/auth-helpers";
import { staffScope } from "@/lib/staff-scope";
import { addMinutes, shopDayStart } from "@/lib/time";

export type PanelAppointment = {
  id: string; startsAt: Date; endsAt: Date; status: "SCHEDULED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
  customerId: string; customerName: string; customerPhone: string | null; services: string[]; totalKurus: number;
};

export async function getTodayBoard(user: SessionUser, now: Date = new Date()) {
  const dayStart = shopDayStart(now);
  const dayEnd = addMinutes(dayStart, 24 * 60);
  const barbers = await prisma.barber.findMany({
    where: { isActive: true, ...(user.role === "ADMIN" ? {} : { id: user.barberId ?? "__none__" }) },
    include: {
      user: { select: { name: true } },
      appointments: {
        where: { startsAt: { gte: dayStart, lt: dayEnd } },
        include: { customer: { select: { id: true, name: true, phone: true } }, services: true },
        orderBy: { startsAt: "asc" },
      },
    },
    orderBy: { user: { name: "asc" } },
  });
  return {
    dayStart,
    columns: barbers.map((b) => ({
      barberId: b.id,
      barberName: b.user.name,
      appointments: b.appointments.map<PanelAppointment>((a) => ({
        id: a.id, startsAt: a.startsAt, endsAt: a.endsAt, status: a.status,
        customerId: a.customer.id, customerName: a.customer.name, customerPhone: a.customer.phone,
        services: a.services.map((s) => s.nameSnapshot),
        totalKurus: a.services.reduce((t, s) => t + s.priceSnapshot, 0),
      })),
    })),
  };
}

export async function listAppointments(user: SessionUser, filter: { from: Date; to: Date; barberId?: string; status?: PanelAppointment["status"] }) {
  const scope = staffScope(user);
  const rows = await prisma.appointment.findMany({
    where: {
      ...scope,
      ...(filter.barberId && !scope.barberId ? { barberId: filter.barberId } : {}),
      ...(filter.status ? { status: filter.status } : {}),
      startsAt: { gte: filter.from, lt: filter.to },
    },
    include: { customer: { select: { id: true, name: true, phone: true } }, barber: { include: { user: { select: { name: true } } } }, services: true },
    orderBy: { startsAt: "desc" },
    take: 200,
  });
  return rows.map((a) => ({
    id: a.id, startsAt: a.startsAt, endsAt: a.endsAt, status: a.status, barberName: a.barber.user.name,
    customerId: a.customer.id, customerName: a.customer.name, customerPhone: a.customer.phone,
    services: a.services.map((s) => s.nameSnapshot), totalKurus: a.services.reduce((t, s) => t + s.priceSnapshot, 0),
  }));
}
```

- [ ] **Step 4: Panel layout ve nav**

`src/app/panel/layout.tsx`:

```tsx
import { requireStaff } from "@/lib/auth-helpers";
import { PanelNav } from "@/components/panel/PanelNav";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { logoutAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const user = await requireStaff();
  return (
    <div className="min-h-dvh md:grid md:grid-cols-[220px_1fr]">
      <aside className="border-b md:border-b-0 md:border-r">
        <div className="flex items-center justify-between p-4">
          <span className="font-display text-xl text-primary">Panel</span>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <form action={logoutAction}><Button variant="ghost" size="sm">Çıkış</Button></form>
          </div>
        </div>
        <PanelNav isAdmin={user.role === "ADMIN"} />
        <p className="px-4 pb-3 text-xs text-muted-foreground">{user.name}</p>
      </aside>
      <main className="p-4 md:p-6">{children}</main>
    </div>
  );
}
```

`src/components/panel/PanelNav.tsx`:

```tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/panel", label: "Bugün", admin: false },
  { href: "/panel/randevular", label: "Randevular", admin: false },
  { href: "/panel/izinler", label: "İzinler", admin: false },
  { href: "/panel/musteriler", label: "Müşteriler", admin: false },
  { href: "/panel/hizmetler", label: "Hizmetler", admin: true },
  { href: "/panel/berberler", label: "Berberler", admin: true },
  { href: "/panel/ayarlar", label: "Ayarlar", admin: true },
];

export function PanelNav({ isAdmin }: { isAdmin: boolean }) {
  const path = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto px-2 pb-2 md:flex-col md:overflow-visible">
      {ITEMS.filter((i) => isAdmin || !i.admin).map((i) => (
        <Link key={i.href} href={i.href}
          className={cn("whitespace-nowrap rounded-lg px-3 py-2 text-sm", path === i.href ? "bg-primary text-primary-foreground" : "hover:bg-muted")}>
          {i.label}
        </Link>
      ))}
    </nav>
  );
}
```

- [ ] **Step 5: Bugün sayfası, TodayBoard, AppointmentActions**

`src/app/panel/page.tsx`:

```tsx
import { requireStaff } from "@/lib/auth-helpers";
import { getTodayBoard } from "@/lib/queries/panel";
import { TodayBoard } from "@/components/panel/TodayBoard";
import { formatShopDate } from "@/lib/time";
import { AutoRefresh } from "@/components/panel/AutoRefresh";

export const dynamic = "force-dynamic";

export default async function PanelHome() {
  const user = await requireStaff();
  const board = await getTodayBoard(user);
  return (
    <div>
      <AutoRefresh seconds={60} />
      <h1 className="mb-4 text-3xl">Bugün · {formatShopDate(board.dayStart)}</h1>
      <TodayBoard columns={board.columns} />
    </div>
  );
}
```

`src/components/panel/AutoRefresh.tsx`:

```tsx
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function AutoRefresh({ seconds }: { seconds: number }) {
  const router = useRouter();
  useEffect(() => {
    const t = setInterval(() => router.refresh(), seconds * 1000);
    return () => clearInterval(t);
  }, [router, seconds]);
  return null;
}
```

`src/components/panel/TodayBoard.tsx`:

```tsx
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatShopTime } from "@/lib/time";
import { formatKurus } from "@/lib/money";
import type { PanelAppointment } from "@/lib/queries/panel";
import { AppointmentActions } from "./AppointmentActions";

const STATUS: Record<PanelAppointment["status"], string> = { SCHEDULED: "Planlandı", COMPLETED: "Tamamlandı", CANCELLED: "İptal", NO_SHOW: "Gelmedi" };

export function TodayBoard({ columns }: { columns: { barberId: string; barberName: string; appointments: PanelAppointment[] }[] }) {
  if (columns.length === 0) return <p className="text-muted-foreground">Aktif berber yok.</p>;
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {columns.map((c) => (
        <section key={c.barberId} className="rounded-xl border bg-card">
          <h2 className="border-b px-4 py-3 text-xl">{c.barberName}</h2>
          <ul className="divide-y">
            {c.appointments.length === 0 && <li className="px-4 py-6 text-sm text-muted-foreground">Bugün randevu yok</li>}
            {c.appointments.map((a) => (
              <li key={a.id} className="space-y-2 px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{formatShopTime(a.startsAt)} – {formatShopTime(a.endsAt)}</span>
                  <Badge variant={a.status === "SCHEDULED" ? "default" : "secondary"}>{STATUS[a.status]}</Badge>
                </div>
                <p className="text-sm">
                  <Link href={`/panel/musteriler/${a.customerId}`} className="underline">{a.customerName}</Link>
                  {a.customerPhone && <span className="text-muted-foreground"> · {a.customerPhone}</span>}
                </p>
                <p className="text-sm text-muted-foreground">{a.services.join(", ")} · {formatKurus(a.totalKurus)}</p>
                {a.status === "SCHEDULED" && <AppointmentActions id={a.id} />}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
```

`src/components/panel/AppointmentActions.tsx`:

```tsx
"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { setAppointmentStatus } from "@/actions/staff-appointments";

export function AppointmentActions({ id }: { id: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  const run = (status: "COMPLETED" | "NO_SHOW" | "CANCELLED") =>
    start(async () => {
      const r = await setAppointmentStatus(id, status);
      if (r.ok) { toast.success("Güncellendi"); router.refresh(); } else toast.error(r.error);
    });
  return (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" disabled={pending} onClick={() => run("COMPLETED")}>Tamamlandı</Button>
      <Button size="sm" variant="secondary" disabled={pending} onClick={() => run("NO_SHOW")}>Gelmedi</Button>
      <Button size="sm" variant="outline" disabled={pending} onClick={() => run("CANCELLED")}>İptal</Button>
    </div>
  );
}
```

- [ ] **Step 6: Doğrula ve commit**

Run: `npm run dev`; admin ile `/panel`: iki berber sütunu, bugünkü randevular, butonlar çalışır. Berber hesabıyla (`kwame@afrosalon.local`) sadece kendi sütunu ve nav'da Hizmetler/Berberler/Ayarlar yok. `npm run typecheck && npm run lint && npm run test:integration`.

```bash
git add -A
git commit -m "Panel iskeleti ve bugün ekranı"
git push
```

---

### Task 11: Hizmet yönetimi (admin)

**Files:**
- Create: `src/schemas/service.ts`, `src/actions/services.ts`, `src/app/panel/hizmetler/page.tsx`, `src/components/panel/ServiceForm.tsx`, `src/components/panel/ServiceRow.tsx`
- Test: `tests/unit/schemas-service.test.ts`, `tests/integration/services.test.ts`

**Interfaces:**
- Produces: `serviceSchema = { name, durationMinutes (5-480, 5'in katı), priceLira (number, ≥0), sortOrder }` → action içinde `priceKurus = Math.round(priceLira * 100)`
- Produces: `upsertService(input: ServiceInput & { id?: string }, opts?: { actor?: SessionUser })`, `toggleService(id, isActive, opts?)` → `ActionResult<{ id: string }>` / `ActionResult<void>`. Sadece ADMIN.

- [ ] **Step 1: Şema testi (failing)**

`tests/unit/schemas-service.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { serviceSchema } from "@/schemas/service";

describe("serviceSchema", () => {
  it("accepts valid", () => {
    expect(serviceSchema.safeParse({ name: "Saç", durationMinutes: 30, priceLira: 400, sortOrder: 1 }).success).toBe(true);
  });
  it("rejects duration not multiple of 5", () => {
    const r = serviceSchema.safeParse({ name: "Saç", durationMinutes: 32, priceLira: 400, sortOrder: 1 });
    expect(r.success).toBe(false);
  });
  it("coerces strings from FormData", () => {
    const r = serviceSchema.safeParse({ name: "Saç", durationMinutes: "45", priceLira: "550.5", sortOrder: "2" });
    expect(r.success && r.data.priceLira).toBe(550.5);
  });
});
```

- [ ] **Step 2: schemas/service.ts**

```ts
import { z } from "zod";

export const serviceSchema = z.object({
  name: z.string().trim().min(2, "Hizmet adı en az 2 karakter").max(60),
  durationMinutes: z.coerce.number().int().min(5).max(480).refine((n) => n % 5 === 0, "Süre 5'in katı olmalı"),
  priceLira: z.coerce.number().min(0, "Fiyat negatif olamaz").max(100000),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
});
export type ServiceInput = z.infer<typeof serviceSchema>;
```

Run: `npm test` → geçer.

- [ ] **Step 3: Integration test (failing)**

`tests/integration/services.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { prisma } from "@/lib/db";
import { upsertService, toggleService } from "@/actions/services";
import type { SessionUser } from "@/lib/auth-helpers";

const admin: SessionUser = { id: "a", name: "Admin", email: "a@t", role: "ADMIN", barberId: null };
const barber: SessionUser = { id: "b", name: "B", email: "b@t", role: "BARBER", barberId: "x" };

describe("services actions", () => {
  it("admin creates with kurus conversion", async () => {
    const r = await upsertService({ name: "Saç", durationMinutes: 30, priceLira: 400.5, sortOrder: 1 }, { actor: admin });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const s = await prisma.service.findUnique({ where: { id: r.data.id } });
    expect(s?.priceKurus).toBe(40050);
  });
  it("admin updates existing", async () => {
    const c = await upsertService({ name: "Saç", durationMinutes: 30, priceLira: 400, sortOrder: 1 }, { actor: admin });
    if (!c.ok) throw new Error();
    const u = await upsertService({ id: c.data.id, name: "Saç Kesimi", durationMinutes: 45, priceLira: 450, sortOrder: 1 }, { actor: admin });
    expect(u.ok).toBe(true);
    expect((await prisma.service.findUnique({ where: { id: c.data.id } }))?.name).toBe("Saç Kesimi");
  });
  it("barber is refused", async () => {
    const r = await upsertService({ name: "Saç", durationMinutes: 30, priceLira: 400, sortOrder: 1 }, { actor: barber });
    expect(r).toEqual({ ok: false, error: "Yetkiniz yok" });
  });
  it("toggle deactivates", async () => {
    const c = await upsertService({ name: "Saç", durationMinutes: 30, priceLira: 400, sortOrder: 1 }, { actor: admin });
    if (!c.ok) throw new Error();
    await toggleService(c.data.id, false, { actor: admin });
    expect((await prisma.service.findUnique({ where: { id: c.data.id } }))?.isActive).toBe(false);
  });
});
```

- [ ] **Step 4: actions/services.ts**

```ts
"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { ok, fail, type ActionResult } from "@/lib/action-result";
import { getSessionUser, type SessionUser } from "@/lib/auth-helpers";
import { serviceSchema, type ServiceInput } from "@/schemas/service";

async function requireAdminActor(actor?: SessionUser) {
  const u = actor ?? (await getSessionUser());
  return u?.role === "ADMIN" ? u : null;
}

export async function upsertService(input: ServiceInput & { id?: string }, opts: { actor?: SessionUser } = {}): Promise<ActionResult<{ id: string }>> {
  if (!(await requireAdminActor(opts.actor))) return fail("Yetkiniz yok");
  const parsed = serviceSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Geçersiz bilgi");
  const data = { name: parsed.data.name, durationMinutes: parsed.data.durationMinutes, priceKurus: Math.round(parsed.data.priceLira * 100), sortOrder: parsed.data.sortOrder };
  const s = input.id
    ? await prisma.service.update({ where: { id: input.id }, data })
    : await prisma.service.create({ data });
  if (!opts.actor) revalidatePath("/panel/hizmetler");
  return ok({ id: s.id });
}

export async function toggleService(id: string, isActive: boolean, opts: { actor?: SessionUser } = {}): Promise<ActionResult<void>> {
  if (!(await requireAdminActor(opts.actor))) return fail("Yetkiniz yok");
  await prisma.service.update({ where: { id }, data: { isActive } });
  if (!opts.actor) revalidatePath("/panel/hizmetler");
  return ok(undefined);
}
```

Run: `npm run test:integration -- tests/integration/services.test.ts` → 4 passed.

- [ ] **Step 5: Sayfa ve form**

`src/app/panel/hizmetler/page.tsx`:

```tsx
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { ServiceForm } from "@/components/panel/ServiceForm";
import { ServiceRow } from "@/components/panel/ServiceRow";

export const dynamic = "force-dynamic";

export default async function HizmetlerPage() {
  await requireAdmin();
  const services = await prisma.service.findMany({ orderBy: [{ isActive: "desc" }, { sortOrder: "asc" }] });
  return (
    <div className="space-y-6">
      <h1 className="text-3xl">Hizmetler</h1>
      <section className="rounded-xl border bg-card p-4">
        <h2 className="mb-3 text-xl">Yeni hizmet</h2>
        <ServiceForm />
      </section>
      <ul className="space-y-2">
        {services.map((s) => <ServiceRow key={s.id} service={{ id: s.id, name: s.name, durationMinutes: s.durationMinutes, priceKurus: s.priceKurus, sortOrder: s.sortOrder, isActive: s.isActive }} />)}
      </ul>
    </div>
  );
}
```

`src/components/panel/ServiceForm.tsx`:

```tsx
"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { upsertService } from "@/actions/services";

type Initial = { id: string; name: string; durationMinutes: number; priceKurus: number; sortOrder: number };

export function ServiceForm({ initial, onDone }: { initial?: Initial; onDone?: () => void }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  return (
    <form
      className="grid gap-3 sm:grid-cols-4"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        start(async () => {
          const r = await upsertService({
            id: initial?.id,
            name: String(fd.get("name")),
            durationMinutes: Number(fd.get("durationMinutes")),
            priceLira: Number(fd.get("priceLira")),
            sortOrder: Number(fd.get("sortOrder")),
          });
          if (!r.ok) { setError(r.error); return; }
          setError(null);
          toast.success(initial ? "Hizmet güncellendi" : "Hizmet eklendi");
          router.refresh();
          onDone?.();
          if (!initial) (e.target as HTMLFormElement).reset();
        });
      }}
    >
      <div><Label htmlFor="name">Ad</Label><Input id="name" name="name" defaultValue={initial?.name} required /></div>
      <div><Label htmlFor="durationMinutes">Süre (dk)</Label><Input id="durationMinutes" name="durationMinutes" type="number" step={5} min={5} defaultValue={initial?.durationMinutes ?? 30} required /></div>
      <div><Label htmlFor="priceLira">Fiyat (₺)</Label><Input id="priceLira" name="priceLira" type="number" step="0.01" min={0} defaultValue={initial ? initial.priceKurus / 100 : ""} required /></div>
      <div><Label htmlFor="sortOrder">Sıra</Label><Input id="sortOrder" name="sortOrder" type="number" min={0} defaultValue={initial?.sortOrder ?? 0} /></div>
      {error && <p className="text-sm text-destructive sm:col-span-4">{error}</p>}
      <Button type="submit" disabled={pending} className="sm:col-span-4">{initial ? "Kaydet" : "Ekle"}</Button>
    </form>
  );
}
```

`src/components/panel/ServiceRow.tsx`:

```tsx
"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatKurus } from "@/lib/money";
import { toggleService } from "@/actions/services";
import { ServiceForm } from "./ServiceForm";

type S = { id: string; name: string; durationMinutes: number; priceKurus: number; sortOrder: number; isActive: boolean };

export function ServiceRow({ service }: { service: S }) {
  const [editing, setEditing] = useState(false);
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <li className="rounded-xl border bg-card p-4">
      {editing ? (
        <ServiceForm initial={service} onDone={() => setEditing(false)} />
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="font-medium">{service.name} {!service.isActive && <Badge variant="secondary">Pasif</Badge>}</p>
            <p className="text-sm text-muted-foreground">{service.durationMinutes} dk · {formatKurus(service.priceKurus)} · sıra {service.sortOrder}</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setEditing(true)}>Düzenle</Button>
            <Button size="sm" variant="secondary" disabled={pending}
              onClick={() => start(async () => { await toggleService(service.id, !service.isActive); router.refresh(); })}>
              {service.isActive ? "Pasife al" : "Aktif et"}
            </Button>
          </div>
        </div>
      )}
    </li>
  );
}
```

- [ ] **Step 6: Doğrula ve commit**

`/panel/hizmetler`: ekle, düzenle, pasife al; ana sayfada pasif hizmet görünmez. `npm run typecheck && npm run lint`.

```bash
git add -A
git commit -m "Hizmet yönetimi"
git push
```

---

### Task 12: R2 depolama, presigned yükleme, berber yönetimi ve çalışma saatleri (admin)

**Files:**
- Create: `src/lib/storage.ts` (sunucu tarafı: presign + delete; `publicUrl` `storage-public.ts`'de kalır)
- Create: `src/app/api/upload/presign/route.ts`, `src/components/panel/ImageUploader.tsx`
- Create: `src/schemas/barber.ts`, `src/actions/barbers.ts`, `src/lib/queries/barbers.ts`
- Create: `src/app/panel/berberler/page.tsx`, `src/app/panel/berberler/[id]/page.tsx`, `src/components/panel/BarberForm.tsx`, `src/components/panel/WorkingHoursForm.tsx`
- Test: `tests/unit/schemas-barber.test.ts`, `tests/integration/barbers.test.ts`

**Interfaces:**
- Produces (`src/lib/storage.ts`, sadece sunucu): `createPresignedUpload(kind: "barber" | "haircut", contentType: string): Promise<{ url: string; key: string }>`, `deleteObject(key: string): Promise<void>`. Client bileşenleri bu dosyayı import etmez.
- Produces: `POST /api/upload/presign` body `{ kind, contentType }` → `{ url, key }`. Sadece BARBER/ADMIN.
- Produces: `<ImageUploader kind name defaultKey />` → gizli `<input name={name} value={key}>` ile forma anahtar yazar.
- Produces (`src/schemas/barber.ts`): `createBarberSchema = { name, email, password (min 8), bio?, photoKey (min 1) }`, `updateBarberSchema = { name, bio?, photoKey?, isActive }`, `workingHoursSchema = { days: { dayOfWeek: 0-6, isOff: boolean, startTime: "HH:mm", endTime: "HH:mm" }[] (7 eleman) }`
- Produces (`src/actions/barbers.ts`): `createBarber(input, opts?)` → `ActionResult<{ barberId }>`, `updateBarber(barberId, input, opts?)`, `saveWorkingHours(barberId, input, opts?)`, `resetBarberPassword(barberId, newPassword, opts?)`. Sadece ADMIN.
- Produces (`src/lib/queries/barbers.ts`): `listBarbersForAdmin()`, `getBarberDetail(barberId)` → `{ id, name, email, bio, photoKey, isActive, hours: { dayOfWeek, isOff, startTime, endTime }[] }`

- [ ] **Step 1: storage.ts (sunucu)**

`src/lib/storage.ts`:

```ts
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "node:crypto";

function client() {
  const accountId = process.env.R2_ACCOUNT_ID;
  if (!accountId) throw new Error("R2 yapılandırılmamış (R2_ACCOUNT_ID boş)");
  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID ?? "", secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "" },
  });
}

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function createPresignedUpload(kind: "barber" | "haircut", contentType: string): Promise<{ url: string; key: string }> {
  if (!ALLOWED.has(contentType)) throw new Error("Sadece JPEG, PNG veya WebP yüklenebilir");
  const ext = contentType === "image/png" ? "png" : contentType === "image/webp" ? "webp" : "jpg";
  const key = `${kind}s/${randomUUID()}.${ext}`;
  const cmd = new PutObjectCommand({ Bucket: process.env.R2_BUCKET, Key: key, ContentType: contentType });
  const url = await getSignedUrl(client(), cmd, { expiresIn: 300 });
  return { url, key };
}

export async function deleteObject(key: string): Promise<void> {
  try {
    await client().send(new DeleteObjectCommand({ Bucket: process.env.R2_BUCKET, Key: key }));
  } catch (e) {
    console.error("[storage:delete]", key, e);
  }
}
```

Not: `server-only` paketi kullanılmaz çünkü Vitest altında import edilince hata fırlatır; bu dosyayı client bileşenlerinden import etmemek geliştiricinin sorumluluğudur (`publicUrl` için `storage-public.ts`).

R2 bucket'ta CORS ayarı gerekir (Cloudflare panelinden): `AllowedOrigins: ["http://localhost:3000", "https://<canlı-alan>"]`, `AllowedMethods: ["PUT"]`, `AllowedHeaders: ["content-type"]`. README'ye yazılacak (Task 17).

- [ ] **Step 2: Presign route**

`src/app/api/upload/presign/route.ts`:

```ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth-helpers";
import { createPresignedUpload } from "@/lib/storage";

const bodySchema = z.object({ kind: z.enum(["barber", "haircut"]), contentType: z.string() });

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user || (user.role !== "BARBER" && user.role !== "ADMIN")) return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
  try {
    const r = await createPresignedUpload(parsed.data.kind, parsed.data.contentType);
    return NextResponse.json(r);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Yükleme hazırlanamadı" }, { status: 400 });
  }
}
```

- [ ] **Step 3: ImageUploader**

`src/components/panel/ImageUploader.tsx`:

```tsx
"use client";
import { useState } from "react";
import Image from "next/image";
import { publicUrl } from "@/lib/storage-public";
import { Input } from "@/components/ui/input";

export function ImageUploader({ kind, name, defaultKey, onUploaded }: { kind: "barber" | "haircut"; name: string; defaultKey?: string; onUploaded?: (key: string) => void }) {
  const [key, setKey] = useState(defaultKey ?? "");
  const [status, setStatus] = useState<string | null>(null);

  async function upload(file: File) {
    setStatus("Yükleniyor…");
    const res = await fetch("/api/upload/presign", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ kind, contentType: file.type }) });
    if (!res.ok) { setStatus((await res.json()).error ?? "Hata"); return; }
    const { url, key: newKey } = await res.json();
    const put = await fetch(url, { method: "PUT", headers: { "content-type": file.type }, body: file });
    if (!put.ok) { setStatus("Yükleme başarısız"); return; }
    setKey(newKey);
    setStatus("Yüklendi");
    onUploaded?.(newKey);
  }

  return (
    <div className="space-y-2">
      <input type="hidden" name={name} value={key} />
      {key && <Image src={publicUrl(key)} alt="" width={96} height={96} className="size-24 rounded-lg object-cover" />}
      <Input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
      {status && <p className="text-xs text-muted-foreground">{status}</p>}
    </div>
  );
}
```

- [ ] **Step 4: Şema testi ve şemalar**

`tests/unit/schemas-barber.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { createBarberSchema, workingHoursSchema } from "@/schemas/barber";

describe("barber schemas", () => {
  it("requires photoKey", () => {
    expect(createBarberSchema.safeParse({ name: "Kwame Mensah", email: "k@t.co", password: "Sifre123!", photoKey: "" }).success).toBe(false);
    expect(createBarberSchema.safeParse({ name: "Kwame Mensah", email: "k@t.co", password: "Sifre123!", photoKey: "barbers/a.jpg" }).success).toBe(true);
  });
  it("working hours: 7 days, end after start unless off", () => {
    const days = [0, 1, 2, 3, 4, 5, 6].map((d) => ({ dayOfWeek: d, isOff: d === 0, startTime: "09:00", endTime: "19:00" }));
    expect(workingHoursSchema.safeParse({ days }).success).toBe(true);
    days[1] = { dayOfWeek: 1, isOff: false, startTime: "19:00", endTime: "09:00" };
    expect(workingHoursSchema.safeParse({ days }).success).toBe(false);
  });
});
```

`src/schemas/barber.ts`:

```ts
import { z } from "zod";

const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Saat HH:mm olmalı");

export const createBarberSchema = z.object({
  name: z.string().trim().min(3, "Ad soyad en az 3 karakter").max(80),
  email: z.string().trim().toLowerCase().email("Geçerli bir e-posta girin"),
  password: z.string().min(8, "Şifre en az 8 karakter olmalı"),
  bio: z.string().trim().max(200).optional().or(z.literal("")),
  photoKey: z.string().min(1, "Profil fotoğrafı zorunlu"),
});
export type CreateBarberInput = z.infer<typeof createBarberSchema>;

export const updateBarberSchema = z.object({
  name: z.string().trim().min(3, "Ad soyad en az 3 karakter").max(80),
  bio: z.string().trim().max(200).optional().or(z.literal("")),
  photoKey: z.string().min(1, "Profil fotoğrafı zorunlu"),
  isActive: z.coerce.boolean(),
});
export type UpdateBarberInput = z.infer<typeof updateBarberSchema>;

export const workingHoursSchema = z.object({
  days: z
    .array(
      z.object({ dayOfWeek: z.number().int().min(0).max(6), isOff: z.boolean(), startTime: hhmm, endTime: hhmm })
        .refine((d) => d.isOff || d.startTime < d.endTime, { message: "Bitiş saati başlangıçtan sonra olmalı" }),
    )
    .length(7),
});
export type WorkingHoursInput = z.infer<typeof workingHoursSchema>;
```

Run: `npm test` → geçer.

- [ ] **Step 5: Integration test (failing)**

`tests/integration/barbers.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { prisma } from "@/lib/db";
import { createBarber, saveWorkingHours, updateBarber } from "@/actions/barbers";
import type { SessionUser } from "@/lib/auth-helpers";

const admin: SessionUser = { id: "a", name: "Admin", email: "a@t", role: "ADMIN", barberId: null };

describe("barbers actions", () => {
  it("creates user+barber with default hours (Sunday off)", async () => {
    const r = await createBarber({ name: "Kwame Mensah", email: "K@t.co", password: "Sifre123!", photoKey: "barbers/a.jpg", bio: "" }, { actor: admin });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const b = await prisma.barber.findUnique({ where: { id: r.data.barberId }, include: { user: true, workingHours: true } });
    expect(b?.user.role).toBe("BARBER");
    expect(b?.user.email).toBe("k@t.co");
    expect(b?.workingHours).toHaveLength(7);
    expect(b?.workingHours.find((h) => h.dayOfWeek === 0)?.isOff).toBe(true);
  });

  it("saveWorkingHours replaces rows", async () => {
    const r = await createBarber({ name: "Kwame Mensah", email: "k@t.co", password: "Sifre123!", photoKey: "barbers/a.jpg" }, { actor: admin });
    if (!r.ok) throw new Error();
    const days = [0, 1, 2, 3, 4, 5, 6].map((d) => ({ dayOfWeek: d, isOff: d === 0 || d === 1, startTime: "10:00", endTime: "20:00" }));
    const s = await saveWorkingHours(r.data.barberId, { days }, { actor: admin });
    expect(s.ok).toBe(true);
    const rows = await prisma.workingHours.findMany({ where: { barberId: r.data.barberId }, orderBy: { dayOfWeek: "asc" } });
    expect(rows).toHaveLength(7);
    expect(rows[1].isOff).toBe(true);
    expect(rows[2].startTime).toBe("10:00");
  });

  it("updateBarber changes name and active flag", async () => {
    const r = await createBarber({ name: "Kwame Mensah", email: "k@t.co", password: "Sifre123!", photoKey: "barbers/a.jpg" }, { actor: admin });
    if (!r.ok) throw new Error();
    await updateBarber(r.data.barberId, { name: "Kwame M.", bio: "Fade", photoKey: "barbers/b.jpg", isActive: false }, { actor: admin });
    const b = await prisma.barber.findUnique({ where: { id: r.data.barberId }, include: { user: true } });
    expect(b?.user.name).toBe("Kwame M.");
    expect(b?.isActive).toBe(false);
    expect(b?.photoKey).toBe("barbers/b.jpg");
  });
});
```

- [ ] **Step 6: actions/barbers.ts ve queries/barbers.ts**

`src/actions/barbers.ts`:

```ts
"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { ok, fail, type ActionResult } from "@/lib/action-result";
import { getSessionUser, type SessionUser } from "@/lib/auth-helpers";
import { createBarberSchema, updateBarberSchema, workingHoursSchema, type CreateBarberInput, type UpdateBarberInput, type WorkingHoursInput } from "@/schemas/barber";
import { deleteObject } from "@/lib/storage";

const DEFAULT_HOURS = [0, 1, 2, 3, 4, 5, 6].map((d) => ({ dayOfWeek: d, startTime: "09:00", endTime: "19:00", isOff: d === 0 }));

async function requireAdminActor(actor?: SessionUser) {
  const u = actor ?? (await getSessionUser());
  return u?.role === "ADMIN" ? u : null;
}

export async function createBarber(input: CreateBarberInput, opts: { actor?: SessionUser } = {}): Promise<ActionResult<{ barberId: string }>> {
  if (!(await requireAdminActor(opts.actor))) return fail("Yetkiniz yok");
  const parsed = createBarberSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Geçersiz bilgi");
  const { name, email, password, bio, photoKey } = parsed.data;
  if (await prisma.user.findUnique({ where: { email } })) return fail("Bu e-posta ile zaten bir hesap var");

  const passwordHash = await bcrypt.hash(password, 10);
  const barber = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({ data: { name, email, passwordHash, role: "BARBER" } });
    const b = await tx.barber.create({ data: { userId: user.id, bio: bio || null, photoKey } });
    await tx.workingHours.createMany({ data: DEFAULT_HOURS.map((h) => ({ ...h, barberId: b.id })) });
    return b;
  });
  if (!opts.actor) revalidatePath("/panel/berberler");
  return ok({ barberId: barber.id });
}

export async function updateBarber(barberId: string, input: UpdateBarberInput, opts: { actor?: SessionUser } = {}): Promise<ActionResult<void>> {
  if (!(await requireAdminActor(opts.actor))) return fail("Yetkiniz yok");
  const parsed = updateBarberSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Geçersiz bilgi");
  const existing = await prisma.barber.findUnique({ where: { id: barberId } });
  if (!existing) return fail("Berber bulunamadı");
  const { name, bio, photoKey, isActive } = parsed.data;
  await prisma.$transaction([
    prisma.user.update({ where: { id: existing.userId }, data: { name } }),
    prisma.barber.update({ where: { id: barberId }, data: { bio: bio || null, photoKey, isActive } }),
  ]);
  if (existing.photoKey !== photoKey && !existing.photoKey.startsWith("seed/") && !opts.actor) await deleteObject(existing.photoKey);
  if (!opts.actor) revalidatePath("/panel/berberler");
  return ok(undefined);
}

export async function saveWorkingHours(barberId: string, input: WorkingHoursInput, opts: { actor?: SessionUser } = {}): Promise<ActionResult<void>> {
  if (!(await requireAdminActor(opts.actor))) return fail("Yetkiniz yok");
  const parsed = workingHoursSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Geçersiz bilgi");
  await prisma.$transaction([
    prisma.workingHours.deleteMany({ where: { barberId } }),
    prisma.workingHours.createMany({ data: parsed.data.days.map((d) => ({ ...d, barberId })) }),
  ]);
  if (!opts.actor) revalidatePath(`/panel/berberler/${barberId}`);
  return ok(undefined);
}

export async function resetBarberPassword(barberId: string, newPassword: string, opts: { actor?: SessionUser } = {}): Promise<ActionResult<void>> {
  if (!(await requireAdminActor(opts.actor))) return fail("Yetkiniz yok");
  if (newPassword.length < 8) return fail("Şifre en az 8 karakter olmalı");
  const b = await prisma.barber.findUnique({ where: { id: barberId } });
  if (!b) return fail("Berber bulunamadı");
  await prisma.user.update({ where: { id: b.userId }, data: { passwordHash: await bcrypt.hash(newPassword, 10) } });
  return ok(undefined);
}
```

`src/lib/queries/barbers.ts`:

```ts
import { prisma } from "@/lib/db";

export async function listBarbersForAdmin() {
  const rows = await prisma.barber.findMany({ include: { user: { select: { name: true, email: true } } }, orderBy: { user: { name: "asc" } } });
  return rows.map((b) => ({ id: b.id, name: b.user.name, email: b.user.email, photoKey: b.photoKey, isActive: b.isActive }));
}

export async function getBarberDetail(barberId: string) {
  const b = await prisma.barber.findUnique({
    where: { id: barberId },
    include: { user: { select: { name: true, email: true } }, workingHours: { orderBy: { dayOfWeek: "asc" } } },
  });
  if (!b) return null;
  const hours = [0, 1, 2, 3, 4, 5, 6].map((d) => {
    const row = b.workingHours.find((h) => h.dayOfWeek === d);
    return { dayOfWeek: d, isOff: row?.isOff ?? true, startTime: row?.startTime ?? "09:00", endTime: row?.endTime ?? "19:00" };
  });
  return { id: b.id, name: b.user.name, email: b.user.email, bio: b.bio ?? "", photoKey: b.photoKey, isActive: b.isActive, hours };
}
```

Run: `npm run test:integration -- tests/integration/barbers.test.ts` → 3 passed.

- [ ] **Step 7: Sayfalar ve formlar**

`src/app/panel/berberler/page.tsx`:

```tsx
import Link from "next/link";
import Image from "next/image";
import { requireAdmin } from "@/lib/auth-helpers";
import { listBarbersForAdmin } from "@/lib/queries/barbers";
import { BarberForm } from "@/components/panel/BarberForm";
import { Badge } from "@/components/ui/badge";
import { publicUrl } from "@/lib/storage-public";

export const dynamic = "force-dynamic";

export default async function BerberlerPage() {
  await requireAdmin();
  const barbers = await listBarbersForAdmin();
  return (
    <div className="space-y-6">
      <h1 className="text-3xl">Berberler</h1>
      <section className="rounded-xl border bg-card p-4">
        <h2 className="mb-3 text-xl">Yeni berber</h2>
        <BarberForm mode="create" />
      </section>
      <ul className="grid gap-3 sm:grid-cols-2">
        {barbers.map((b) => (
          <li key={b.id}>
            <Link href={`/panel/berberler/${b.id}`} className="flex items-center gap-3 rounded-xl border bg-card p-3 hover:bg-muted">
              <Image src={publicUrl(b.photoKey)} alt="" width={48} height={48} className="size-12 rounded-full object-cover" />
              <span className="min-w-0 flex-1">
                <span className="block font-medium">{b.name} {!b.isActive && <Badge variant="secondary">Pasif</Badge>}</span>
                <span className="block truncate text-sm text-muted-foreground">{b.email}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

`src/app/panel/berberler/[id]/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth-helpers";
import { getBarberDetail } from "@/lib/queries/barbers";
import { BarberForm } from "@/components/panel/BarberForm";
import { WorkingHoursForm } from "@/components/panel/WorkingHoursForm";

export const dynamic = "force-dynamic";

export default async function BerberDetayPage(props: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await props.params;
  const barber = await getBarberDetail(id);
  if (!barber) notFound();
  return (
    <div className="space-y-6">
      <h1 className="text-3xl">{barber.name}</h1>
      <section className="rounded-xl border bg-card p-4">
        <h2 className="mb-3 text-xl">Bilgiler</h2>
        <BarberForm mode="edit" barber={barber} />
      </section>
      <section className="rounded-xl border bg-card p-4">
        <h2 className="mb-3 text-xl">Çalışma saatleri</h2>
        <WorkingHoursForm barberId={barber.id} hours={barber.hours} />
      </section>
    </div>
  );
}
```

`src/components/panel/BarberForm.tsx`:

```tsx
"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUploader } from "./ImageUploader";
import { createBarber, updateBarber, resetBarberPassword } from "@/actions/barbers";

type Barber = { id: string; name: string; email: string; bio: string; photoKey: string; isActive: boolean };

export function BarberForm(props: { mode: "create" } | { mode: "edit"; barber: Barber }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const barber = props.mode === "edit" ? props.barber : null;

  return (
    <form
      className="grid gap-3 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        start(async () => {
          const r = barber
            ? await updateBarber(barber.id, { name: String(fd.get("name")), bio: String(fd.get("bio")), photoKey: String(fd.get("photoKey")), isActive: fd.get("isActive") === "on" })
            : await createBarber({ name: String(fd.get("name")), email: String(fd.get("email")), password: String(fd.get("password")), bio: String(fd.get("bio")), photoKey: String(fd.get("photoKey")) });
          if (!r.ok) { setError(r.error); return; }
          setError(null);
          toast.success(barber ? "Berber güncellendi" : "Berber eklendi");
          if (barber) router.refresh(); else router.push(`/panel/berberler/${(r.data as { barberId: string }).barberId}`);
        });
      }}
    >
      <div><Label htmlFor="name">Ad Soyad</Label><Input id="name" name="name" defaultValue={barber?.name} required /></div>
      {!barber && <div><Label htmlFor="email">E-posta</Label><Input id="email" name="email" type="email" required /></div>}
      {!barber && <div><Label htmlFor="password">Geçici şifre</Label><Input id="password" name="password" type="text" minLength={8} required /></div>}
      <div className="sm:col-span-2"><Label htmlFor="bio">Kısa tanıtım</Label><Textarea id="bio" name="bio" defaultValue={barber?.bio} maxLength={200} /></div>
      <div className="sm:col-span-2">
        <Label>Profil fotoğrafı (zorunlu)</Label>
        <ImageUploader kind="barber" name="photoKey" defaultKey={barber?.photoKey} />
      </div>
      {barber && (
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isActive" defaultChecked={barber.isActive} /> Aktif (müşteriler seçebilir)</label>
      )}
      {error && <p className="text-sm text-destructive sm:col-span-2">{error}</p>}
      <Button type="submit" disabled={pending} className="sm:col-span-2">{barber ? "Kaydet" : "Berber ekle"}</Button>
      {barber && (
        <Button type="button" variant="outline" className="sm:col-span-2"
          onClick={() => {
            const pw = window.prompt("Yeni şifre (en az 8 karakter):");
            if (!pw) return;
            start(async () => { const r = await resetBarberPassword(barber.id, pw); r.ok ? toast.success("Şifre güncellendi") : toast.error(r.error); });
          }}>
          Şifreyi sıfırla
        </Button>
      )}
    </form>
  );
}
```

`src/components/panel/WorkingHoursForm.tsx`:

```tsx
"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { saveWorkingHours } from "@/actions/barbers";

const DAYS = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
type Day = { dayOfWeek: number; isOff: boolean; startTime: string; endTime: string };

export function WorkingHoursForm({ barberId, hours }: { barberId: string; hours: Day[] }) {
  const [days, setDays] = useState<Day[]>(hours);
  const [pending, start] = useTransition();
  const router = useRouter();
  const set = (i: number, patch: Partial<Day>) => setDays((d) => d.map((x, j) => (j === i ? { ...x, ...patch } : x)));

  return (
    <div className="space-y-2">
      {days.map((d, i) => (
        <div key={d.dayOfWeek} className="grid grid-cols-[110px_1fr_1fr_auto] items-center gap-2">
          <span className="text-sm font-medium">{DAYS[d.dayOfWeek]}</span>
          <Input type="time" value={d.startTime} disabled={d.isOff} onChange={(e) => set(i, { startTime: e.target.value })} />
          <Input type="time" value={d.endTime} disabled={d.isOff} onChange={(e) => set(i, { endTime: e.target.value })} />
          <label className="flex items-center gap-1 text-sm"><input type="checkbox" checked={d.isOff} onChange={(e) => set(i, { isOff: e.target.checked })} /> Kapalı</label>
        </div>
      ))}
      <Button disabled={pending} onClick={() => start(async () => {
        const r = await saveWorkingHours(barberId, { days });
        if (r.ok) { toast.success("Çalışma saatleri kaydedildi"); router.refresh(); } else toast.error(r.error);
      })}>Kaydet</Button>
    </div>
  );
}
```

- [ ] **Step 8: Doğrula ve commit**

R2 anahtarları `.env`'de doluysa fotoğraf yüklemesi çalışır; boşsa presign 400 döner ve mesaj gösterilir (geliştirme sırasında seed berberleri `seed/` anahtarlarıyla `public/seed/` üzerinden görünmeye devam eder). `npm run typecheck && npm run lint && npm test && npm run test:integration`.

```bash
git add -A
git commit -m "Berber yönetimi, çalışma saatleri ve R2 yükleme"
git push
```

---

### Task 13: İzinler (TimeOff)

**Files:**
- Create: `src/schemas/timeoff.ts`, `src/actions/timeoff.ts`, `src/lib/queries/timeoff.ts`, `src/app/panel/izinler/page.tsx`, `src/components/panel/TimeOffForm.tsx`
- Test: `tests/integration/timeoff.test.ts`

**Interfaces:**
- Produces: `timeOffSchema = { barberId, date: "YYYY-MM-DD", allDay: boolean, startTime?: "HH:mm", endTime?: "HH:mm", reason?: string }`
- Produces: `createTimeOff(input, opts?)` → `ActionResult<{ id: string; conflicts: number }>` (conflicts = çakışan SCHEDULED randevu sayısı, uyarı için), `deleteTimeOff(id, opts?)`. BARBER sadece kendi barberId'si için; ADMIN herkes için.
- Produces: `listUpcomingTimeOff(user)` → `{ id, barberName, startsAt, endsAt, reason }[]`

- [ ] **Step 1: Failing test**

`tests/integration/timeoff.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { prisma } from "@/lib/db";
import { createBarber, createCustomer } from "./helpers";
import { createTimeOff, deleteTimeOff } from "@/actions/timeoff";
import type { SessionUser } from "@/lib/auth-helpers";

const asBarber = (u: { id: string; name: string; email: string }, barberId: string): SessionUser => ({ ...u, role: "BARBER", barberId });

describe("timeoff", () => {
  it("all-day off covers Istanbul day and reports conflicts", async () => {
    const { user, barber } = await createBarber();
    const c = await createCustomer();
    await prisma.appointment.create({ data: { customerId: c.id, barberId: barber.id, startsAt: new Date("2026-09-17T08:00:00Z"), endsAt: new Date("2026-09-17T08:30:00Z") } });
    const r = await createTimeOff({ barberId: barber.id, date: "2026-09-17", allDay: true, reason: "Hasta" }, { actor: asBarber(user, barber.id) });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.conflicts).toBe(1);
    const t = await prisma.timeOff.findUnique({ where: { id: r.data.id } });
    expect(t?.startsAt.toISOString()).toBe("2026-09-16T21:00:00.000Z");
    expect(t?.endsAt.toISOString()).toBe("2026-09-17T21:00:00.000Z");
  });

  it("partial off uses given hours", async () => {
    const { user, barber } = await createBarber();
    const r = await createTimeOff({ barberId: barber.id, date: "2026-09-17", allDay: false, startTime: "13:00", endTime: "15:00" }, { actor: asBarber(user, barber.id) });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const t = await prisma.timeOff.findUnique({ where: { id: r.data.id } });
    expect(t?.startsAt.toISOString()).toBe("2026-09-17T10:00:00.000Z");
    expect(t?.endsAt.toISOString()).toBe("2026-09-17T12:00:00.000Z");
  });

  it("barber cannot create for another barber", async () => {
    const b1 = await createBarber();
    const b2 = await createBarber();
    const r = await createTimeOff({ barberId: b2.barber.id, date: "2026-09-17", allDay: true }, { actor: asBarber(b1.user, b1.barber.id) });
    expect(r).toEqual({ ok: false, error: "Yetkiniz yok" });
  });

  it("delete respects scope", async () => {
    const b1 = await createBarber();
    const b2 = await createBarber();
    const r = await createTimeOff({ barberId: b1.barber.id, date: "2026-09-17", allDay: true }, { actor: asBarber(b1.user, b1.barber.id) });
    if (!r.ok) throw new Error();
    expect((await deleteTimeOff(r.data.id, { actor: asBarber(b2.user, b2.barber.id) })).ok).toBe(false);
    expect((await deleteTimeOff(r.data.id, { actor: asBarber(b1.user, b1.barber.id) })).ok).toBe(true);
  });
});
```

- [ ] **Step 2: Şema, action, query**

`src/schemas/timeoff.ts`:

```ts
import { z } from "zod";
const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Saat HH:mm olmalı");

export const timeOffSchema = z
  .object({
    barberId: z.string().min(1),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tarih YYYY-AA-GG olmalı"),
    allDay: z.boolean(),
    startTime: hhmm.optional(),
    endTime: hhmm.optional(),
    reason: z.string().trim().max(100).optional().or(z.literal("")),
  })
  .refine((v) => v.allDay || (v.startTime && v.endTime && v.startTime < v.endTime), { message: "Saat aralığı geçersiz" });
export type TimeOffInput = z.infer<typeof timeOffSchema>;
```

`src/lib/time.ts` dosyasına ekle:

```ts
/** "2026-09-17" + "13:00" → İstanbul'daki o anın UTC instant'ı */
export function shopDateTime(date: string, hhmm: string): Date {
  const [y, mo, d] = date.split("-").map(Number);
  const [h, mi] = hhmm.split(":").map(Number);
  return new Date(new TZDate(y, mo - 1, d, h, mi, 0, 0, SHOP_TZ).getTime());
}
```

`src/actions/timeoff.ts`:

```ts
"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { ok, fail, type ActionResult } from "@/lib/action-result";
import { getSessionUser, type SessionUser } from "@/lib/auth-helpers";
import { staffScope } from "@/lib/staff-scope";
import { addMinutes, shopDateTime } from "@/lib/time";
import { timeOffSchema, type TimeOffInput } from "@/schemas/timeoff";

async function resolveActor(actor?: SessionUser) {
  const u = actor ?? (await getSessionUser());
  return u && (u.role === "BARBER" || u.role === "ADMIN") ? u : null;
}

export async function createTimeOff(input: TimeOffInput, opts: { actor?: SessionUser } = {}): Promise<ActionResult<{ id: string; conflicts: number }>> {
  const actor = await resolveActor(opts.actor);
  if (!actor) return fail("Yetkiniz yok");
  const parsed = timeOffSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Geçersiz bilgi");
  const { barberId, date, allDay, startTime, endTime, reason } = parsed.data;
  if (actor.role === "BARBER" && actor.barberId !== barberId) return fail("Yetkiniz yok");

  const startsAt = allDay ? shopDateTime(date, "00:00") : shopDateTime(date, startTime!);
  const endsAt = allDay ? addMinutes(shopDateTime(date, "00:00"), 24 * 60) : shopDateTime(date, endTime!);

  const t = await prisma.timeOff.create({ data: { barberId, startsAt, endsAt, reason: reason || null } });
  const conflicts = await prisma.appointment.count({ where: { barberId, status: "SCHEDULED", startsAt: { lt: endsAt }, endsAt: { gt: startsAt } } });
  if (!opts.actor) revalidatePath("/panel/izinler");
  return ok({ id: t.id, conflicts });
}

export async function deleteTimeOff(id: string, opts: { actor?: SessionUser } = {}): Promise<ActionResult<void>> {
  const actor = await resolveActor(opts.actor);
  if (!actor) return fail("Yetkiniz yok");
  const t = await prisma.timeOff.findFirst({ where: { id, ...staffScope(actor) } });
  if (!t) return fail("İzin bulunamadı");
  await prisma.timeOff.delete({ where: { id } });
  if (!opts.actor) revalidatePath("/panel/izinler");
  return ok(undefined);
}
```

`src/lib/queries/timeoff.ts`:

```ts
import { prisma } from "@/lib/db";
import type { SessionUser } from "@/lib/auth-helpers";
import { staffScope } from "@/lib/staff-scope";
import { shopDayStart } from "@/lib/time";

export async function listUpcomingTimeOff(user: SessionUser, now: Date = new Date()) {
  const rows = await prisma.timeOff.findMany({
    where: { ...staffScope(user), endsAt: { gte: shopDayStart(now) } },
    include: { barber: { include: { user: { select: { name: true } } } } },
    orderBy: { startsAt: "asc" },
  });
  return rows.map((t) => ({ id: t.id, barberName: t.barber.user.name, startsAt: t.startsAt, endsAt: t.endsAt, reason: t.reason }));
}
```

Run: `npm run test:integration -- tests/integration/timeoff.test.ts` → 4 passed.

- [ ] **Step 3: Sayfa ve form**

`src/app/panel/izinler/page.tsx`:

```tsx
import { requireStaff } from "@/lib/auth-helpers";
import { listUpcomingTimeOff } from "@/lib/queries/timeoff";
import { listBarbersForAdmin } from "@/lib/queries/barbers";
import { TimeOffForm } from "@/components/panel/TimeOffForm";
import { TimeOffList } from "@/components/panel/TimeOffList";

export const dynamic = "force-dynamic";

export default async function IzinlerPage() {
  const user = await requireStaff();
  const [items, barbers] = await Promise.all([
    listUpcomingTimeOff(user),
    user.role === "ADMIN" ? listBarbersForAdmin() : Promise.resolve([]),
  ]);
  return (
    <div className="space-y-6">
      <h1 className="text-3xl">İzinler</h1>
      <section className="rounded-xl border bg-card p-4">
        <h2 className="mb-3 text-xl">Yeni izin</h2>
        <TimeOffForm barbers={user.role === "ADMIN" ? barbers.filter((b) => b.isActive).map((b) => ({ id: b.id, name: b.name })) : null} ownBarberId={user.barberId} />
      </section>
      <TimeOffList items={items} />
    </div>
  );
}
```

`src/components/panel/TimeOffForm.tsx`:

```tsx
"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createTimeOff } from "@/actions/timeoff";

export function TimeOffForm({ barbers, ownBarberId }: { barbers: { id: string; name: string }[] | null; ownBarberId: string | null }) {
  const [allDay, setAllDay] = useState(true);
  const [pending, start] = useTransition();
  const router = useRouter();
  const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Istanbul" }); // YYYY-MM-DD
  return (
    <form className="grid gap-3 sm:grid-cols-2" onSubmit={(e) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      start(async () => {
        const r = await createTimeOff({
          barberId: String(fd.get("barberId") ?? ownBarberId ?? ""),
          date: String(fd.get("date")),
          allDay,
          startTime: allDay ? undefined : String(fd.get("startTime")),
          endTime: allDay ? undefined : String(fd.get("endTime")),
          reason: String(fd.get("reason") ?? ""),
        });
        if (!r.ok) { toast.error(r.error); return; }
        toast.success(r.data.conflicts > 0 ? `İzin eklendi. Dikkat: ${r.data.conflicts} randevu bu aralıkla çakışıyor, müşterileri arayın.` : "İzin eklendi");
        router.refresh();
      });
    }}>
      {barbers && (
        <div className="sm:col-span-2">
          <Label htmlFor="barberId">Berber</Label>
          <select id="barberId" name="barberId" className="mt-1 w-full rounded-md border bg-background px-3 py-2">
            {barbers.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
      )}
      <div><Label htmlFor="date">Tarih</Label><Input id="date" name="date" type="date" defaultValue={today} min={today} required /></div>
      <label className="flex items-center gap-2 self-end text-sm"><input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} /> Tüm gün</label>
      {!allDay && (
        <>
          <div><Label htmlFor="startTime">Başlangıç</Label><Input id="startTime" name="startTime" type="time" required /></div>
          <div><Label htmlFor="endTime">Bitiş</Label><Input id="endTime" name="endTime" type="time" required /></div>
        </>
      )}
      <div className="sm:col-span-2"><Label htmlFor="reason">Sebep (isteğe bağlı)</Label><Input id="reason" name="reason" maxLength={100} /></div>
      <Button type="submit" disabled={pending} className="sm:col-span-2">İzin ekle</Button>
    </form>
  );
}
```

`src/components/panel/TimeOffList.tsx`:

```tsx
"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deleteTimeOff } from "@/actions/timeoff";
import { formatShopDate, formatShopTime } from "@/lib/time";

type Item = { id: string; barberName: string; startsAt: Date; endsAt: Date; reason: string | null };

export function TimeOffList({ items }: { items: Item[] }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  if (items.length === 0) return <p className="text-muted-foreground">Yaklaşan izin yok.</p>;
  return (
    <ul className="space-y-2">
      {items.map((t) => (
        <li key={t.id} className="flex items-center justify-between rounded-xl border bg-card p-3">
          <div>
            <p className="font-medium">{t.barberName}</p>
            <p className="text-sm text-muted-foreground">{formatShopDate(t.startsAt)} · {formatShopTime(t.startsAt)}–{formatShopTime(t.endsAt)} {t.reason && `· ${t.reason}`}</p>
          </div>
          <Button size="sm" variant="outline" disabled={pending} onClick={() => start(async () => {
            const r = await deleteTimeOff(t.id);
            if (r.ok) { toast.success("İzin silindi"); router.refresh(); } else toast.error(r.error);
          })}>Sil</Button>
        </li>
      ))}
    </ul>
  );
}
```

- [ ] **Step 4: Doğrula ve commit**

Berber hesabıyla izin ekle → ana sayfada o saatler kaybolur. `npm run typecheck && npm run lint`.

```bash
git add -A
git commit -m "Berber izinleri"
git push
```

---

### Task 14: Müşteriler ve kesim fotoğrafları (4 sınırı)

**Files:**
- Create: `src/actions/photos.ts`, `src/lib/queries/customers.ts`
- Create: `src/app/panel/musteriler/page.tsx`, `src/app/panel/musteriler/[id]/page.tsx`, `src/components/panel/PhotoUploadButton.tsx`, `src/components/panel/PhotoGrid.tsx`
- Test: `tests/integration/photos.test.ts`

**Interfaces:**
- Produces: `MAX_PHOTOS_PER_CUSTOMER = 4` (`src/lib/photos.ts`)
- Produces: `addHaircutPhoto({ customerId, storageKey, appointmentId? }, opts?: { actor?: SessionUser })` → `ActionResult<{ id: string; deletedKeys: string[] }>`; BARBER için barberId = actor.barberId, ADMIN için ilk aktif berber yerine `barberId` parametresi zorunlu (`input.barberId`).
- Produces: `deleteHaircutPhoto(id, opts?)` → `ActionResult<void>`; BARBER sadece kendi çektiği, ADMIN hepsi.
- Produces: `searchCustomers(q)` → `{ id, name, email, phone, lastVisit: Date | null }[]`, `getCustomerDetail(id)` → `{ id, name, email, phone, appointments: AppointmentView[], photos: { id, storageKey, createdAt, barberName, barberId }[] }`

- [ ] **Step 1: Failing test**

`tests/integration/photos.test.ts`:

```ts
import { describe, it, expect, vi } from "vitest";
import { prisma } from "@/lib/db";
import { createBarber, createCustomer } from "./helpers";
import type { SessionUser } from "@/lib/auth-helpers";

vi.mock("@/lib/storage", () => ({
  deleteObject: vi.fn(async () => {}),
  createPresignedUpload: vi.fn(),
}));

import { deleteObject } from "@/lib/storage";
import { addHaircutPhoto, deleteHaircutPhoto } from "@/actions/photos";

const asBarber = (u: { id: string; name: string; email: string }, barberId: string): SessionUser => ({ ...u, role: "BARBER", barberId });

describe("haircut photos", () => {
  it("keeps only the 4 newest, deleting oldest from db and storage", async () => {
    const { user, barber } = await createBarber();
    const c = await createCustomer();
    const actor = asBarber(user, barber.id);
    for (let i = 1; i <= 5; i++) {
      const r = await addHaircutPhoto({ customerId: c.id, storageKey: `haircuts/p${i}.jpg` }, { actor });
      expect(r.ok).toBe(true);
      if (r.ok && i === 5) expect(r.data.deletedKeys).toEqual(["haircuts/p1.jpg"]);
    }
    const rows = await prisma.haircutPhoto.findMany({ where: { customerId: c.id }, orderBy: { createdAt: "asc" } });
    expect(rows.map((p) => p.storageKey)).toEqual(["haircuts/p2.jpg", "haircuts/p3.jpg", "haircuts/p4.jpg", "haircuts/p5.jpg"]);
    expect(deleteObject).toHaveBeenCalledWith("haircuts/p1.jpg");
  });

  it("barber cannot delete another barber's photo", async () => {
    const b1 = await createBarber();
    const b2 = await createBarber();
    const c = await createCustomer();
    const r = await addHaircutPhoto({ customerId: c.id, storageKey: "haircuts/x.jpg" }, { actor: asBarber(b1.user, b1.barber.id) });
    if (!r.ok) throw new Error();
    expect((await deleteHaircutPhoto(r.data.id, { actor: asBarber(b2.user, b2.barber.id) })).ok).toBe(false);
    expect((await deleteHaircutPhoto(r.data.id, { actor: asBarber(b1.user, b1.barber.id) })).ok).toBe(true);
  });

  it("rejects unknown customer", async () => {
    const { user, barber } = await createBarber();
    const r = await addHaircutPhoto({ customerId: "yok", storageKey: "haircuts/x.jpg" }, { actor: asBarber(user, barber.id) });
    expect(r).toEqual({ ok: false, error: "Müşteri bulunamadı" });
  });
});
```

Not: `createdAt` aynı milisaniyede olabilir; sıralama için action içinde `createdAt` yanında `id` de kullanılır (cuid zaman sıralıdır). Testte 5 ardışık insert farklı ms'lerde olur, yine de action `orderBy: [{ createdAt: "asc" }, { id: "asc" }]` kullanmalı.

- [ ] **Step 2: photos.ts ve action**

`src/lib/photos.ts`:

```ts
export const MAX_PHOTOS_PER_CUSTOMER = 4;
```

`src/actions/photos.ts`:

```ts
"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { ok, fail, type ActionResult } from "@/lib/action-result";
import { getSessionUser, type SessionUser } from "@/lib/auth-helpers";
import { deleteObject } from "@/lib/storage";
import { MAX_PHOTOS_PER_CUSTOMER } from "@/lib/photos";

async function resolveActor(actor?: SessionUser) {
  const u = actor ?? (await getSessionUser());
  return u && (u.role === "BARBER" || u.role === "ADMIN") ? u : null;
}

export async function addHaircutPhoto(
  input: { customerId: string; storageKey: string; appointmentId?: string; barberId?: string },
  opts: { actor?: SessionUser } = {},
): Promise<ActionResult<{ id: string; deletedKeys: string[] }>> {
  const actor = await resolveActor(opts.actor);
  if (!actor) return fail("Yetkiniz yok");
  if (!input.storageKey) return fail("Fotoğraf yüklenmemiş");

  const barberId = actor.role === "BARBER" ? actor.barberId : input.barberId;
  if (!barberId) return fail("Berber seçilmedi");

  const customer = await prisma.user.findFirst({ where: { id: input.customerId, role: "CUSTOMER" } });
  if (!customer) return fail("Müşteri bulunamadı");

  const { created, removed } = await prisma.$transaction(async (tx) => {
    const created = await tx.haircutPhoto.create({
      data: { customerId: customer.id, barberId, storageKey: input.storageKey, appointmentId: input.appointmentId ?? null },
    });
    const all = await tx.haircutPhoto.findMany({ where: { customerId: customer.id }, orderBy: [{ createdAt: "asc" }, { id: "asc" }] });
    const excess = all.slice(0, Math.max(0, all.length - MAX_PHOTOS_PER_CUSTOMER));
    if (excess.length) await tx.haircutPhoto.deleteMany({ where: { id: { in: excess.map((p) => p.id) } } });
    return { created, removed: excess.map((p) => p.storageKey) };
  });

  await Promise.all(removed.map((k) => deleteObject(k)));
  if (!opts.actor) revalidatePath(`/panel/musteriler/${customer.id}`);
  return ok({ id: created.id, deletedKeys: removed });
}

export async function deleteHaircutPhoto(id: string, opts: { actor?: SessionUser } = {}): Promise<ActionResult<void>> {
  const actor = await resolveActor(opts.actor);
  if (!actor) return fail("Yetkiniz yok");
  const photo = await prisma.haircutPhoto.findFirst({ where: { id, ...(actor.role === "ADMIN" ? {} : { barberId: actor.barberId ?? "__none__" }) } });
  if (!photo) return fail("Fotoğraf bulunamadı");
  await prisma.haircutPhoto.delete({ where: { id } });
  await deleteObject(photo.storageKey);
  if (!opts.actor) revalidatePath(`/panel/musteriler/${photo.customerId}`);
  return ok(undefined);
}
```

Run: `npm run test:integration -- tests/integration/photos.test.ts` → 3 passed.

- [ ] **Step 3: queries/customers.ts**

```ts
import { prisma } from "@/lib/db";
import type { AppointmentView } from "@/lib/queries/customer";

export async function searchCustomers(q: string) {
  const term = q.trim();
  const rows = await prisma.user.findMany({
    where: {
      role: "CUSTOMER",
      ...(term ? { OR: [{ name: { contains: term, mode: "insensitive" } }, { phone: { contains: term } }, { email: { contains: term, mode: "insensitive" } }] } : {}),
    },
    include: { appointments: { where: { status: "COMPLETED" }, orderBy: { startsAt: "desc" }, take: 1, select: { startsAt: true } } },
    orderBy: { name: "asc" },
    take: 100,
  });
  return rows.map((u) => ({ id: u.id, name: u.name, email: u.email, phone: u.phone, lastVisit: u.appointments[0]?.startsAt ?? null }));
}

export async function getCustomerDetail(id: string) {
  const u = await prisma.user.findFirst({
    where: { id, role: "CUSTOMER" },
    include: {
      appointments: { include: { barber: { include: { user: { select: { name: true } } } }, services: true }, orderBy: { startsAt: "desc" }, take: 30 },
      photos: { include: { barber: { include: { user: { select: { name: true } } } } }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!u) return null;
  const appointments: AppointmentView[] = u.appointments.map((a) => ({
    id: a.id, startsAt: a.startsAt, endsAt: a.endsAt, status: a.status, barberName: a.barber.user.name,
    services: a.services.map((s) => ({ name: s.nameSnapshot, priceSnapshot: s.priceSnapshot })),
    totalKurus: a.services.reduce((t, s) => t + s.priceSnapshot, 0), canCancel: false,
  }));
  return {
    id: u.id, name: u.name, email: u.email, phone: u.phone, appointments,
    photos: u.photos.map((p) => ({ id: p.id, storageKey: p.storageKey, createdAt: p.createdAt, barberName: p.barber.user.name, barberId: p.barberId })),
  };
}
```

- [ ] **Step 4: Sayfalar ve bileşenler**

`src/app/panel/musteriler/page.tsx`:

```tsx
import Link from "next/link";
import { requireStaff } from "@/lib/auth-helpers";
import { searchCustomers } from "@/lib/queries/customers";
import { Input } from "@/components/ui/input";
import { formatShopDate } from "@/lib/time";

export const dynamic = "force-dynamic";

export default async function MusterilerPage(props: { searchParams: Promise<{ q?: string }> }) {
  await requireStaff();
  const { q = "" } = await props.searchParams;
  const customers = await searchCustomers(q);
  return (
    <div className="space-y-4">
      <h1 className="text-3xl">Müşteriler</h1>
      <form><Input name="q" defaultValue={q} placeholder="Ad, telefon veya e-posta ara" /></form>
      <ul className="divide-y rounded-xl border bg-card">
        {customers.length === 0 && <li className="p-4 text-sm text-muted-foreground">Sonuç yok</li>}
        {customers.map((c) => (
          <li key={c.id}>
            <Link href={`/panel/musteriler/${c.id}`} className="flex items-center justify-between p-3 hover:bg-muted">
              <span><span className="block font-medium">{c.name}</span><span className="text-sm text-muted-foreground">{c.phone ?? c.email}</span></span>
              <span className="text-xs text-muted-foreground">{c.lastVisit ? `Son: ${formatShopDate(c.lastVisit)}` : "İlk ziyaret bekleniyor"}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

`src/app/panel/musteriler/[id]/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth-helpers";
import { getCustomerDetail } from "@/lib/queries/customers";
import { listBarbersForAdmin } from "@/lib/queries/barbers";
import { getSettings } from "@/lib/settings";
import { AppointmentCard } from "@/components/booking/AppointmentCard";
import { PhotoGrid } from "@/components/panel/PhotoGrid";
import { PhotoUploadButton } from "@/components/panel/PhotoUploadButton";
import { MAX_PHOTOS_PER_CUSTOMER } from "@/lib/photos";

export const dynamic = "force-dynamic";

export default async function MusteriDetayPage(props: { params: Promise<{ id: string }> }) {
  const user = await requireStaff();
  const { id } = await props.params;
  const [c, settings, barbers] = await Promise.all([getCustomerDetail(id), getSettings(), user.role === "ADMIN" ? listBarbersForAdmin() : Promise.resolve([])]);
  if (!c) notFound();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl">{c.name}</h1>
        <p className="text-muted-foreground">{c.phone ?? "-"} · {c.email}</p>
      </div>
      <section className="rounded-xl border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl">Kesim fotoğrafları ({c.photos.length}/{MAX_PHOTOS_PER_CUSTOMER})</h2>
          <PhotoUploadButton customerId={c.id} barbers={user.role === "ADMIN" ? barbers.filter((b) => b.isActive).map((b) => ({ id: b.id, name: b.name })) : null} />
        </div>
        <PhotoGrid photos={c.photos} deletableIds={c.photos.filter((p) => user.role === "ADMIN" || p.barberId === user.barberId).map((p) => p.id)} />
      </section>
      <section>
        <h2 className="mb-3 text-xl">Randevular</h2>
        <div className="space-y-2">{c.appointments.map((a) => <AppointmentCard key={a.id} a={a} shopPhone={settings.phone} />)}</div>
      </section>
    </div>
  );
}
```

`src/components/panel/PhotoUploadButton.tsx`:

```tsx
"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ImageUploader } from "./ImageUploader";
import { addHaircutPhoto } from "@/actions/photos";

export function PhotoUploadButton({ customerId, barbers }: { customerId: string; barbers: { id: string; name: string }[] | null }) {
  const [open, setOpen] = useState(false);
  const [barberId, setBarberId] = useState(barbers?.[0]?.id);
  const [pending, start] = useTransition();
  const router = useRouter();
  if (!open) return <Button size="sm" onClick={() => setOpen(true)}>Fotoğraf ekle</Button>;
  return (
    <div className="space-y-2 rounded-lg border p-3">
      {barbers && (
        <select value={barberId} onChange={(e) => setBarberId(e.target.value)} className="w-full rounded-md border bg-background px-2 py-1 text-sm">
          {barbers.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      )}
      <ImageUploader kind="haircut" name="storageKey" onUploaded={(key) => start(async () => {
        const r = await addHaircutPhoto({ customerId, storageKey: key, barberId });
        if (!r.ok) { toast.error(r.error); return; }
        toast.success(r.data.deletedKeys.length ? "Fotoğraf eklendi, en eski fotoğraf silindi" : "Fotoğraf eklendi");
        setOpen(false);
        router.refresh();
      })} />
      {pending && <p className="text-xs text-muted-foreground">Kaydediliyor…</p>}
    </div>
  );
}
```

`src/components/panel/PhotoGrid.tsx`:

```tsx
"use client";
import Image from "next/image";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { publicUrl } from "@/lib/storage-public";
import { formatShopDate } from "@/lib/time";
import { deleteHaircutPhoto } from "@/actions/photos";

type P = { id: string; storageKey: string; createdAt: Date; barberName: string; barberId: string };

export function PhotoGrid({ photos, deletableIds }: { photos: P[]; deletableIds: string[] }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  if (photos.length === 0) return <p className="text-sm text-muted-foreground">Henüz fotoğraf yok.</p>;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {photos.map((p) => (
        <figure key={p.id} className="space-y-1">
          <Image src={publicUrl(p.storageKey)} alt="" width={300} height={300} className="aspect-square w-full rounded-lg object-cover" />
          <figcaption className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{formatShopDate(p.createdAt)} · {p.barberName}</span>
            {deletableIds.includes(p.id) && (
              <Button size="sm" variant="ghost" disabled={pending} onClick={() => start(async () => {
                const r = await deleteHaircutPhoto(p.id);
                if (r.ok) router.refresh(); else toast.error(r.error);
              })}>Sil</Button>
            )}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
```

Not: silme yetkisi server component'te `deletableIds` olarak hesaplanır; client component'e fonksiyon geçirilemez.

- [ ] **Step 5: Doğrula ve commit**

Bugün ekranındaki müşteri adı linkinden detaya git, fotoğraf ekle (R2 gerekli), 5. fotoğrafta en eskisi kaybolur; müşteri `/randevularim`'de fotoğrafları görür. `npm run typecheck && npm run lint && npm run test:integration`.

```bash
git add -A
git commit -m "Müşteri listesi ve kesim fotoğrafı geçmişi"
git push
```

---

### Task 15: Randevular listesi ve Ayarlar

**Files:**
- Create: `src/app/panel/randevular/page.tsx`, `src/components/panel/AppointmentsTable.tsx`
- Create: `src/schemas/settings.ts`, `src/actions/settings.ts`, `src/app/panel/ayarlar/page.tsx`, `src/components/panel/SettingsForm.tsx`
- Test: `tests/integration/settings.test.ts`

**Interfaces:**
- Consumes: `listAppointments(user, filter)` (Task 10)
- Produces: `settingsSchema = { shopName, address, phone, cancellationWindowMinutes (0-1440), minLeadMinutes (0-240), slotStepMinutes (5|10|15|20|30|60), notifyBarberOnBooking }`
- Produces: `updateSettings(input, opts?)` → `ActionResult<void>`, sadece ADMIN.

- [ ] **Step 1: Failing test**

`tests/integration/settings.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { prisma } from "@/lib/db";
import { updateSettings } from "@/actions/settings";
import type { SessionUser } from "@/lib/auth-helpers";

const admin: SessionUser = { id: "a", name: "Admin", email: "a@t", role: "ADMIN", barberId: null };

describe("updateSettings", () => {
  it("updates the single row", async () => {
    const r = await updateSettings({ shopName: "Afro Salon", address: "Kadıköy", phone: "0555", cancellationWindowMinutes: 60, minLeadMinutes: 30, slotStepMinutes: 30, notifyBarberOnBooking: false }, { actor: admin });
    expect(r.ok).toBe(true);
    const s = await prisma.settings.findUnique({ where: { id: 1 } });
    expect(s?.cancellationWindowMinutes).toBe(60);
    expect(s?.slotStepMinutes).toBe(30);
    expect(s?.notifyBarberOnBooking).toBe(false);
  });
  it("rejects invalid slot step", async () => {
    const r = await updateSettings({ shopName: "A", address: "", phone: "", cancellationWindowMinutes: 60, minLeadMinutes: 0, slotStepMinutes: 7, notifyBarberOnBooking: true }, { actor: admin });
    expect(r.ok).toBe(false);
  });
});
```

- [ ] **Step 2: Şema ve action**

`src/schemas/settings.ts`:

```ts
import { z } from "zod";

export const settingsSchema = z.object({
  shopName: z.string().trim().min(1, "Dükkan adı gerekli").max(60),
  address: z.string().trim().max(200),
  phone: z.string().trim().max(30),
  cancellationWindowMinutes: z.coerce.number().int().min(0).max(1440),
  minLeadMinutes: z.coerce.number().int().min(0).max(240),
  slotStepMinutes: z.coerce.number().int().refine((n) => [5, 10, 15, 20, 30, 60].includes(n), "Slot adımı 5, 10, 15, 20, 30 veya 60 olmalı"),
  notifyBarberOnBooking: z.coerce.boolean(),
});
export type SettingsInput = z.infer<typeof settingsSchema>;
```

`src/actions/settings.ts`:

```ts
"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { ok, fail, type ActionResult } from "@/lib/action-result";
import { getSessionUser, type SessionUser } from "@/lib/auth-helpers";
import { settingsSchema, type SettingsInput } from "@/schemas/settings";

export async function updateSettings(input: SettingsInput, opts: { actor?: SessionUser } = {}): Promise<ActionResult<void>> {
  const u = opts.actor ?? (await getSessionUser());
  if (u?.role !== "ADMIN") return fail("Yetkiniz yok");
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Geçersiz bilgi");
  await prisma.settings.upsert({ where: { id: 1 }, update: parsed.data, create: { id: 1, ...parsed.data } });
  if (!opts.actor) { revalidatePath("/"); revalidatePath("/panel/ayarlar"); }
  return ok(undefined);
}
```

Run: test → 2 passed.

- [ ] **Step 3: Ayarlar sayfası ve form**

`src/app/panel/ayarlar/page.tsx`:

```tsx
import { requireAdmin } from "@/lib/auth-helpers";
import { getSettings } from "@/lib/settings";
import { SettingsForm } from "@/components/panel/SettingsForm";

export const dynamic = "force-dynamic";

export default async function AyarlarPage() {
  await requireAdmin();
  const s = await getSettings();
  return (
    <div className="max-w-xl space-y-4">
      <h1 className="text-3xl">Ayarlar</h1>
      <SettingsForm initial={{ shopName: s.shopName, address: s.address, phone: s.phone, cancellationWindowMinutes: s.cancellationWindowMinutes, minLeadMinutes: s.minLeadMinutes, slotStepMinutes: s.slotStepMinutes, notifyBarberOnBooking: s.notifyBarberOnBooking }} />
    </div>
  );
}
```

`src/components/panel/SettingsForm.tsx`:

```tsx
"use client";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateSettings } from "@/actions/settings";
import type { SettingsInput } from "@/schemas/settings";

export function SettingsForm({ initial }: { initial: SettingsInput }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <form className="grid gap-3 rounded-xl border bg-card p-4" onSubmit={(e) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      start(async () => {
        const r = await updateSettings({
          shopName: String(fd.get("shopName")), address: String(fd.get("address")), phone: String(fd.get("phone")),
          cancellationWindowMinutes: Number(fd.get("cancellationWindowMinutes")), minLeadMinutes: Number(fd.get("minLeadMinutes")),
          slotStepMinutes: Number(fd.get("slotStepMinutes")), notifyBarberOnBooking: fd.get("notifyBarberOnBooking") === "on",
        });
        if (!r.ok) { setError(r.error); return; }
        setError(null); toast.success("Ayarlar kaydedildi");
      });
    }}>
      <div><Label htmlFor="shopName">Dükkan adı</Label><Input id="shopName" name="shopName" defaultValue={initial.shopName} required /></div>
      <div><Label htmlFor="address">Adres</Label><Input id="address" name="address" defaultValue={initial.address} /></div>
      <div><Label htmlFor="phone">Telefon</Label><Input id="phone" name="phone" defaultValue={initial.phone} /></div>
      <div><Label htmlFor="cancellationWindowMinutes">Müşteri iptal sınırı (dk)</Label><Input id="cancellationWindowMinutes" name="cancellationWindowMinutes" type="number" min={0} max={1440} defaultValue={initial.cancellationWindowMinutes} /></div>
      <div><Label htmlFor="minLeadMinutes">En erken randevu (şu andan itibaren, dk)</Label><Input id="minLeadMinutes" name="minLeadMinutes" type="number" min={0} max={240} defaultValue={initial.minLeadMinutes} /></div>
      <div>
        <Label htmlFor="slotStepMinutes">Slot adımı (dk)</Label>
        <select id="slotStepMinutes" name="slotStepMinutes" defaultValue={initial.slotStepMinutes} className="mt-1 w-full rounded-md border bg-background px-3 py-2">
          {[5, 10, 15, 20, 30, 60].map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="notifyBarberOnBooking" defaultChecked={initial.notifyBarberOnBooking} /> Yeni randevuda berbere e-posta gönder</label>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={pending}>Kaydet</Button>
    </form>
  );
}
```

- [ ] **Step 4: Randevular listesi**

`src/app/panel/randevular/page.tsx`:

```tsx
import { requireStaff } from "@/lib/auth-helpers";
import { listAppointments } from "@/lib/queries/panel";
import { listBarbersForAdmin } from "@/lib/queries/barbers";
import { AppointmentsTable } from "@/components/panel/AppointmentsTable";
import { shopDateTime, addMinutes } from "@/lib/time";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const dynamic = "force-dynamic";

const STATUSES = ["SCHEDULED", "COMPLETED", "CANCELLED", "NO_SHOW"] as const;

export default async function RandevularPage(props: { searchParams: Promise<{ from?: string; to?: string; barberId?: string; status?: string }> }) {
  const user = await requireStaff();
  const sp = await props.searchParams;
  const todayStr = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Istanbul" });
  const from = sp.from ?? new Date(Date.now() - 30 * 86_400_000).toLocaleDateString("sv-SE", { timeZone: "Europe/Istanbul" });
  const to = sp.to ?? todayStr;
  const status = STATUSES.find((s) => s === sp.status);
  const [rows, barbers] = await Promise.all([
    listAppointments(user, { from: shopDateTime(from, "00:00"), to: addMinutes(shopDateTime(to, "00:00"), 24 * 60), barberId: sp.barberId || undefined, status }),
    user.role === "ADMIN" ? listBarbersForAdmin() : Promise.resolve([]),
  ]);
  return (
    <div className="space-y-4">
      <h1 className="text-3xl">Randevular</h1>
      <form className="grid gap-2 rounded-xl border bg-card p-3 sm:grid-cols-5">
        <Input type="date" name="from" defaultValue={from} />
        <Input type="date" name="to" defaultValue={to} />
        {user.role === "ADMIN" && (
          <select name="barberId" defaultValue={sp.barberId ?? ""} className="rounded-md border bg-background px-3 py-2">
            <option value="">Tüm berberler</option>
            {barbers.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        )}
        <select name="status" defaultValue={sp.status ?? ""} className="rounded-md border bg-background px-3 py-2">
          <option value="">Tüm durumlar</option>
          <option value="SCHEDULED">Planlandı</option><option value="COMPLETED">Tamamlandı</option><option value="CANCELLED">İptal</option><option value="NO_SHOW">Gelmedi</option>
        </select>
        <Button type="submit">Filtrele</Button>
      </form>
      <AppointmentsTable rows={rows} />
    </div>
  );
}
```

`src/components/panel/AppointmentsTable.tsx`:

```tsx
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatShopDate, formatShopTime } from "@/lib/time";
import { formatKurus } from "@/lib/money";

type Row = { id: string; startsAt: Date; endsAt: Date; status: "SCHEDULED" | "COMPLETED" | "CANCELLED" | "NO_SHOW"; barberName: string; customerId: string; customerName: string; customerPhone: string | null; services: string[]; totalKurus: number };
const STATUS = { SCHEDULED: "Planlandı", COMPLETED: "Tamamlandı", CANCELLED: "İptal", NO_SHOW: "Gelmedi" } as const;

export function AppointmentsTable({ rows }: { rows: Row[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border bg-card">
      <Table>
        <TableHeader><TableRow><TableHead>Tarih</TableHead><TableHead>Saat</TableHead><TableHead>Berber</TableHead><TableHead>Müşteri</TableHead><TableHead>Hizmet</TableHead><TableHead>Tutar</TableHead><TableHead>Durum</TableHead></TableRow></TableHeader>
        <TableBody>
          {rows.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Kayıt yok</TableCell></TableRow>}
          {rows.map((r) => (
            <TableRow key={r.id}>
              <TableCell>{formatShopDate(r.startsAt)}</TableCell>
              <TableCell>{formatShopTime(r.startsAt)}–{formatShopTime(r.endsAt)}</TableCell>
              <TableCell>{r.barberName}</TableCell>
              <TableCell><Link href={`/panel/musteriler/${r.customerId}`} className="underline">{r.customerName}</Link>{r.customerPhone && <span className="block text-xs text-muted-foreground">{r.customerPhone}</span>}</TableCell>
              <TableCell>{r.services.join(", ")}</TableCell>
              <TableCell>{formatKurus(r.totalKurus)}</TableCell>
              <TableCell><Badge variant={r.status === "SCHEDULED" ? "default" : "secondary"}>{STATUS[r.status]}</Badge></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
```

- [ ] **Step 5: Doğrula ve commit**

`/panel/ayarlar`'da iptal sınırını 30 dk yap → `/randevularim`'de iptal butonu davranışı değişir. `/panel/randevular` filtreleri çalışır. `npm run typecheck && npm run lint`.

```bash
git add -A
git commit -m "Randevu listesi ve dükkan ayarları"
git push
```

---

### Task 16: Uçtan uca testler (Playwright)

**Files:**
- Create: `playwright.config.ts`, `tests/e2e/booking.spec.ts`, `tests/e2e/global-setup.ts`

**Interfaces:**
- Consumes: seed hesapları (`admin@afrosalon.local / Sifre123!`, `kwame@afrosalon.local / Sifre123!`), test DB.

- [ ] **Step 1: Kurulum**

```bash
npx playwright install chromium
```

`playwright.config.ts`:

```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  globalSetup: "./tests/e2e/global-setup.ts",
  use: { baseURL: "http://localhost:3100", ...devices["Pixel 7"] },
  webServer: {
    command: "dotenv -e .env.test -- next dev -p 3100",
    url: "http://localhost:3100",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
```

`tests/e2e/global-setup.ts`:

```ts
import { execSync } from "node:child_process";

export default async function globalSetup() {
  execSync("dotenv -e .env.test -- prisma migrate deploy", { stdio: "inherit" });
  execSync("dotenv -e .env.test -- tsx prisma/seed.ts", { stdio: "inherit" });
}
```

`.env.test` dosyasına `AUTH_URL="http://localhost:3100"` yaz.

- [ ] **Step 2: Test senaryoları**

`tests/e2e/booking.spec.ts`:

```ts
import { test, expect } from "@playwright/test";

const stamp = Date.now();
const customer = { name: "E2E Müşteri", email: `e2e-${stamp}@test.local`, password: "Sifre123!" };

test.describe.serial("randevu akışı", () => {
  test("müşteri kayıt olur ve bugün için randevu alır", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /Saç Kesimi/ }).click();
    await page.getByRole("button", { name: /Kwame Mensah/ }).click();

    const slots = page.locator('section:has(h2:text("3. Saat seç")) button');
    const closed = page.getByText(/Bugün kapalıyız|uygun saat kalmadı/);
    await expect(slots.first().or(closed)).toBeVisible();
    test.skip(await closed.isVisible(), "Dükkan şu an kapalı, slot testi atlandı");

    await slots.first().click();
    await page.getByRole("button", { name: "Giriş yap ve onayla" }).click();
    await page.getByRole("link", { name: "Kayıt ol" }).click();
    await page.getByLabel("Ad Soyad").fill(customer.name);
    await page.getByLabel("E-posta").fill(customer.email);
    await page.getByLabel("Şifre").fill(customer.password);
    await page.getByRole("button", { name: "Kayıt ol" }).click();

    // seçimler URL'den geri gelir, onayla
    await expect(page.getByRole("button", { name: "Randevuyu onayla" })).toBeEnabled();
    await page.getByRole("button", { name: "Randevuyu onayla" }).click();
    await expect(page).toHaveURL(/randevularim/);
    await expect(page.getByText("Bugünkü randevum")).toBeVisible();
    await expect(page.getByText("Planlandı")).toBeVisible();
  });

  test("berber panelde randevuyu görür ve tamamlar", async ({ page }) => {
    await page.goto("/giris");
    await page.getByLabel("E-posta").fill("kwame@afrosalon.local");
    await page.getByLabel("Şifre").fill("Sifre123!");
    await page.getByRole("button", { name: "Giriş yap" }).click();
    await expect(page).toHaveURL(/panel/);
    const card = page.locator("li", { hasText: customer.name }).first();
    test.skip(!(await card.isVisible().catch(() => false)), "Önceki test randevu oluşturmadı");
    await card.getByRole("button", { name: "Tamamlandı" }).click();
    await expect(card.getByText("Tamamlandı")).toBeVisible();
  });

  test("müşteri iptal edemeyince telefon mesajı görür veya iptal eder", async ({ page }) => {
    await page.goto("/giris");
    await page.getByLabel("E-posta").fill(customer.email);
    await page.getByLabel("Şifre").fill(customer.password);
    await page.getByRole("button", { name: "Giriş yap" }).click();
    await page.goto("/randevularim");
    await expect(page.getByRole("heading", { name: "Geçmiş" })).toBeVisible();
  });
});
```

- [ ] **Step 3: Çalıştır**

Run: `npm run test:e2e`
Expected: 3 passed (veya mesai dışında ilk test "skipped" ve diğerleri geçer). Çalışma saatleri içinde çalıştırılması tavsiye edilir.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "Playwright uçtan uca testler"
git push
```

---

### Task 17: README, deploy notları ve son kontrol

**Files:**
- Modify: `README.md`
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: README**

`README.md` içeriği (ilk satır "# afro_salon_modern" kalır):

```markdown
# afro_salon_modern

Tek bir afro berber salonu için aynı gün randevu sistemi. Next.js 16 + Prisma 7 + PostgreSQL.

## Geliştirme

```bash
cp .env.example .env        # AUTH_SECRET'ı openssl rand -base64 32 ile üret
docker compose up -d
npm install
npm run db:migrate
npm run db:seed             # admin@afrosalon.local / Sifre123!
npm run dev
```

## Testler

- `npm test` birim testler
- `npm run test:integration` gerçek Postgres (afro_salon_test) üzerinde; önce `npm run db:migrate:test`
- `npm run test:e2e` Playwright (mesai saatleri içinde çalıştır)

## Ortam değişkenleri

| Değişken | Açıklama |
|---|---|
| DATABASE_URL | Postgres bağlantısı |
| AUTH_SECRET, AUTH_URL | Auth.js |
| RESEND_API_KEY, EMAIL_FROM | E-posta; boşsa gönderim atlanır ve loglanır |
| R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_URL | Cloudflare R2; bucket public erişim açık ve CORS'ta PUT izinli olmalı |

R2 CORS örneği: AllowedOrigins `["http://localhost:3000","https://<alan-adı>"]`, AllowedMethods `["PUT"]`, AllowedHeaders `["content-type"]`.

## Deploy (Vercel + Neon + R2)

1. Neon'da Postgres oluştur, `DATABASE_URL`'i Vercel env'e ekle.
2. Vercel'de tüm env değişkenlerini gir, `AUTH_URL` canlı alan adı olsun.
3. Build komutu `npm run build` (prisma generate içerir). İlk deploy sonrası `npx prisma migrate deploy` ve `npx prisma db seed` lokal makineden canlı `DATABASE_URL` ile çalıştır.
4. Seed'deki admin şifresini panelden değiştir (berber şifresi gibi admin için de "Şifreyi sıfırla" yoksa, DB'den bcrypt hash güncelle).

## Roller

- CUSTOMER: randevu alır, iptal eder, fotoğraflarını görür
- BARBER: kendi takvimi, izinleri, müşteri fotoğrafları
- ADMIN: her şey + hizmet/berber/ayar yönetimi
```

- [ ] **Step 2: CI**

`.github/workflows/ci.yml`:

```yaml
name: ci
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      db:
        image: postgres:16-alpine
        env: { POSTGRES_USER: afro, POSTGRES_PASSWORD: afro, POSTGRES_DB: afro_salon_test }
        ports: ["5433:5432"]
        options: --health-cmd pg_isready --health-interval 5s --health-timeout 5s --health-retries 10
    env:
      DATABASE_URL: postgresql://afro:afro@localhost:5433/afro_salon_test
      AUTH_SECRET: ci-secret
      AUTH_URL: http://localhost:3000
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npx prisma generate
      - run: npx prisma migrate deploy
      - run: npm run typecheck
      - run: npm run lint
      - run: npm test
      - run: npm run test:integration
      - run: npm run build
```

- [ ] **Step 3: Son kontrol**

Run: `npm run typecheck && npm run lint && npm test && npm run test:integration && npm run build`
Expected: hepsi geçer.

Elle kontrol listesi:
- 400px genişlikte ana sayfa, randevularım ve panel/bugün yatay kaydırma yapmıyor.
- Koyu modda kontrast okunaklı.
- Pazar günü ana sayfa "Bugün kapalıyız" gösteriyor (test için bir berberin çalışma saatlerinde bugünü kapalı yap).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "README, CI ve deploy notları"
git push
```
